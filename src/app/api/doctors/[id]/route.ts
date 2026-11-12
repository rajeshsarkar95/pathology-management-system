import {NextRequest,NextResponse} from "next/server";
import {connectDB } from "@/lib/db";
import {Doctor} from "@/lib/models/DoctorModel";

export async function DELETE(
  _req: NextRequest,
  {params}:{params:Promise<{id:string}>}
 ){ 
   try {
    await connectDB();
    const {id} = await params;
    const deleted = await Doctor.findByIdAndDelete(id);
    if (!deleted){
      return NextResponse.json(
        {success:false,message:"Doctor not found."},
        {status:404}
      );
    }
    
    return NextResponse.json({success:true,message:"Doctor removed."});
  } catch (error){
    console.error("[DELETE /api/doctors/[id]]",error);
    return NextResponse.json(
      { success:false,message:"Failed to delete doctor."},
      { status:500}
    );
  }
}