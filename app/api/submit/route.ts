import { NextResponse } from "next/server";
// sha256 for hashing the fields
import { sha256 } from "@noble/hashes/sha2.js";
// bytesToHex for converting hash to hex
import { bytesToHex } from "@noble/hashes/utils.js";
// createProof to generate the ZK-like proof
import { createProof } from "@/lib/zk";

// Provider's private key (in a real app, keep this secret and secure!)
const PROVIDER_PRIV = process.env.PROVIDER_PRIV || "1".repeat(64); // 32 bytes hex

export async function POST(req: Request) {
  const { userId, fullName, dob, idNumber } = (await req.json()) as Record<string, string>;

  if (!userId || !fullName || !dob || !idNumber)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const canonical = `${fullName.toUpperCase()}|${dob}|${idNumber.toUpperCase()}`;
  const fieldHash = bytesToHex(sha256(new TextEncoder().encode(canonical)));

  const proof = createProof(PROVIDER_PRIV, fieldHash);

  return NextResponse.json({
    ok: true,
    userId,
    status: "verified",
    fieldHash,
    zkProof: proof,
  });
}
