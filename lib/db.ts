import fs from "fs/promises";
import path from "path";

// Define the path to the JSON database file
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Define the KYCRecord type
export type KYCRecord = {
    userId: string;
    fieldHash: string; // SHA256 of canonical user fields (id, dob, full name, etc)
    // ⚠️⚠️⚠️⚠️ cipherText have to be encrypted, let's do this later
    cipherText?: string; // Placeholder
    //? is just to show that it can be undifined
    providerSignature?: string // Mock provider signature (HMAC-like string)
    // Hash-based message authentication code: cryptographic method that uses a secret key and a hash function to verify a message's data integrity and authenticity
    proof?: string; // deterministic "proof" hash
    status: "pending" | "verified" | "rejected";
    createdAt: number; 
    verifiedAt: number;
}
// Define the DBShape type
export type DBShape = {records: KYCRecord[]};

// Function that return a promise to receive an array of KYCRecords
// That exist on DB_PATH, we read data encoded in utf8 format 
async function readDB(): Promise<DBShape>{
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
}

// writing to the DB by passing the full DBShape object
async function writeDB(db: DBShape){
    await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8")
}

// Upsert function to add or update a KYCRecord based on userId
export async function upsertRecord(newRec: KYCRecord){
    const db = await readDB();
    const idx = db.records.findIndex(record => record.userId == newRec.userId );
    // If not found we add it
    if (idx === -1) db.records.push(newRec);
    // else we update it
    else db.records[idx] = newRec;
    await writeDB(db);
    console.log("Upserted record for userId:", newRec.userId);
    return newRec;
}

// Function to get a KYCRecord by userId
export async function getRecord(userId: string){
    const db =  await readDB();
    return db.records.find(record => record.userId === userId);
}
