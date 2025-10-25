import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

/**
 * This API endpoint simulates a KYC provider verification, in general we assume that the provider
 * verifies the data off-chain and provides a signature over the field hash.
 * Input: { fieldHash: string }
 * Output: { providerSignature: string, provider: string, status: "verified" | "rejected" }
*/
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Only POST method is allowed
    if (req.method !== "POST") return res.status(405).end();
    // Extract fieldHash from the body
    // req.body as { fieldHash: string } is a TypeScript type assertion to inform the compiler about the expected structure of req.body
    const { fieldHash } = req.body as { fieldHash: string };
    if (!fieldHash) return res.status(400).json({ error: "fieldHash is required" });

    // Deterministic mock signature from fieldHash
    const PROVIDER_PRIV = "MOCK_PROVIDER_PRIVATE_KEY";
    // Create HMAC-SHA256 signature, the sig is a hex string that represents a hash-based message authentication code (HMAC) generated using the SHA-256 hashing algorithm
    // The goal is to have a unique signature for each unique fieldHash, ensuring data integrity and authenticity
    // the signature is used to verify that the data (fieldHash) has not been altered and is from a legitimate source (the provider) 
    const sig = crypto.createHmac("sha256", PROVIDER_PRIV).update(fieldHash).digest("hex");
    // Always “verified” in this mock; tweak if you want to test rejections
    return res.status(200).json({ providerSignature: sig, provider: "MockKycaid", status: "verified" });
}