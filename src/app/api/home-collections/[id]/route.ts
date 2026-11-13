// Place at: src/app/api/home-collections/[id]/route.ts   (rename to route.ts)
//
// GET    /api/home-collections/HSC-000001   -> { booking }
// PUT    /api/home-collections/HSC-000001   -> { booking }   (reschedule / edit; 409 if slot full)
// PATCH  /api/home-collections/HSC-000001   -> { booking }   body: { status?, phlebotomist? }
// DELETE /api/home-collections/HSC-000001   -> { success: true }
//
// Next.js 15+: params is a Promise. (On Next 14, use `{ params }: { params: { id: string } }`
// and drop the `await`.)

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { MAX_PER_SLOT, STATUSES, BookingStatus, parseCollection } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const CLOSED: BookingStatus[] = ["Collected", "Cancelled"];

// Allowed status moves
const NEXT_STATUS: Record<BookingStatus, BookingStatus[]> = {
  Scheduled: ["On the way", "Cancelled"],
  "On the way": ["Collected", "Cancelled"],
  Collected: [],
  Cancelled: [],
};

// TODO: verify the session here (same as the list route).

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const db = await getDb();
    const booking = await db.collection("home_collections").findOne({ id }, { projection: { _id: 0 } });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (err){
    console.error("GET /api/home-collections/[id]", err);
    return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = parseCollection(body);
    if (parsed.errors) {
      return NextResponse.json({ error: "Validation failed", fields: parsed.errors }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection("home_collections");

    const existing = await col.findOne({ id }, { projection: { _id: 0, status: 1 } });
    if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    if (CLOSED.includes(existing.status as BookingStatus)) {
      return NextResponse.json({ error: `A ${existing.status} booking cannot be edited` }, { status: 409 });
    }

    // Slot capacity, excluding this booking itself
    const taken = await col.countDocuments({
      id: { $ne: id },
      date: parsed.data.date,
      slot: parsed.data.slot,
      status: { $ne: "Cancelled" },
    });
    if (taken >= MAX_PER_SLOT) {
      return NextResponse.json(
        { error: "This slot is full, pick another", fields: { slot: "This slot is full" } },
        { status: 409 }
      );
    }

    const booking = await col.findOneAndUpdate(
      { id },
      { $set: parsed.data },
      { returnDocument: "after", projection: { _id: 0 } }
    );
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("PUT /api/home-collections/[id]", err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = (await req.json().catch(() => null)) as { status?: unknown; phlebotomist?: unknown } | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection("home_collections");
    const existing = await col.findOne({ id }, { projection: { _id: 0, status: 1 } });
    if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const update: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const status = body.status as BookingStatus;
      if (!(STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (status !== existing.status && !NEXT_STATUS[existing.status as BookingStatus].includes(status)) {
        return NextResponse.json(
          { error: `Cannot change status from ${existing.status} to ${status}` },
          { status: 409 }
        );
      }
      update.status = status;
      if (status === "Collected") update.collectedAt = new Date().toISOString();
    }

    if (body.phlebotomist !== undefined) {
      if (CLOSED.includes(existing.status as BookingStatus)) {
        return NextResponse.json({ error: `A ${existing.status} booking cannot be reassigned` }, { status: 409 });
      }
      update.phlebotomist =
        typeof body.phlebotomist === "string" ? body.phlebotomist.trim().slice(0, 100) || "Unassigned" : "Unassigned";
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const booking = await col.findOneAndUpdate(
      { id },
      { $set: update },
      { returnDocument: "after", projection: { _id: 0 } }
    );
    return NextResponse.json({ booking });
  } catch (err) {
    console.error("PATCH /api/home-collections/[id]", err);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.collection("home_collections").deleteOne({ id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/home-collections/[id]", err);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}