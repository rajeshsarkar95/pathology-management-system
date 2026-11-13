// Place at: src/app/api/patients/[id]/route.ts   (rename to route.ts)
//
// GET    /api/patients/PAT-000001   -> { patient }
// PUT    /api/patients/PAT-000001   -> { patient }   (full update)
// DELETE /api/patients/PAT-000001   -> { success: true }
//
// Next.js 15+: params is a Promise. (On Next 14, use `{ params }: { params: { id: string } }`
// and drop the `await`.)

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { parsePatient } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// TODO: verify the session here (same as the list route).

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const db = await getDb();
    const patient = await db.collection("patients").findOne({ id }, { projection: { _id: 0 } });
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    return NextResponse.json({ patient });
  } catch (err) {
    console.error("GET /api/patients/[id]", err);
    return NextResponse.json({ error: "Failed to load patient" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = parsePatient(body);
    if (parsed.errors) {
      return NextResponse.json({ error: "Validation failed", fields: parsed.errors }, { status: 400 });
    }

    const db = await getDb();
    const patient = await db
      .collection("patients")
      .findOneAndUpdate({ id }, { $set: parsed.data }, { returnDocument: "after", projection: { _id: 0 } });

    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    return NextResponse.json({ patient });
  } catch (err) {
    console.error("PUT /api/patients/[id]", err);
    return NextResponse.json({ error: "Failed to update patient" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Don't delete a patient who still has active home-collection bookings
    const active = await db.collection("home_collections").countDocuments({
      patientId: id,
      status: { $in: ["Scheduled", "On the way"] },
    });
    if (active > 0) {
      return NextResponse.json(
        { error: "Patient has active home-collection bookings. Cancel them first." },
        { status: 409 }
      );
    }

    const result = await db.collection("patients").deleteOne({ id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/patients/[id]", err);
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 });
  }
}