"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface SignupData {
  name:string;phone:string;email:string;
  dateOfBirth:string;gender:string;password:string;confirmPassword:string;
}

export default function SignupForm(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {register,handleSubmit,watch,formState:{errors}} = useForm<SignupData>();
  const pwd = watch("password");
  const onSubmit = async (data:SignupData)=>{
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register",{
        method: "POST",
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.ok && json.success){
        localStorage.setItem("token",json.data.token);
        localStorage.setItem("user", JSON.stringify(json.data.user));
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        toast.error(json.message || "Registration failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="form-label">Full Name *</label>
          <input {...register("name", {required:"Name required"})} className="form-input" placeholder="Rahul Sharma"/>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="form-label">Mobile *</label>
          <input {...register("phone", { required: "Phone required" })} className="form-input" placeholder="+91 98765 43210" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="form-label">Email *</label>
          <input {...register("email", { required: "Email required" })} type="email" className="form-input" placeholder="you@email.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="form-label">Date of Birth</label>
          <input {...register("dateOfBirth")} type="date" className="form-input"/>
        </div>
        <div>
          <label className="form-label">Gender</label>
          <select {...register("gender")} className="form-input">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="form-label">Password *</label>
          <input {...register("password", {required:true,minLength:{value:8,message:"Min 8 characters"}})} type="password" className="form-input" placeholder="Min. 8 characters" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>
        <div>
          <label className="form-label">Confirm Password *</label>
          <input {...register("confirmPassword", { validate: v => v === pwd || "Passwords don't match" })} type="password" className="form-input" placeholder="Repeat password" />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm rounded-xl disabled:opacity-60">
        {loading ? "Creating Account..." : "Create Account →"}
      </button>
      <p className="text-center text-sm text-slate-400">
        Already registered?{""}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
