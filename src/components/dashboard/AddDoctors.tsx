import React, {useEffect, useState} from "react";

type Specialty =
   "Cardiology" |
   "Dermatology" |
   "Neurology" |
   "Orthopedics" |
   "Pediatrics" |
   "Psychiatry" |
   "Radiology" |
   "General Practice" |
   "Oncology" |
   "Gynecology" 

type Gender = "Male" | "Female" | "Other";

interface Doctor {
  id:string;
  firstName:string;
  lastName:string;
  email:string;
  phone:string;
  specialty:Specialty;
  gender:Gender;
  experience:number;
  licenseNumber:string;
  availableDays:WeekDay[];
  joiningDate:string;
  avatarColor:AvatarColor;
}

type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type DoctorFormData = Omit<Doctor, "id" | "avatarColor">;
type FormErrors = Partial<Record<keyof DoctorFormData,string>>;
type AvatarColor = "blue" | "violet" | "emerald" | "rose" | "amber";

const API_URL = "/api/doctors";

const SPECIALTIES: Specialty[] = [
  "Cardiology", "Dermatology", "General Practice", "Gynecology",
  "Neurology", "Oncology", "Orthopedics", "Pediatrics", "Psychiatry","Radiology",
];

const WEEKDAYS: WeekDay[] = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const GENDERS: Gender[] = ["Male","Female","Other"];
const AVATAR_COLORS: AvatarColor[] = ["blue","violet","emerald","rose","amber"];

const AVATAR_STYLES: Record<AvatarColor,string>={
  blue:"bg-blue-100 text-blue-700",
  violet:"bg-violet-100 text-violet-700",
  emerald:"bg-emerald-100 text-emerald-700",
  rose:"bg-rose-100 text-rose-700",
  amber:"bg-amber-100 text-amber-700",
};

const SPECIALTY_STYLES:Record<Specialty,string>={
  Cardiology:        "bg-red-50 text-red-700 ring-red-100",
  Dermatology:       "bg-yellow-50 text-yellow-700 ring-yellow-100",
  Neurology:         "bg-violet-50 text-violet-700 ring-violet-100",
  Orthopedics:       "bg-orange-50 text-orange-700 ring-orange-100",
  Pediatrics:        "bg-pink-50 text-pink-700 ring-pink-100",
  Psychiatry:        "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Radiology:         "bg-cyan-50 text-cyan-700 ring-cyan-100",
  "General Practice":"bg-emerald-50 text-emerald-700 ring-emerald-100",
  Oncology:          "bg-slate-100 text-slate-600 ring-slate-200",
  Gynecology:        "bg-rose-50 text-rose-700 ring-rose-100",
};

const EMPTY_FORM: DoctorFormData = {
  firstName:"",
  lastName:"",
  email:"",
  phone:"",
  specialty:"General Practice",
  gender:"Male",
  experience:0,
  licenseNumber:"",
  availableDays:[],
  joiningDate:new Date().toISOString().split("T")[0],
};

let avatarIndex = 0;

