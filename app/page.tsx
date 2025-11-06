"use client"
import { useState, useEffect, useRef } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlineInfo } from "react-icons/md";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import ZkWorkerClient from "./workers/zkWorkerClient";

export default function Home() {
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [idNumber, setIdNumber] = useState("");
  
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [loading, setLoading] = useState<"submit" | "verify" |any>(null);
  const [expandedSubmit, setExpandedSubmit] = useState(false);
  const [expandedVerify, setExpandedVerify] = useState(false);
  
  const workerClientRef = useRef<ZkWorkerClient | null>(null);

  useEffect(() => {
    // Initialize worker client
    workerClientRef.current = new ZkWorkerClient();

    // Cleanup on unmount
    return () => {
      workerClientRef.current?.terminate();
    };
  }, []);

  const onSubmit = async () => {
    setLoading("submit");
    setVerifyResult(null);
    setExpandedSubmit(false); // Reset expanded state
    
    if (!workerClientRef.current) {
      setSubmitResult({ error: "Worker not initialized" });
      setLoading(null);
      return;
    }

    if (!userId || !fullName || !dob || !idNumber) {
      setSubmitResult({ error: "All fields are required" });
      setLoading(null);
      return;
    }

    try {
      // Use worker to generate proof (runs in background thread, doesn't block UI)
      const zkProof = await workerClientRef.current.createProof(
        fullName,
        dob,
        idNumber
      );

      setSubmitResult({
        ok: true,
        userId,
        status: "verified",
        expectedHash: zkProof.publicOutput,
        zkProof,
        message: "ZK proof generated successfully. Actual data is hidden.",
      });
    } catch (e) {
      console.error("Proof generation error:", e);
      setSubmitResult({ 
        error: e instanceof Error ? e.message : "Failed to generate proof",
        hint: "Make sure o1js is properly installed and the program compiles correctly."
      });
    } finally {
      setLoading(null);
    }
  };

  async function onVerify() {
    setLoading("verify");
    setExpandedVerify(false); // Reset expanded state
    
    if (!workerClientRef.current) {
      setVerifyResult({ error: "Worker not initialized" });
      setLoading(null);
      return;
    }

    if (!submitResult?.zkProof) {
      setVerifyResult({ error: "No proof available. Please generate a proof first." });
      setLoading(null);
      return;
    }

    try {
      // Use worker to verify proof (runs in background thread, doesn't block UI)
      const isValid = await workerClientRef.current.verifyProof(submitResult.zkProof);
      
      setVerifyResult({
        verified: isValid,
        message: isValid
          ? "Proof is valid! The data matches the expected hash (without revealing the data)."
          : "Proof is invalid. The data may have been tampered with or doesn't match.",
      });
    } catch (e) {
      console.error("Verification error:", e);
      setVerifyResult({
        error: e instanceof Error ? e.message : "Verification failed",
        hint: "Make sure the proof structure is correct and the verification key matches.",
      });
    } finally {
      setLoading(null);
    }
  }


  return (
    <main className="min-h-screen bg-[url(/img/bg.svg)] bg-center bg-cover p-6 flex items-start justify-center text-white">
      <div className="w-full max-w-3xl space-y-6">
        <header className="px-2 py-4">
          <div className="text-2xl font-extrabold">zKYC</div>
        </header>

        <section className="border border-white/10 p-4 rounded-xl">
          <h2 className="font-extrabold ">KYC Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs text-white/60 mb-1">User ID <span>*</span></label>
              <input placeholder="e.g. 01299991" required value={userId} onChange={e=>setUserId(e.target.value)}
                     className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-white" />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Full Name <span>*</span></label>
              <input placeholder="e.g. Sohaib Soussi" required value={fullName} onChange={e=>setFullName(e.target.value)}
                     className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-white" />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">Date of Birth <span>*</span></label>
              <input required type="date" value={dob} onChange={e=>setDob(e.target.value)}
                     className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-white" />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1">ID Number <span>*</span></label>
              <input placeholder="e.g. WX1223892" required value={idNumber} onChange={e=>setIdNumber(e.target.value)}
                     className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm outline-none focus:border-white" />
            </div>
          </div>
          <button
            onClick={onSubmit}
            disabled={loading === "submit"}
            className="flex justify-center items-center gap-x-2.5 mt-4 border border-white/50 px-4 py-2 rounded-full hover:bg-white hover:text-black transition ease-linear duration-250 disabled:opacity-50"
          >
            <p className="text-sm">{loading === "submit" ? "Submitting..." : "Submit & Generate Proof"}</p>
            <IoIosArrowForward />
          </button>

          <div className="mt-3">
            {submitResult ? (
              <div className="bg-black/50 border border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSubmit(!expandedSubmit)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {submitResult.error ? "Error Details" : "Proof Generated"}
                    </span>
                    {submitResult.ok && (
                      <span className="text-xs text-green-400">✓ {submitResult.status}</span>
                    )}
                  </div>
                  {expandedSubmit ? (
                    <IoChevronUp className="text-white/60" />
                  ) : (
                    <IoChevronDown className="text-white/60" />
                  )}
                </button>
                {expandedSubmit && (
                  <div className="border-t border-white/10 p-3 max-h-96 overflow-auto">
                    <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(submitResult, null, 2)}
                    </pre>
                  </div>
                )}
                {!expandedSubmit && submitResult.ok && (
                  <div className="border-t border-white/10 p-3 text-xs text-white/70">
                    <p className="mb-1"><span className="text-white/50">User ID:</span> {submitResult.userId}</p>
                    <p className="mb-1"><span className="text-white/50">Hash:</span> {submitResult.expectedHash?.substring(0, 20)}...</p>
                    <p className="text-white/60 italic">{submitResult.message}</p>
                    <p className="mt-2 text-white/40 text-[10px]">Click to view full proof JSON</p>
                  </div>
                )}
                {!expandedSubmit && submitResult.error && (
                  <div className="border-t border-white/10 p-3 text-xs text-red-400">
                    <p className="font-semibold mb-1">{submitResult.error}</p>
                    {submitResult.details && <p className="text-white/70">{submitResult.details}</p>}
                    {submitResult.hint && <p className="text-white/50 italic mt-1">{submitResult.hint}</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-right text-xs text-white/60">No submission yet!</p>
            )}
          </div>
        </section>

        <section className="border border-white/10 p-4 rounded-xl">
          <button
            onClick={onVerify}
            disabled={loading === "verify"}
            className="flex justify-center items-center gap-x-2.5 mt-3 border border-white/50 px-4 py-2 rounded-full hover:bg-white hover:text-black transition ease-linear duration-250 disabled:opacity-50"
          >
            <p className="text-sm">{loading === "verify" ? "Verifying..." : "Verify Your Proof"}</p>
            <IoIosArrowForward />
          </button>

          <div className="mt-3">
            {verifyResult ? (
              <div className="bg-black/50 border border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedVerify(!expandedVerify)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Verification Result</span>
                    {verifyResult.verified !== undefined && (
                      <span className={`text-xs ${verifyResult.verified ? "text-green-400" : "text-red-400"}`}>
                        {verifyResult.verified ? "✓ Valid" : "✗ Invalid"}
                      </span>
                    )}
                  </div>
                  {expandedVerify ? (
                    <IoChevronUp className="text-white/60" />
                  ) : (
                    <IoChevronDown className="text-white/60" />
                  )}
                </button>
                {expandedVerify && (
                  <div className="border-t border-white/10 p-3 max-h-96 overflow-auto">
                    <pre className="text-xs text-white/80 font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(verifyResult, null, 2)}
                    </pre>
                  </div>
                )}
                {!expandedVerify && verifyResult.verified !== undefined && (
                  <div className="border-t border-white/10 p-3 text-xs text-white/70">
                    <p className={`mb-2 ${verifyResult.verified ? "text-green-400" : "text-red-400"}`}>
                      {verifyResult.message || (verifyResult.verified ? "Proof is valid!" : "Proof is invalid.")}
                    </p>
                    <p className="text-white/40 text-[10px]">Click to view full verification details</p>
                  </div>
                )}
                {!expandedVerify && verifyResult.error && (
                  <div className="border-t border-white/10 p-3 text-xs text-red-400">
                    <p className="font-semibold mb-1">{verifyResult.error}</p>
                    {verifyResult.details && <p className="text-white/70">{verifyResult.details}</p>}
                    {verifyResult.hint && <p className="text-white/50 italic mt-1">{verifyResult.hint}</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-right text-xs text-white/60">No verification yet!</p>
            )}
          </div>
        </section>
        <div className="flex justify-start items-center gap-x-1">
          <MdOutlineInfo />
          <p className="text-xs text-white/60">Zero-Knowledge KYC Verification System</p>
        </div>
      </div>
    </main>
  );
}
