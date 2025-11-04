import { NextResponse } from "next/server";
import { verifyProof, ZkProof } from "@/lib/zk";

/**
 * POST /api/verify
 * 
 * Verifies a zero-knowledge proof
 * 
 * This verifies that the proof is valid WITHOUT knowing the actual data
 * The verifier only knows the expected hash (public output)
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    const { zkProof } = (await req.json()) as { zkProof?: ZkProof };
    
    // Validate proof exists
    if (!zkProof) {
      return NextResponse.json({ error: "zkProof required" }, { status: 400 });
    }

    // Verify the zero-knowledge proof
    // This checks that the proof is mathematically valid
    // It does NOT reveal the private inputs (fullName, dob, idNumber)
    const verified = await verifyProof(zkProof);
    
    return NextResponse.json({ 
      verified,
      message: verified 
        ? "Proof is valid! The data matches the expected hash (without revealing the data)."
        : "Proof is invalid. The data may have been tampered with or doesn't match."
    });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { 
        error: "Verification failed", 
        details: error.message,
        hint: "Make sure the proof structure is correct and the verification key matches."
      },
      { status: 500 }
    );
  }
}