function getRawProp(raw: unknown, key: string): unknown {
  return (raw as Record<string, unknown>)[key];
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

function validateForm(data: DoctorFormData):FormErrors{
  const errors: FormErrors = {};
  if (!data.firstName.trim())errors.firstName = "Required.";
  if (!data.lastName.trim())errors.lastName  = "Required.";
  if (!data.email.trim()){
    errors.email = "Required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){
    errors.email = "Enter a valid email.";
  }
  if (!data.phone.trim()){
    errors.phone = "Required.";
  } else if (!/^\+?[0-9\s\-]{7,15}$/.test(data.phone)){
    errors.phone = "Enter a valid phone number.";
  }
  if (!data.licenseNumber.trim()) errors.licenseNumber = "Required.";
  if (data.experience < 0 || data.experience > 60)
    errors.experience = "Must be 0–60.";
  if (data.availableDays.length === 0)
    errors.availableDays = "Select at least one day.";
  if (!data.joiningDate) errors.joiningDate = "Required.";
  return errors;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}


function normalizeDoctor(raw: unknown): Doctor {
  return {
    id: String(getRawProp(raw, "_id") ?? getRawProp(raw, "id") ?? crypto.randomUUID()),
    firstName: String(getRawProp(raw, "firstName") ?? ""),
    lastName: String(getRawProp(raw, "lastName") ?? ""),
    email: String(getRawProp(raw, "email") ?? ""),
    phone: String(getRawProp(raw, "phone") ?? ""),
    specialty: (getRawProp(raw, "specialty") as Specialty) ?? "General Practice",
    gender: (getRawProp(raw, "gender") as Gender) ?? "Male",
    experience: Number(getRawProp(raw, "experience") ?? 0),
    licenseNumber: String(getRawProp(raw, "licenseNumber") ?? ""),
    availableDays: Array.isArray(getRawProp(raw, "availableDays"))
      ? (getRawProp(raw, "availableDays") as WeekDay[])
      : [],
    joiningDate: String(
      getRawProp(raw, "joiningDate") ?? new Date().toISOString().split("T")[0]
    ),
    avatarColor:
      (getRawProp(raw, "avatarColor") as AvatarColor) ??
      AVATAR_COLORS[avatarIndex++ % AVATAR_COLORS.length],
  };
}

interface FieldProps {
  label:string;
  error?:string;
  children:React.ReactNode;
  className?:string;
}

const Field:React.FC<FieldProps> = ({label,error,children,className = "" })=>(
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
    {children}
    {error && (
      <span className="text-xs text-red-500 flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="6" cy="6" r="6" className="opacity-20"/>
          <path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        </svg>
        {error}
      </span>
    )}
  </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>{
  hasError?:boolean;
}
const Input:React.FC<InputProps> = ({hasError,className = "",...props})=>(
  <input
    {...props}
    className={`h-9 px-3 rounded-lg border text-sm text-slate-900 bg-white placeholder:text-slate-400
      transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
      ${hasError ? "border-red-400 bg-red-50/50 focus:ring-red-400/30 focus:border-red-500" : "border-slate-200 hover:border-slate-300"}
      ${className}`}
  />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?:boolean;
}
const Select:React.FC<SelectProps> = ({hasError,children,className = "", ...props})=> (
  <select
    {...props}
    className={`h-9 px-3 rounded-lg border text-sm text-slate-900 bg-white  
      transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
      appearance-none cursor-pointer
      ${hasError ? "border-red-400 bg-red-50/50" : "border-slate-200 hover:border-slate-300"}
      ${className}`}
  >
    {children}
  </select>
);

const SpecialtyBadge: React.FC<{specialty:Specialty}> = ({specialty})=>(
  <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${SPECIALTY_STYLES[specialty]}`}>
    {specialty}
  </span>
);

interface StatCardProps {label:string;value:string | number;icon:React.ReactNode}
const StatCard: React.FC<StatCardProps> = ({label,value,icon})=>(
  <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
      {icon}
    </div>
    <div>
      <p className="text-[11px] text-slate-400 leading-none mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-800 leading-none">{value}</p>
    </div>
  </div>
);

interface DoctorCardProps {doctor:Doctor;onDelete:(id:string)=>void;deleting?:boolean}

const DoctorCard: React.FC<DoctorCardProps> = ({doctor,onDelete,deleting})=>{
  const initials = `${doctor.firstName[0] ?? ""}${doctor.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className={`group bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 p-4 flex items-start gap-4 ${deleting ? "opacity-50 pointer-events-none" : ""}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0 ${AVATAR_STYLES[doctor.avatarColor]}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-900 truncate">
                Dr. {doctor.firstName} {doctor.lastName}
              </p>
              <SpecialtyBadge specialty={doctor.specialty}/>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{doctor.email}</p>
          </div>
          <button
            onClick={() => onDelete(doctor.id)}
            aria-label={`Remove Dr. ${doctor.lastName}`}
            disabled={deleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 4h12M6 4V2.5h4V4M5 4l.5 9.5h5L11 4"/>
            </svg>
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M10 7.5c0 2.5-4 4-4 4s-4-1.5-4-4a4 4 0 018 0z"/><circle cx="6" cy="4" r="1.5"/>
            </svg>
            {doctor.phone}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <rect x="1" y="2" width="10" height="8" rx="1.5"/><path d="M1 5h10"/>
            </svg>
            {doctor.licenseNumber}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <circle cx="6" cy="6" r="5"/><path d="M6 3.5v3l1.5 1.5"/>
            </svg>
            {doctor.experience} yr{doctor.experience !== 1 ? "s" : ""} exp ·{doctor.gender}
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M8 1v2M4 1v2M1 5h10"/>
            </svg>
            Joined {new Date(doctor.joiningDate).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
          </span>
        </div>
        <div className="flex gap-1 mt-2 flex-wrap">
          {WEEKDAYS.map((day)=>{
            const active = doctor.availableDays.includes(day);
            return (
              <span key={day} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${active ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-300"}`}>
                {day}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ModalProps {isOpen:boolean;onClose:()=>void;children:React.ReactNode}
const Modal: React.FC<ModalProps> = ({isOpen,onClose,children})=>{
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)"}}
      onClick={(e) => { if (e.target === e.currentTarget) onClose();}}
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto ring-1 ring-slate-900/5">
        {children}
      </div>
    </div>
  );
};

const Divider: React.FC<{label:string}>=({label})=>(
  <div className="flex items-center gap-3 col-span-2 mt-1">
    <div className="h-px flex-1 bg-slate-100"/>
    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="h-px flex-1 bg-slate-100"/>
  </div>
);

const ErrorBanner: React.FC<{message:string;onDismiss:()=>void}> = ({message,onDismiss})=>(
  <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
    <span>{message}</span>
    <button onClick={onDismiss} className="text-red-400 hover:text-red-600 flex-shrink-0">
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 2l12 12M14 2L2 14"/>
      </svg>
    </button>
  </div>
);

function AddDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<DoctorFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState<Specialty | "All">("All")
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchDoctors = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const res = await fetch(API_URL);
      const json: ApiResponse<Doctor[]> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? `Failed to load doctors (${res.status})`);
      }
      setDoctors((json.data ?? []).map(normalizeDoctor));
    } catch (err: unknown) {
      setApiError(getErrorMessage(err) || "Failed to load doctors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const createDoctor = async (data: DoctorFormData) => {
    setIsSaving(true);
    setApiError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json: ApiResponse<Doctor> = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? `Failed to add doctor (${res.status})`);
      }
      setDoctors((p) => [normalizeDoctor(json.data), ...p]);
      setFormData(EMPTY_FORM);
      setErrors({});
      setIsModalOpen(false);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err) || "Failed to add doctor.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDoctor = async (id: string) => {
    setDeletingId(id);
    setApiError(null);
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      const json: ApiResponse<unknown> = await res.json().catch(() => ({ success: res.ok, data: null }));
      if (!res.ok || json.success === false) {
        throw new Error(json.message ?? `Failed to remove doctor (${res.status})`);
      }
      setDoctors((p) => p.filter((d) => d.id !== id));
    } catch (err: unknown) {
      setApiError(getErrorMessage(err) || "Failed to remove doctor.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: name === "experience" ? Number(value) : value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleDayToggle = (day: WeekDay) => {
    setFormData((p) => ({
      ...p,
      availableDays: p.availableDays.includes(day)
        ? p.availableDays.filter((d) => d !== day)
        : [...p.availableDays, day],
    }));
    setErrors((p) => ({...p,availableDays:undefined}));
  };

  const handleSubmit = ()=>{
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) {setErrors(errs); return;}
    createDoctor(formData);
  };

  const handleClose = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setFormData(EMPTY_FORM);
    setErrors({});
  };

  const filtered = doctors.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || `${d.firstName} ${d.lastName} ${d.email} ${d.licenseNumber}`.toLowerCase().includes(q)) &&
      (filterSpecialty === "All" || d.specialty === filterSpecialty)
    );
  });

  const avgExp = doctors.length
    ? Math.round(doctors.reduce((a, d) => a + d.experience, 0) / doctors.length)
    : 0;
  const uniqueSpecialties = new Set(doctors.map((d) => d.specialty)).size;

  const IconUsers = () => (
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5"/>
      <path d="M11 7.5c1.5 0 3 .8 3 3" strokeDasharray="2 1"/>
      <circle cx="12" cy="4.5" r="2" strokeDasharray="2 1"/>
    </svg>
  );
  const IconStar = () =>(
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M8 2l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-.5z"/>
    </svg>
  );
  const IconBriefcase = ()=>(
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <rect x="1" y="5" width="14" height="9" rx="1.5"/><path d="M5 5V3.5A1.5 1.5 0 016.5 2h3A1.5 1.5 0 0111 3.5V5"/>
    </svg>
  );
  const IconRefresh = ()=>(
    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8a5.5 5.5 0 10-1.6 3.9M13.5 8V4.5M13.5 8H10"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Staff</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isLoading
                ? "Loading doctors…"
                : doctors.length === 0
                ? "No doctors registered yet."
                : `${doctors.length} doctor${doctors.length !== 1 ? "s" : ""} registered`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDoctors}
              disabled={isLoading}
              aria-label="Refresh"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 transition disabled:opacity-50"
            >
              <span className={isLoading ? "animate-spin" : ""}><IconRefresh/></span>
            </button>
            <button
              onClick={() =>setIsModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[.98] text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm shadow-blue-200 transition-all duration-150"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 2v12M2 8h12"/>
              </svg>
              Add doctor
            </button>
          </div>
        </div>

        {apiError && (
          <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
        )}

        {doctors.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Total doctors"   value={doctors.length}   icon={<IconUsers />} />
            <StatCard label="Specialties"     value={uniqueSpecialties} icon={<IconStar />} />
            <StatCard label="Avg. experience" value={`${avgExp} yr${avgExp !== 1 ? "s" : ""}`} icon={<IconBriefcase />} />
          </div>
        )}

        {doctors.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="4.5"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input
                type="search"
                placeholder="Search by name, email or license…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-slate-300 transition-shadow"
              />
            </div>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value as Specialty | "All")}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-slate-300 transition-shadow"
            >
              <option value="All">All specialties</option>
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0,1,2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 animate-pulse">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0"/>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-1/3"/>
                  <div className="h-2.5 bg-slate-100 rounded w-1/2"/>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filtered.map((doc) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                deleting={deletingId === doc.id}
                onDelete={deleteDoctor}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 12h6M12 9v6"/><circle cx="12" cy="12" r="9"/>
              </svg>
            </div>
            <p className="font-semibold text-slate-700">
              {doctors.length === 0 ? "No doctors yet" : "No results"}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {doctors.length === 0
                ? "Add your first doctor to get started."
                : "Try a different search or filter."}
            </p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleClose}>
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add new doctor</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in the details below to register a new doctor.</p>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14"/>
            </svg>
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-x-4 gap-y-4">
          <Divider label="Personal info" />
          <Field label="First name" error={errors.firstName}>
            <Input name="firstName" value={formData.firstName} onChange={handleChange}
              hasError={!!errors.firstName} placeholder="e.g. Aisha"/>
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <Input name="lastName" value={formData.lastName} onChange={handleChange}
              hasError={!!errors.lastName} placeholder="e.g. Sharma"/>
          </Field>
          <Field label="Email address" error={errors.email} className="col-span-2">
            <Input name="email" type="email" value={formData.email} onChange={handleChange}
              hasError={!!errors.email} placeholder="doctor@hospital.com" className="w-full"/>
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <Input name="phone" type="tel" value={formData.phone} onChange={handleChange}
              hasError={!!errors.phone} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Gender" error={errors.gender}>
            <Select name="gender" value={formData.gender} onChange={handleChange} className="w-full">
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </Field>
          <Divider label="Professional details"/>
          <Field label="Specialty" error={errors.specialty}>
            <Select name="specialty" value={formData.specialty} onChange={handleChange} className="w-full">
              {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label="Years of experience" error={errors.experience}>
            <Input name="experience" type="number" value={formData.experience} onChange={handleChange}
              hasError={!!errors.experience} min={0} max={60} />
          </Field>
          <Field label="License number" error={errors.licenseNumber}>
            <Input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange}
              hasError={!!errors.licenseNumber} placeholder="MCI-XXXX-XXXX" />
          </Field>
          <Field label="Joining date" error={errors.joiningDate}>
            <Input name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange}
              hasError={!!errors.joiningDate} />
          </Field>
          <Divider label="Availability" />
          <div className="col-span-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Available days</p>
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map((day) => {
                const active = formData.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`h-9 w-12 rounded-lg text-sm font-medium border transition-all duration-150
                      ${active
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
                      }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.availableDays && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <circle cx="6" cy="6" r="6" className="opacity-20"/>
                  <path d="M6 3.5v3M6 8h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                </svg>
                {errors.availableDays}
              </p>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="h-9 px-4 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="h-9 px-5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] rounded-xl shadow-sm shadow-blue-200 transition-all duration-150 flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 8a6 6 0 10-1.8 4.3"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M2 8.5l4 4 8-8"/>
              </svg>
            )}
            {isSaving ? "Saving…" : "Save doctor"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AddDoctors;