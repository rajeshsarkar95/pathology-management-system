"use client";


import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Status = "Scheduled" | "On the way" | "Collected" | "Cancelled";

interface Booking {
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
  status: Status;
  createdAt: string;
}

type FormValues = Omit<Booking, "id" | "status" | "createdAt">;
type FormErrors = Partial<Record<keyof FormValues, string>>;
type ChangeEv = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

interface RegisteredPatient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
}

const STORAGE_KEY = "lms_home_collections";
const PATIENTS_KEY = "lms_patients";
const MAX_PER_SLOT = 3; 

const SLOTS = [
  "06:00 AM – 08:00 AM",
  "08:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "12:00 PM – 02:00 PM",
  "02:00 PM – 04:00 PM",
  "04:00 PM – 06:00 PM",
];

const PHLEBOTOMISTS = ["Unassigned", "Ravi Kumar", "Sunita Sharma", "Amit Verma", "Neha Singh"];

const TEST_OPTIONS = [
  "Complete Blood Count (CBC)",
  "Blood Sugar (Fasting)",
  "Blood Sugar (PP)",
  "HbA1c",
  "Lipid Profile",
  "Liver Function Test",
  "Kidney Function Test",
  "Thyroid Profile (T3, T4, TSH)",
  "Vitamin D",
  "Vitamin B12",
  "Urine Routine",
];

const EMPTY_FORM: FormValues = {
  patientId: "",
  patientName: "",
  phone: "",
  address: "",
  city: "",
  pincode: "",
  landmark: "",
  date: "",
  slot: "",
  tests: [],
  fasting: false,
  phlebotomist: "Unassigned",
  notes: "",
};

