import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Report } from "@/lib/models/Report";
import { verifyToken, extractTokenFromHeader } from "@/lib/auth";

// GET /api/reports/[id]
export async function GET(req: NextRequest, { params }: { params:{id:string}}) {
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    verifyToken(token);
    await connectDB();
    const report = await Report.findOne({ reportId: params.id });
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: report });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
export async function PATCH(req: NextRequest, {params} : {params:{id:string}}){
  try {
    const token = extractTokenFromHeader(req.headers.get("authorization"));
    if (!token) return NextResponse.json({success:false,message:"Unauthorized"},{status:401});
    const payload = verifyToken(token);
    if (payload.role !== "admin"){
      return NextResponse.json({success:false,message:"Admin access required"},{status:403});
    }
    await connectDB();
    const body = await req.json();
    const report = await Report.findOneAndUpdate(
      {reportId:params.id},
      {$set:body},
      {new:true}
    );

    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: report });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
