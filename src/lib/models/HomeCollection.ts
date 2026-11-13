// Place at: src/models/HomeCollection.ts

import mongoose, { Model, Schema } from "mongoose";
import { MAX_PER_SLOT, SLOTS, STATUSES, BookingStatus } from "@/lib/validation";
import { nextSequence } from "@/lib/models/Counter";

export interface IHomeCollection {
  id: string; 
  patientId: string; 
  patientName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  landmark: string;
  date: string; 
  slot: string;
  tests: string[];
  fasting: boolean;
  phlebotomist: string;
  notes: string;
  status: BookingStatus;
  collectedAt?: Date;
  createdAt: Date;
}

const HomeCollectionSchema = new Schema<IHomeCollection>(
  {
    id: { type: String, required: true, unique: true, index: true },
    patientId: { type: String, default: "", index: true },
    patientName: { type: String, required: true, trim: true, maxlength: 200 },
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    pincode: { type: String, required: true, match: /^\d{6}$/ },
    landmark: { type: String, trim: true, default: "", maxlength: 150 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    slot: { type: String, enum: SLOTS, required: true },
    tests: {
      type: [String],
      validate: { validator: (v: string[]) => v.length > 0, message: "Select at least one test" },
    },
    fasting: { type: Boolean, default: false },
    phlebotomist: { type: String, trim: true, default: "Unassigned", maxlength: 100 },
    notes: { type: String, trim: true, default: "", maxlength: 1000 },
    status: { type: String, enum: STATUSES, default: "Scheduled" },
    collectedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "home_collections",
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

// Fast slot-capacity lookups and the schedule list (sorted by date, then slot)
HomeCollectionSchema.index({ date: 1, slot: 1, status: 1 });
HomeCollectionSchema.index({ status: 1, date: 1 });

export async function nextBookingId(): Promise<string> {
  const seq = await nextSequence("home_collections");
  return `HSC-${String(seq).padStart(6, "0")}`;
}

/** How many active (non-cancelled) bookings a date + slot already has. */
HomeCollectionSchema.statics.slotCount = function (date: string, slot: string, excludeId?: string) {
  return this.countDocuments({
    date,
    slot,
    status: { $ne: "Cancelled" },
    ...(excludeId ? { id: { $ne: excludeId } } : {}),
  });
};

interface HomeCollectionModel extends Model<IHomeCollection> {
  slotCount(date: string, slot: string, excludeId?: string): Promise<number>;
}

const HomeCollection: HomeCollectionModel =
  (mongoose.models.HomeCollection as HomeCollectionModel) ||
  mongoose.model<IHomeCollection, HomeCollectionModel>("HomeCollection", HomeCollectionSchema);

export default HomeCollection;
export { MAX_PER_SLOT };