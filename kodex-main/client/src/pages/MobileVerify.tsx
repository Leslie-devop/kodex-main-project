import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileVerify() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"pending" | "success" | "denied">("pending");

  // Get UserID from URL for sync
  const query = new URLSearchParams(window.location.search);
  const syncUserId = query.get("userId");

  const handleAllow = async () => {
    try {
      const targetId = syncUserId || user?.id; // Use URL token if available, otherwise current session
      const response = await fetch("/api/auth/push-verify-token", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetId })
      });
      if (response.ok) setStatus("success");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeny = () => setStatus("denied");

  if (status === "success") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Check your computer</h1>
        <p className="text-slate-600">You've been successfully verified. You can close this tab now.</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <XCircle className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-slate-600">You chose not to allow this sign-in request.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[360px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
         <div className="p-8 flex flex-col items-center">
            <h2 className="text-[24px] font-semibold mb-2 text-center text-slate-800">Are you trying to sign in?</h2>
            
            <div className="flex items-center gap-2 mb-8 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
               <div className="w-6 h-6 bg-[#ff6d00] rounded-full flex items-center justify-center text-[11px] text-white font-bold">L</div>
               <span className="text-[14px] text-slate-600 font-medium">{user?.email || "User Account"}</span>
            </div>

            <div className="w-full space-y-5 mb-10 text-left border-y border-slate-100 py-6">
               <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Device</span>
                  <span className="text-[16px] text-slate-800 font-medium">Windows PC</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Near</span>
                  <span className="text-[16px] text-slate-800 font-medium">Calauag, Quezon, Philippines</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time</span>
                  <span className="text-[16px] text-slate-800 font-medium">Just now</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
               <button 
                onClick={handleDeny}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-slate-200 text-red-500 text-[15px] font-bold hover:bg-red-50 transition-all active:scale-95"
               >
                  <XCircle className="w-4 h-4" />
                  No
               </button>
               <button 
                onClick={handleAllow}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white text-[15px] font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
               >
                  <CheckCircle2 className="w-4 h-4" />
                  Yes
               </button>
            </div>
         </div>
         <div className="bg-slate-50 p-4 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Kodex Secure Nexus</p>
         </div>
      </div>
    </div>
  );
}
