import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Mock KYC Provider
 * -----------------
 * Simulates an off-chain provider that receives a fieldHash,
 * generates a deterministic signature, and always returns “verified”.
 *
 * Input:  { fieldHash: string }
 * Output: { providerSignature: string, provider: string, status: "verified" | "rejected" }
 */
export async function POST(req: Request) {
  try {
    // Parse JSON body
    const { fieldHash } = (await req.json()) as { fieldHash?: string };

    // Validate input
    if (!fieldHash) {
      return NextResponse.json({ error: "fieldHash is required" }, { status: 400 });
    }

    // Mock private key for signing
    const PROVIDER_PRIV = "MOCK_PROVIDER_PRIVATE_KEY";

    // Create deterministic HMAC-SHA256 signature from the fieldHash
    const providerSignature = crypto
      .createHmac("sha256", PROVIDER_PRIV)
      .update(fieldHash)
      .digest("hex");

    // Return “verified” result
    return NextResponse.json({
      provider: "MockKYC",
      status: "verified",
      providerSignature,
    });
  } catch (err: any) {
    console.error("Provider error:", err);
    return NextResponse.json(
      { error: "internal provider error" },
      { status: 500 }
    );
  }
}