const STATUS_STYLES: Record<Status, string> = {
  Scheduled: "bg-blue-50 text-blue-700",
  "On the way": "bg-amber-50 text-amber-700",
  Collected: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-slate-100 text-slate-500",
};

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function nextBookingId(bookings: Booking[]): string {
  const max = bookings.reduce((m, b) => {
    const n = parseInt(b.id.replace("HSC-", ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `HSC-${String(max + 1).padStart(6, "0")}`;
}

function validate(v: FormValues, today: string): FormErrors {
  const e: FormErrors = {};
  if (!v.patientName.trim()) e.patientName = "Patient name is required";
  if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (!v.address.trim()) e.address = "Collection address is required";
  if (!v.city.trim()) e.city = "City is required";
  if (!/^\d{6}$/.test(v.pincode)) e.pincode = "Pincode must be 6 digits";
  if (!v.date) e.date = "Select a collection date";
  else if (v.date < today) e.date = "Date cannot be in the past";
  if (!v.slot) e.slot = "Select a time slot";
  if (v.tests.length === 0) e.tests = "Select at least one test";
  return e;
}

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition " +
  "focus:border-blue-700 focus:ring-4 focus:ring-blue-100";

function Field({
  label,
  name,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  maxLength,
  min,
  as = "input",
  className = "",
  children,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEv) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  min?: string;
  as?: "input" | "select" | "textarea";
  className?: string;
  children?: ReactNode;
}) {
  const cls = `${inputBase} ${error ? "border-red-500" : "border-slate-200"}`;
  const common = { id: name, name, value, onChange, className: cls, "aria-invalid": !!error };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {as === "select" ? (
        <select {...common}>{children}</select>
      ) : as === "textarea" ? (
        <textarea {...common} rows={3} placeholder={placeholder} />
      ) : (
        <input {...common} type={type} placeholder={placeholder} maxLength={maxLength} min={min} />
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </h3>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export default function HomeSampleCollection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [registered, setRegistered] = useState<RegisteredPatient[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState("");
  const [editing, setEditing] = useState<Booking | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | Status>("All");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setToday(toDateInput(new Date()));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBookings(JSON.parse(raw) as Booking[]);
      const pts = localStorage.getItem(PATIENTS_KEY);
      if (pts) setRegistered(JSON.parse(pts) as RegisteredPatient[]);
    } catch {
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const slotCount = (date: string, slot: string) =>
    bookings.filter(
      (b) =>
        b.date === date &&
        b.slot === slot &&
        b.status !== "Cancelled" &&
        b.id !== editing?.id
    ).length;

  const slotFull = (slot: string) => !!values.date && slotCount(values.date, slot) >= MAX_PER_SLOT;

  const handleChange = (e: ChangeEv) => {
    const { name, value } = e.target;
    const next = ["phone", "pincode"].includes(name) ? value.replace(/\D/g, "") : value;
    setValues((v) => {
      const updated = { ...v, [name]: next };
      if (name === "date" && v.slot && next) {
        const count = bookings.filter(
          (b) => b.date === next && b.slot === v.slot && b.status !== "Cancelled" && b.id !== editing?.id
        ).length;
        if (count >= MAX_PER_SLOT) updated.slot = "";
      }
      return updated;
    });
    if (errors[name as keyof FormValues]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handlePatientSelect = (e: ChangeEv) => {
    const id = e.target.value;
    const p = registered.find((x) => x.id === id);
    if (!p) {
      setValues((v) => ({ ...v, patientId: "" }));
      return;
    }
    setValues((v) => ({
      ...v,
      patientId: p.id,
      patientName: `${p.firstName} ${p.lastName}`.trim(),
      phone: p.phone,
      address: p.address,
      city: p.city,
      pincode: p.pincode,
    }));
    setErrors({});
  };

  const toggleTest = (test: string) => {
    setValues((v) => ({
      ...v,
      tests: v.tests.includes(test) ? v.tests.filter((t) => t !== test) : [...v.tests, test],
    }));
    if (errors.tests) setErrors((er) => ({ ...er, tests: undefined }));
  };

  const resetForm = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    setEditing(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values, today);
    if (!found.slot && slotFull(values.slot)) found.slot = "This slot is full, pick another";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (editing) {
      setBookings((list) => list.map((b) => (b.id === editing.id ? { ...b, ...values } : b)));
      setToast(`Booking ${editing.id} updated`);
    } else {
      const id = nextBookingId(bookings);
      setBookings((list) => [
        { ...values, id, status: "Scheduled", createdAt: new Date().toISOString() },
        ...list,
      ]);
      setToast(`Collection scheduled: ${id}`);
    }
    resetForm();
  };

  const handleEdit = (b: Booking) => {
    const { id, status, createdAt, ...rest } = b;
    setEditing(b);
    setValues(rest);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- status actions ---------- */
  const setStatus = (b: Booking, status: Status) => {
    setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status } : x)));
    setToast(`${b.id} marked as ${status}`);
    if (editing?.id === b.id) resetForm();
  };

  const assign = (b: Booking, phlebotomist: string) => {
    setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, phlebotomist } : x)));
  };

  const handleDelete = (b: Booking) => {
    if (!window.confirm(`Delete booking ${b.id} for ${b.patientName}?`)) return;
    setBookings((list) => list.filter((x) => x.id !== b.id));
    if (editing?.id === b.id) resetForm();
    setToast("Booking deleted");
  };

  /* ---------- derived ---------- */
  const stats = useMemo(
    () => ({
      today: bookings.filter((b) => b.date === today && b.status !== "Cancelled").length,
      scheduled: bookings.filter((b) => b.status === "Scheduled").length,
      onTheWay: bookings.filter((b) => b.status === "On the way").length,
      collected: bookings.filter((b) => b.status === "Collected").length,
    }),
    [bookings, today]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => (filterStatus === "All" ? true : b.status === filterStatus))
      .filter((b) => (filterDate ? b.date === filterDate : true))
      .filter(
        (b) =>
          !q ||
          b.id.toLowerCase().includes(q) ||
          b.patientName.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.pincode.includes(q)
      )
      .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot));
  }, [bookings, query, filterDate, filterStatus]);

  /* ---------- render ---------- */
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Home Sample Collection</h1>
        <p className="mt-1 text-slate-500">
          Schedule home visits, assign phlebotomists and track sample collection.
        </p>
      </header>

      {/* ------------------------- Stats ------------------------- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's collections" value={stats.today} tone="text-slate-900" />
        <StatCard label="Scheduled" value={stats.scheduled} tone="text-blue-700" />
        <StatCard label="On the way" value={stats.onTheWay} tone="text-amber-600" />
        <StatCard label="Collected" value={stats.collected} tone="text-emerald-600" />
      </div>

      {/* ------------------------- Form ------------------------- */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {editing ? `Reschedule / Edit (${editing.id})` : "Schedule New Collection"}
        </h2>

        <SectionTitle>Patient</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {registered.length > 0 && (
            <Field
              label="Registered patient (optional)"
              name="patientId"
              as="select"
              value={values.patientId}
              onChange={handlePatientSelect}
              className="sm:col-span-2 lg:col-span-3"
            >
              <option value="">Select to auto-fill, or enter details below</option>
              {registered.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.firstName} {p.lastName} · {p.phone}
                </option>
              ))}
            </Field>
          )}
          <Field label="Patient name" name="patientName" value={values.patientName} error={errors.patientName} onChange={handleChange} required />
          <Field label="Mobile number" name="phone" value={values.phone} error={errors.phone} onChange={handleChange} maxLength={10} placeholder="10-digit number" required />
        </div>

        <SectionTitle>Collection address</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Address" name="address" value={values.address} error={errors.address} onChange={handleChange} className="sm:col-span-2 lg:col-span-3" placeholder="House no., street, area" required />
          <Field label="City" name="city" value={values.city} error={errors.city} onChange={handleChange} required />
          <Field label="Pincode" name="pincode" value={values.pincode} error={errors.pincode} onChange={handleChange} maxLength={6} required />
          <Field label="Landmark" name="landmark" value={values.landmark} onChange={handleChange} placeholder="Near…" />
        </div>

        <SectionTitle>Schedule</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Collection date" name="date" type="date" min={today} value={values.date} error={errors.date} onChange={handleChange} required />
          <Field label="Time slot" name="slot" as="select" value={values.slot} error={errors.slot} onChange={handleChange} required>
            <option value="">Select a slot</option>
            {SLOTS.map((s) => {
              const full = slotFull(s);
              return (
                <option key={s} value={s} disabled={full}>
                  {s}
                  {full ? " (Full)" : ""}
                </option>
              );
            })}
          </Field>
          <Field label="Assign phlebotomist" name="phlebotomist" as="select" value={values.phlebotomist} onChange={handleChange}>
            {PHLEBOTOMISTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Field>
        </div>

        <SectionTitle>Tests</SectionTitle>
        <div
          className={`grid grid-cols-1 gap-2 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3 ${
            errors.tests ? "border-red-500" : "border-slate-200"
          }`}
        >
          {TEST_OPTIONS.map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={values.tests.includes(t)}
                onChange={() => toggleTest(t)}
                className="h-4 w-4 accent-blue-700"
              />
              {t}
            </label>
          ))}
        </div>
        {errors.tests && <p className="mt-1.5 text-xs text-red-600">{errors.tests}</p>}

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.fasting}
            onChange={(e) => setValues((v) => ({ ...v, fasting: e.target.checked }))}
            className="h-4 w-4 accent-blue-700"
          />
          Fasting required (10–12 hours, water allowed)
        </label>

        <div className="mt-4">
          <Field label="Notes" name="notes" as="textarea" value={values.notes} onChange={handleChange} placeholder="Gate code, elderly patient, preferred call time…" />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {editing ? "Cancel" : "Reset"}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            {editing ? "Update booking" : "Schedule collection"}
          </button>
        </div>
      </form>

      {/* ------------------------- List ------------------------- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Collection schedule ({filtered.length})
          </h2>
          <div className="flex w-full flex-wrap gap-3 sm:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, phone, pincode…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 sm:w-64"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              aria-label="Filter by date"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "All" | Status)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              aria-label="Filter by status"
            >
              <option>All</option>
              <option>Scheduled</option>
              <option>On the way</option>
              <option>Collected</option>
              <option>Cancelled</option>
            </select>
            {(filterDate || filterStatus !== "All" || query) && (
              <button
                onClick={() => {
                  setQuery("");
                  setFilterDate("");
                  setFilterStatus("All");
                }}
                className="px-2 text-sm text-blue-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {!hydrated ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {bookings.length === 0 ? "No collections scheduled yet." : "No matching bookings."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  {["Booking", "Patient", "Date & slot", "Address", "Tests", "Phlebotomist", "Status"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const closed = b.status === "Collected" || b.status === "Cancelled";
                  return (
                    <tr key={b.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-3 py-3 font-mono font-medium text-blue-700">{b.id}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-900">{b.patientName}</div>
                        <div className="text-xs text-slate-500">{b.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div>{formatDate(b.date)}</div>
                        <div className="text-xs text-slate-500">{b.slot}</div>
                      </td>
                      <td className="max-w-[220px] px-3 py-3">
                        <div>{b.address}</div>
                        <div className="text-xs text-slate-500">
                          {b.city} – {b.pincode}
                          {b.landmark && ` · ${b.landmark}`}
                        </div>
                      </td>
                      <td className="max-w-[200px] px-3 py-3">
                        <div className="text-xs">{b.tests.join(", ")}</div>
                        {b.fasting && (
                          <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                            Fasting
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={b.phlebotomist}
                          disabled={closed}
                          onChange={(e) => assign(b, e.target.value)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs disabled:bg-slate-50 disabled:text-slate-400"
                          aria-label={`Phlebotomist for ${b.id}`}
                        >
                          {PHLEBOTOMISTS.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        {b.status === "Scheduled" && (
                          <button onClick={() => setStatus(b, "On the way")} className="px-2 py-1 text-amber-700 hover:underline">
                            Start
                          </button>
                        )}
                        {b.status === "On the way" && (
                          <button onClick={() => setStatus(b, "Collected")} className="px-2 py-1 text-emerald-700 hover:underline">
                            Mark collected
                          </button>
                        )}
                        {!closed && (
                          <>
                            <button onClick={() => handleEdit(b)} className="px-2 py-1 text-blue-700 hover:underline">
                              Reschedule
                            </button>
                            <button onClick={() => setStatus(b, "Cancelled")} className="px-2 py-1 text-slate-500 hover:underline">
                              Cancel
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(b)} className="px-2 py-1 text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}