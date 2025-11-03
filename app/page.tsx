"use client"
import { useState } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { MdOutlineInfo } from "react-icons/md";

export default function Home() {
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [idNumber, setIdNumber] = useState("");
  
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [loading, setLoading] = useState<"submit" | "verify" |any>(null);
  
  const onSubmit = async () =>{
    // Let's activate the loading animation
    setLoading("submit");
    // if we already verified, let's reset 
    setVerifyResult(null);
    try{
      const response = await fetch("/api/submit",{
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify({
            userId,
            fullName,
            dob,
            idNumber
          })
        }
      )
      const jsonResponse = await response.json();
      setSubmitResult(jsonResponse);
    }catch(e){
      console.log("error: ",e);
    }finally{
      setLoading(null);
    }
  }

  async function onVerify() {
    setLoading("verify");
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zkProof: submitResult?.zkProof }),
      });
      const jsonResponse = await response.json();
      setVerifyResult(jsonResponse);
    } finally {
      setLoading(null);
    }
  }


  return (
    <main className="min-h-screen bg-[url(/img/bg.svg)] bg-center bg-cover p-6 flex items-start justify-center">
      <div className="w-full max-w-3xl space-y-6">
        <header className="px-2 py-4">
          <div className="text-2xl font-extrabold">zKYC</div>
        </header>

        {/* Data */}
        <section className="border border-white/10 p-4 rounded-xl">
          <h2 className="font-extrabold">KYC Data</h2>
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

          <div className="mt-3 ml-3.5 text-xs text-white/70">
            {submitResult ? <pre className="whitespace-pre-wrap">{JSON.stringify(submitResult, null, 2)}</pre> : <p className="text-right">No submission yet!</p>}
          </div>
        </section>

        {/* Verify */}
        <section className="border border-white/10 p-4 rounded-xl">
          <button
            onClick={onVerify}
            disabled={loading === "verify"}
            className="flex justify-center items-center gap-x-2.5 mt-3 border border-white/50 px-4 py-2 rounded-full hover:bg-white hover:text-black transition ease-linear duration-250 disabled:opacity-50"
          >
            <p className="text-sm">{loading === "verify" ? "Verifying..." : "Verify Your Proof"}</p>
            <IoIosArrowForward />
          </button>

          <div className="mt-3 text-xs text-white/70">
            {verifyResult ? <pre className="whitespace-pre-wrap">{JSON.stringify(verifyResult, null, 2)}</pre> : <p className="text-right">No verification yet!</p>}
          </div>
        </section>
        <div className="flex justify-start items-center gap-x-1">
          <MdOutlineInfo />
          <span className="text-sm text-white/80">
            This PoC is demonstrating the feasibility of zk-proof generation on Web and Mobile
          </span>
        </div>
      </div>
    </main>
  );
}
