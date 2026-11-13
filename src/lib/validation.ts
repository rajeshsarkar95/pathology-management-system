// Place at: src/lib/validation.ts
// Server-side validation. Only whitelisted fields are ever returned,
// so clients cannot inject extra fields (id, status, _id, etc.).

export type FieldErrors = Record<string, string>;
export type ParseResult<T> = { data: T; errors?: undefined } | { data?: undefined; errors: FieldErrors };

const TIMEZONE = "Asia/Kolkata";

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const digits = (v: unknown) => str(v, 20).replace(/\D/g, "");

/** Today as yyyy-mm-dd in the lab's timezone */
export function todayInLab(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

const PHONE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;


export const GENDERS = ["Male", "Female", "Other"] as const;
export const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export interface PatientInput {
  firstName: string;
  lastName: string;
  dob: string;
  gender: (typeof GENDERS)[number];
  phone: string;
  email: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  referringDoctor: string;
  emergencyName: string;
  emergencyPhone: string;
  allergies: string;
  notes: string;
}

export function parsePatient(body: unknown): ParseResult<PatientInput> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const gender = str(b.gender) as PatientInput["gender"];

  const data: PatientInput = {
    firstName: str(b.firstName, 100),
    lastName: str(b.lastName, 100),
    dob: str(b.dob, 10),
    gender,
    phone: digits(b.phone),
    email: str(b.email, 200).toLowerCase(),
    bloodGroup: str(b.bloodGroup, 5),
    address: str(b.address, 300),
    city: str(b.city, 100),
    state: str(b.state, 100),
    pincode: digits(b.pincode),
    referringDoctor: str(b.referringDoctor, 100),
    emergencyName: str(b.emergencyName, 100),
    emergencyPhone: digits(b.emergencyPhone),
    allergies: str(b.allergies, 300),
    notes: str(b.notes, 1000),
  };

  const e: FieldErrors = {};
  if (!data.firstName) e.firstName = "First name is required";
  if (!data.lastName) e.lastName = "Last name is required";

  if (!DATE_RE.test(data.dob) || Number.isNaN(new Date(data.dob).getTime())) e.dob = "Valid date of birth is required";
  else if (data.dob > todayInLab()) e.dob = "Date of birth cannot be in the future";

  if (!GENDERS.includes(gender)) e.gender = "Gender must be Male, Female or Other";
  if (!PHONE_RE.test(data.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (data.email && !EMAIL_RE.test(data.email)) e.email = "Enter a valid email";
  if (!BLOOD_GROUPS.includes(data.bloodGroup)) e.bloodGroup = "Invalid blood group";
  if (data.pincode && !/^\d{6}$/.test(data.pincode)) e.pincode = "Pincode must be 6 digits";
  if (data.emergencyPhone && !PHONE_RE.test(data.emergencyPhone)) e.emergencyPhone = "Enter a valid 10-digit number";

  return Object.keys(e).length ? { errors: e } : { data };
}

/* ================================================================== */
/* Home sample collection                                              */
/* ================================================================== */

export const SLOTS = [
  "06:00 AM – 08:00 AM",
  "08:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 02:00 PM",
  "02:00 PM – 04:00 PM",
  "04:00 PM – 06:00 PM",
];
export const MAX_PER_SLOT = 3;

export const STATUSES = ["Scheduled", "On the way", "Collected", "Cancelled"] as const;
export type BookingStatus = (typeof STATUSES)[number];

export interface CollectionInput {
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
}

export function parseCollection(body: unknown): ParseResult<CollectionInput> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const tests = Array.isArray(b.tests)
    ? Array.from(new Set(b.tests.map((t) => str(t, 100)).filter(Boolean))).slice(0, 50)
    : [];

  const data: CollectionInput = {
    patientId: str(b.patientId, 20),
    patientName: str(b.patientName, 200),
    phone: digits(b.phone),
    address: str(b.address, 300),
    city: str(b.city, 100),
    pincode: digits(b.pincode),
    landmark: str(b.landmark, 150),
    date: str(b.date, 10),
    slot: str(b.slot, 40),
    tests,
    fasting: b.fasting === true,
    phlebotomist: str(b.phlebotomist, 100) || "Unassigned",
    notes: str(b.notes, 1000),
  };

  const e: FieldErrors = {};
  if (!data.patientName) e.patientName = "Patient name is required";
  if (!PHONE_RE.test(data.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (!data.address) e.address = "Collection address is required";
  if (!data.city) e.city = "City is required";
  if (!/^\d{6}$/.test(data.pincode)) e.pincode = "Pincode must be 6 digits";

  if (!DATE_RE.test(data.date) || Number.isNaN(new Date(data.date).getTime())) e.date = "Select a valid collection date";
  else if (data.date < todayInLab()) e.date = "Date cannot be in the past";

  if (!SLOTS.includes(data.slot)) e.slot = "Select a valid time slot";
  if (data.tests.length === 0) e.tests = "Select at least one test";

  return Object.keys(e).length ? { errors: e } : { data };
}