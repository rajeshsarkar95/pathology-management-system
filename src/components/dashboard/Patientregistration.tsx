"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Gender = "Male" | "Female" | "Other";

interface Patient {
  id: string; 
  firstName: string;
  lastName: string;
  dob: string;
  gender: Gender;
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
  registeredAt: string; // ISO date
}

type FormValues = Omit<Patient, "id" | "registeredAt">;
type FormErrors = Partial<Record<keyof FormValues, string>>;
type ChangeEv = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

const STORAGE_KEY = "lms_patients";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const EMPTY_FORM: FormValues = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "Male",
  phone: "",
  email: "",
  bloodGroup: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  referringDoctor: "",
  emergencyName: "",
  emergencyPhone: "",
  allergies: "",
  notes: "",
};


function nextPatientId(patients: Patient[]): string {
  const max = patients.reduce((m, p) => {
    const n = parseInt(p.id.replace("PAT-", ""), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `PAT-${String(max + 1).padStart(6, "0")}`;
}

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function validate(v: FormValues): FormErrors {
  const e: FormErrors = {};
  if (!v.firstName.trim()) e.firstName = "First name is required";
  if (!v.lastName.trim()) e.lastName = "Last name is required";

  if (!v.dob) e.dob = "Date of birth is required";
  else if (new Date(v.dob) > new Date()) e.dob = "Date cannot be in the future";

  if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = "Enter a valid 10-digit mobile number";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Enter a valid email";
  if (v.pincode && !/^\d{6}$/.test(v.pincode)) e.pincode = "Pincode must be 6 digits";
  if (v.emergencyPhone && !/^[6-9]\d{9}$/.test(v.emergencyPhone))
    e.emergencyPhone = "Enter a valid 10-digit number";
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
  as = "input",
  className = "",
  children,
}: {
  label: string;
  name: keyof FormValues;
  value: string;
  onChange: (e: ChangeEv) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  maxLength?: number;
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
        <input {...common} type={type} placeholder={placeholder} maxLength={maxLength} />
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


export default function PatientRegistration() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPatients(JSON.parse(raw) as Patient[]);
    } catch {
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleChange = (e: ChangeEv) => {
    const { name, value } = e.target;
    const next = ["phone", "emergencyPhone", "pincode"].includes(name)
      ? value.replace(/\D/g, "") 
      : value;
    setValues((v) => ({ ...v, [name]: next }));
    if (errors[name as keyof FormValues]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const resetForm = () => {
    setValues(EMPTY_FORM);
    setErrors({});
    setEditing(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (editing) {
      setPatients((list) => list.map((p) => (p.id === editing.id ? { ...p, ...values } : p)));
      setToast(`Patient ${editing.id} updated`);
    } else {
      const id = nextPatientId(patients);
      setPatients((list) => [{ ...values, id, registeredAt: new Date().toISOString() }, ...list]);
      setToast(`Patient registered with ID ${id}`);
    }
    resetForm();
  };

  const handleEdit = (p: Patient) => {
    const { id, registeredAt, ...rest } = p;
    setEditing(p);
    setValues(rest);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (p: Patient) => {
    if (!window.confirm(`Delete ${p.firstName} ${p.lastName} (${p.id})?`)) return;
    setPatients((list) => list.filter((x) => x.id !== p.id));
    if (editing?.id === p.id) resetForm();
    setToast("Patient deleted");
  };

  const age = calcAge(values.dob);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, query]);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Patient Registration</h1>
        <p className="mt-1 text-slate-500">Register new patients and manage existing records.</p>
      </header>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {editing ? `Edit Patient (${editing.id})` : "Register New Patient"}
        </h2>

        <SectionTitle>Personal details</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First name" name="firstName" value={values.firstName} error={errors.firstName} onChange={handleChange} required />
          <Field label="Last name" name="lastName" value={values.lastName} error={errors.lastName} onChange={handleChange} required />
          <Field label={`Date of birth${age !== null ? ` (Age: ${age})` : ""}`} name="dob" type="date" value={values.dob} error={errors.dob} onChange={handleChange} required />
          <Field label="Gender" name="gender" as="select" value={values.gender} onChange={handleChange} required>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </Field>
          <Field label="Blood group" name="bloodGroup" as="select" value={values.bloodGroup} onChange={handleChange}>
            <option value="">Select</option>
            {BLOOD_GROUPS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </Field>
          <Field label="Referring doctor" name="referringDoctor" value={values.referringDoctor} onChange={handleChange} placeholder="Dr. Name" />
        </div>

        <SectionTitle>Contact</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Mobile number" name="phone" value={values.phone} error={errors.phone} onChange={handleChange} maxLength={10} placeholder="10-digit number" required />
          <Field label="Email" name="email" type="email" value={values.email} error={errors.email} onChange={handleChange} placeholder="name@example.com" />
          <Field label="Address" name="address" value={values.address} onChange={handleChange} className="sm:col-span-2 lg:col-span-2" />
          <Field label="City" name="city" value={values.city} onChange={handleChange} />
          <Field label="State" name="state" value={values.state} onChange={handleChange} />
          <Field label="Pincode" name="pincode" value={values.pincode} error={errors.pincode} onChange={handleChange} maxLength={6} />
        </div>

        <SectionTitle>Emergency contact & medical info</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Contact name" name="emergencyName" value={values.emergencyName} onChange={handleChange} />
          <Field label="Contact number" name="emergencyPhone" value={values.emergencyPhone} error={errors.emergencyPhone} onChange={handleChange} maxLength={10} />
          <Field label="Known allergies" name="allergies" value={values.allergies} onChange={handleChange} placeholder="e.g. Penicillin" className="sm:col-span-2 lg:col-span-1" />
          <Field label="Notes" name="notes" as="textarea" value={values.notes} onChange={handleChange} className="sm:col-span-2 lg:col-span-3" />
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
            {editing ? "Update patient" : "Register patient"}
          </button>
        </div>
      </form>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Registered patients ({patients.length})
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID or phone…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 sm:w-72"
          />
        </div>

        {!hydrated ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {patients.length === 0 ? "No patients registered yet." : "No matching patients."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  {["Patient ID", "Name", "Age / Gender", "Phone", "Doctor", "Registered"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 font-mono font-medium text-blue-700">{p.id}</td>
                    <td className="px-3 py-3">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-3 py-3">
                      {calcAge(p.dob) ?? "-"} / {p.gender}
                    </td>
                    <td className="px-3 py-3">{p.phone}</td>
                    <td className="px-3 py-3">{p.referringDoctor || "-"}</td>
                    <td className="px-3 py-3">{new Date(p.registeredAt).toLocaleDateString()}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <button onClick={() => handleEdit(p)} className="px-2 py-1 text-blue-700 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p)} className="px-2 py-1 text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
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