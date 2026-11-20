"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "patient" | "admin";
  patientId:string;
}

export function useAuth(requireRole?:"patient" | "admin"){
  
  const router = useRouter();
  const [user,setUser] = useState<AuthUser | null>(null);
  const [token,setToken] = useState<string | null>(null);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken){
      router.push("/login");
      return;
    }
    
    const parsedUser:AuthUser = JSON.parse(storedUser);
    if (requireRole && parsedUser.role !== requireRole){
      router.push(parsedUser.role === "admin" ? "/admin" : "/dashboard");
      return;
    }

    setUser(parsedUser);
    setToken(storedToken);
    setLoading(false);
  }, [router, requireRole]);

  const logout = ()=>{
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  };

  const authHeaders = token
    ? {Authorization: `Bearer ${token}`}
    : {};
  return {user,token,loading,logout,authHeaders};
}
