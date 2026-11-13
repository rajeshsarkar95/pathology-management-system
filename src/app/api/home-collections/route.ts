import { NextRequest, NextResponse } from "next/server";
import { Document, Filter } from "mongodb";
import { getDb } from "../../../lib/mongodb";
import { MAX_PER_SLOT, STATUSES, parseCollection } from "../../../lib/validation";
import {IHomeCollection}  from "@/lib/models/HomeCollection"

export const dynamic = "force-dynamic";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const date = searchParams.get("date") || "";
    const status = searchParams.get("status") || "";
    const search = (searchParams.get("search") || "").trim();

    const filter: Filter<Document> = {};
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) filter.date = date;
    if ((STATUSES as readonly string[]).includes(status)) filter.status = status;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ id: rx }, { patientName: rx }, { phone: rx }, { pincode: rx }];
    }

    const db = await getDb();
    const col = db.collection("home_collections");
    const [bookings, total] = await Promise.all([
      col.find(filter, { projection: { _id: 0 } }).sort({ date: 1, slot: 1 }).limit(500).toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({ bookings, total });
  } catch (err) {
    console.error("GET /api/home-collections", err);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = parseCollection(body);
    if (parsed.errors) {
      return NextResponse.json({ error: "Validation failed", fields: parsed.errors }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection("home_collections")  
    const taken = await col.countDocuments({
      date: parsed.data.date,
      slot: parsed.data.slot,
      status: { $ne: "Cancelled"},
    });
    if (taken >= MAX_PER_SLOT) {
      return NextResponse.json(
        { error: "This slot is full, pick another", fields: { slot: "This slot is full" } },
        { status: 409 }
      );
    }

    const seqResult = await db.collection<{ _id: string; seq: number }>("counters").findOneAndUpdate(
      { _id: "home_collections" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const seqDoc = (seqResult as unknown as { value?: { seq?: number } }).value ?? seqResult;
    const seq = seqDoc?.seq ?? 1;
    const booking = {
      ...parsed.data,
      id: `HSC-${String(seq).padStart(6, "0")}`,
      status: "Scheduled",
      createdAt: new Date().toISOString(),
    };
    await col.insertOne({ ...booking });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error("POST /api/home-collections", err);
    return NextResponse.json({ error: "Failed to schedule collection" }, { status: 500 });
  }
}