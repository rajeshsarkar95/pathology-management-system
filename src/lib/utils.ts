import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import type { ReportStatus } from "@/types";

export function cn(...inputs:ClassValue[]){
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr:string,fmt = "dd MMM yyyy"):string{
  try {
    return format(parseISO(dateStr),fmt);
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount:number):string{
  return new Intl.NumberFormat("en-IN",{
    style:"currency",
    currency:"INR",
    maximumFractionDigits:0,
  }).format(amount);
}

export function getStatusConfig(status:ReportStatus){
  const configs = {
    completed:{
      label: "✓ Completed",
      className: "badge badge-completed",
    },
    processing:{
      label: "⟳ Processing",
      className: "badge badge-processing",
    },
    pending:{
      label: "◷ Pending",
      className: "badge badge-pending",
    },
  };
  return configs[status];
}

export function getParamStatusColor(status: "normal" | "high" | "low"){
  const colors = {
    normal:{text:"text-emerald-600",bg:"bg-emerald-50"},
    high:{text:"text-red-600",bg:"bg-red-50"},
    low:{text:"text-amber-600",bg:"bg-amber-50"},
  };
  return colors[status];
}
export function generatePatientId():string{
  return `LP-${String(Math.floor(Math.random() * 90000) + 10000)}`;
}
export function generateReportId():string{
  return `R${String(Math.floor(Math.random() * 9000) + 1000)}`;
}
export const TEST_CATEGORIES = [
  "Complete Blood Count (CBC)",
  "Thyroid Profile (TSH, T3, T4)",
  "Liver Function Test (LFT)",
  "Kidney Function Test (KFT)",
  "Diabetes Panel (HbA1c)",
  "Vitamin Panel (D, B12)",
  "Lipid Profile",
  "Full Body Checkup",
];
export const TIME_SLOTS = [
  "6:00 AM – 8:00 AM",
  "8:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "2:00 PM – 4:00 PM",
  "4:00 PM – 6:00 PM",
  "6:00 PM – 8:00 PM",
];