import mongoose, { Collection, Model } from "mongoose";
import { model, Schema } from "mongoose";
import { BLOOD_GROUPS, GENDERS, PatientInput } from "../validation";
import { nextSequence } from "../mongodb";

export interface IPationt {
    id: string;
    firstName: string;
    lastName: string;
    dob: string;
    gender: (typeof GENDERS)[number];
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
    registeredAt: Date;
}
const PatientSchema = new Schema<IPationt>(
    {
        id: { type: String, required: true, unique: true, index: true },
        firstName: { type: String, required: true, trim: true, maxlength: 100 },
        lastName: { type: String, required: true, trim: true, maxLength: 100 },
        dob: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        gender: { type: String, required: true, GENDERS },
        phone: { type: String, required: true, match: /^[6-9]\d{9}$/, index: true },
        email: { type: String, trim: true, lowercase: true, default: "", maxlength: 200 },
        bloodGroup: { type: String, enum: BLOOD_GROUPS, default: "" },
        address: { type: String, trim: true, default: "", maxlength: 300 },
        city: { type: String, trim: true, default: "", maxlength: 300 },
        state: { type: String, trim: true, default: "", maxlength: 300 },
        pincode: { type: String, default: "", match: /^(\d{6})?$/ },
        referringDoctor: { type: String, trim: true, default: "", maxlength: 100 },
        emergencyName: { type: String, trim: true, default: "", maxlength: 100 },
        emergencyPhone: { type: String, default: "", match: /^([6-9]\d{9})?$/ },
        allergies: { type: String, trim: true, default: "", maxlength: 300 },
        notes: { type: String, trim: true, default: "", maxlength: 300 },
        registeredAt: { type: Date, default: Date.now },
    },
    {
        collection:"patients",
        versionKey:false,
        toJSON:{
            transform:(_doc,ret:Record<string,unknown>)=>{
                delete ret._id;
                return ret;
            },
        },
    }
);

PatientSchema.index({firstName:1,lastName:1});
PatientSchema.index({ registeredAt: -1 });

// Virtual: full name and age (not stored)
PatientSchema.virtual("fullName").get(function(this:IPationt){
    return `${this.firstName} ${this.lastName}`.trim();
})

PatientSchema.virtual("age").get(function (this:IPationt){
    const birth = new Date(this.dob);
    if(Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if(m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
})

export async function nextPatientId(): Promise<string> {
  const seq = await nextSequence("patients");
  return `PAT-${String(seq).padStart(6, "0")}`;
}

const Patient: Model<IPationt> =
  (mongoose.models.Patient as Model<IPationt>) || mongoose.model<IPationt>("Patient", PatientSchema);
 
export default Patient;


