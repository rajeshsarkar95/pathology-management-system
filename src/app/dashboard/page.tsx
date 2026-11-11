"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {LayoutDashboard,FileText,Clock,Calendar,LogOut,Activity,User,Mouse} from "lucide-react";
import {cn} from "@/lib/utils";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import ReportsList from "@/components/dashboard/ReportsList";
import TestHistory from "@/components/dashboard/TestHistory";
import AddDoctors  from "@/components/dashboard/AddDoctors";
import Patientregistration from "@/components/dashboard/Patientregistration";
import HomeSampleCollection from "@/components/dashboard/Homesamplecollectionscheduling";
type DashView = "overview" | "reports" | "history" | "Doctor" | "Patientregistration" | "HomeSampleCollection";

const sidebarItems: {id:DashView;label:string;icon:React.ElementType}[] = [
  {id:"overview",label:"Overview",icon:LayoutDashboard},
  {id:"Doctor",label:"Doctor",icon:User},
  {id:"reports",label:"My Reports",icon:FileText},
  {id:"history",label:"Test History",icon:Clock},
  {id:"Patientregistration",label:"Patient Registration",icon:User},
  {id:"HomeSampleCollection",label:"HomeSampleCollection",icon:Mouse}
];

export default function DashboardPage(){
  const router = useRouter();
  const [view,setView] = useState<DashView>("overview");
  const [user,setUser] = useState<{name:string;patientId:string} | null>(null);

  useEffect(()=>{
    const stored = localStorage.getItem("user");
    if (!stored) {router.push("/login"); return;}
    setUser(JSON.parse(stored));
  },[router]);

  const logout = ()=> {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) return null;
  const initials = user.name.split("").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-white border-r border-slate-100 flex flex-col fixed top-0 left-0 h-full z-40 pt-0">
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white"/>
            </div>
            <span className="font-semibold text-slate-900 text-sm"><span className="text-blue-600">LAL</span> Pathology</span>
          </Link>
        </div>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{user.name}</p>
            <p className="text-slate-400 text-xs">{user.patientId}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2">Main Menu</p>
          {sidebarItems.map(({id,label,icon:Icon})=>(
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn("sidebar-item w-full text-left", view === id && "active")}
            >
              <Icon className="w-4 h-4 flex-shrink-0"/>
              {label}
            </button>
          ))}
          <Link href="/#booking" className={cn("sidebar-item w-full no-underline")}>
            <Calendar className="w-4 h-4 flex-shrink-0"/>
            Book Test
          </Link>
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={logout} className="sidebar-item w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600">
            <LogOut className="w-4 h-4"/>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 bg-slate-50 min-h-screen p-6">
        {view === "overview" && <DashboardOverview user={user} onNavigate={setView} />}
        {view === "reports" && <ReportsList />}
        {view === "history" && <TestHistory />}
        {view === "Doctor" &&  <AddDoctors/>}
        {view === "Patientregistration" && <Patientregistration />}
        {view === "HomeSampleCollection" && <HomeSampleCollection/>}
      </main>
    </div>
  );
}
