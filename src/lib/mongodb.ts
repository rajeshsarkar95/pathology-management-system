import { MongoClient, Db } from "mongodb";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set in .env.local");
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise;
}
export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(process.env.MONGODB_DB || "lms");
}
export async function nextSequence(name: string): Promise<number> {
  const db = await getDb();
  const doc = await db
    .collection<{ _id: string; seq: number }>("counters")
    .findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  if (!doc) throw new Error("Could not generate sequence number");
  return doc.seq;
}
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}