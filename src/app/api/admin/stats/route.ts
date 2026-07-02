import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/lib/models/Report";
import { User } from "@/lib/models/User";
import { Appointment } from "@/lib/models/Appointment";
import { verifyToken,extractTokenFromHeader} from "@/lib/auth";

export async function GET(req:NextRequest){
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({success:false,message:"Unauthorized"},{status:401});
    const payload = verifyToken(token);
    if (payload.role !== "admin"){
      return NextResponse.json({success:false,message:"Admin access required"},{status:403});
    }
    await connectDB();
    const today = new Date().toISOString().split("T")[0];
    const [totalPatients,totalReports,pendingReports,todayAppointments] = await Promise.all([
      User.countDocuments({role:"patient"}),
      Report.countDocuments(),
      Report.countDocuments({status:{$in:["pending","processing"]}}),
      Appointment.countDocuments({preferredDate:today}),
    ]);

    return NextResponse.json({
      success:true,
      data: {totalPatients,totalReports,pendingReports,todayAppointments},
    });
  } catch {
    return NextResponse.json({success:false,message:"Server error"},{status:500});
  }
}
