"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {TEST_CATEGORIES,TIME_SLOTS} from "@/lib/utils";

interface BookingForm {
  patientName:string;
  phone:string;
  testType:string;
  collectionType:string;
  preferredDate:string;
  preferredTime:string;
  notes:string;
}

export default function BookingSection() {
  const [loading, setLoading] = useState(false);
  const { register,handleSubmit,reset,formState:{errors}} = useForm<BookingForm>();

  const onSubmit = async (data:BookingForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments",{
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("✓ Appointment confirmed! We'll call you shortly.");
        reset();
      } else {
        toast.error("Failed to book. Please try again.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="booking" className="py-20 px-4 bg-blue-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="section-label">Book Appointment</p>
          <h2 className="section-title">Schedule a Test or Home Collection</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="form-label">Patient Name *</label>
              <input
                {...register("patientName", { required: "Name is required" })}
                className="form-input"
                placeholder="Full name"
              />
              {errors.patientName && <p className="text-red-500 text-xs mt-1">{errors.patientName.message}</p>}
            </div>
            <div>
              <label className="form-label">Phone Number *</label>
              <input
                {...register("phone", { required: "Phone is required" })}
                className="form-input"
                placeholder="+91 98765 43210"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="form-label">Test Required *</label>
              <select {...register("testType", { required: true })} className="form-input">
                {TEST_CATEGORIES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Collection Type</label>
              <select {...register("collectionType")} className="form-input">
                <option value="home">Home Collection</option>
                <option value="lab">Visit Lab — Dehradun</option>
                <option value="lab2">Visit Lab — Rishikesh</option>
              </select>
            </div>
            <div>
              <label className="form-label">Preferred Date *</label>
              <input
                type="date"
                {...register("preferredDate", { required: "Date is required" })}
                className="form-input"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="form-label">Preferred Time</label>
              <select {...register("preferredTime")} className="form-input">
                {TIME_SLOTS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Notes / Address (for home collection)</label>
              <textarea
                {...register("notes")}
                className="form-input resize-none"
                rows={2}
                placeholder="Your full address or any special instructions..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-5 py-3 text-sm rounded-xl disabled:opacity-60"
          >
            {loading ? "Booking..." : "Confirm Appointment →"}
          </button>
        </form>
      </div>
    </section>
  );
}
