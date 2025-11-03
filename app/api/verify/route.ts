import { NextResponse } from "next/server";
import { verifyProof, ZkProof } from "@/lib/zk";

export async function POST(req: Request) {
  const { zkProof } = (await req.json()) as { zkProof?: ZkProof };
  if (!zkProof)
    return NextResponse.json({ error: "zkProof required" }, { status: 400 });

  const verified = verifyProof(zkProof);
  return NextResponse.json({ verified });
}