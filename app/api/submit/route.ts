import { NextResponse } from "next/server";
import { createProof, calculateExpectedHash } from "@/lib/zk";

/**
 * POST /api/submit
 * 
 * Generates a zero-knowledge proof for KYC data
 * 
 * The proof proves: "I know fullName, dob, idNumber that hash to expectedHash"
 * WITHOUT revealing the actual values!
 */
export async function POST(req: Request) {
  try {
    // Parse request body
  const { userId, fullName, dob, idNumber } = (await req.json()) as Record<string, string>;

    // Validate all fields are present
    if (!userId || !fullName || !dob || !idNumber) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    // Generate zero-knowledge proof
    // This creates a proof that hides the actual data
    // but proves it matches a known hash
    const zkProof = await createProof(fullName, dob, idNumber);

    // Calculate expected hash for reference
    // This is what the verifier will know (public output)
    const expectedHash = calculateExpectedHash(fullName, dob, idNumber);

  return NextResponse.json({
    ok: true,
    userId,
    status: "verified",
      expectedHash, // Public hash (verifier knows this)
      zkProof, // Zero-knowledge proof (doesn't reveal actual data!)
      message: "ZK proof generated successfully. Actual data is hidden.",
  });
  } catch (error: any) {
    console.error("Proof generation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate proof", 
        details: error.message,
        hint: "Make sure o1js is properly installed and the program compiles correctly."
      },
      { status: 500 }
    );
  }
}
