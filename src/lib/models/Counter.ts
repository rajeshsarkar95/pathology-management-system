// Place at: src/models/Counter.ts
// Atomic auto-increment counters used for PAT-000001 / HSC-000001 style IDs.
// Same shape ({ _id: string, seq: number }) as the counters collection used by the native-driver routes.

import mongoose, { Model, Schema } from "mongoose";

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: "counters", versionKey: false }
);

const Counter: Model<ICounter> =
  (mongoose.models.Counter as Model<ICounter>) || mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;

/** nextSequence("patients") -> 1, 2, 3 … (safe under concurrent requests) */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  if (!doc) throw new Error("Could not generate sequence number");
  return doc.seq;
}