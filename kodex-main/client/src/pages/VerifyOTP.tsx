import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cloud, ShieldCheck, ArrowRight, Loader2, RefreshCw, Lock, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyOTP() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");

  const verifyMutation = useMutation({
    mutationFn: async (otpCode: string) => {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Verification failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cloud Link Established",
        description: "Your session is now secured in the KODEX cloud.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Link Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to resend code");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "New Cloud Dispatch",
        description: "A new synchronization code has been sent to your terminal.",
      });
    },
  });

  const handleVerify = () => {
    if (code.length === 6) {
      verifyMutation.mutate(code);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617] relative overflow-hidden p-4 transition-colors duration-500">
      {/* Cloud-like Ambient Atmosphere */}
      <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] bg-cyan-400/20 dark:bg-cyan-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-[100px] animate-bounce-subtle"></div>

      <Card className="w-full max-w-[360px] bg-white/80 dark:bg-slate-900/40 border border-blue-100/50 dark:border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden border-t-4 border-t-blue-500">
        <CardHeader className="space-y-4 flex flex-col items-center pt-10 pb-2">
          <div className="relative group">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-600/20 dark:to-blue-950/40 rounded-full flex items-center justify-center relative border border-blue-200 dark:border-blue-500/30 shadow-inner group-hover:scale-110 transition-transform duration-700">
               <Cloud className="w-8 h-8 text-blue-500 dark:text-blue-400" strokeWidth={1.5}/>
               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 rounded-full border border-blue-100 dark:border-blue-900 flex items-center justify-center shadow-sm">
                  <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
               </div>
            </div>
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Cloud Verification
            </CardTitle>
            <CardDescription className="text-[11px] font-semibold text-blue-500/80 uppercase tracking-[0.2em]">
              Secure Authentication Protocol
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 px-8 pb-12 pt-6 flex flex-col items-center">
          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto opacity-80">
              Enter the 6-digit sync code sent to your cloud-registered communications terminal.
            </p>
          </div>

          <div className="py-2">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
              onComplete={handleVerify}
            >
              <InputOTPGroup className="gap-2.5">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-10 h-12 bg-blue-50/50 dark:bg-white/[0.04] border-blue-100 dark:border-white/10 text-slate-900 dark:text-white font-bold text-xl focus:ring-blue-500/50 rounded-xl transition-all shadow-sm"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="w-full space-y-4 pt-2">
            <Button 
              onClick={handleVerify}
              disabled={code.length < 6 || verifyMutation.isPending}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[13px] rounded-2xl shadow-lg shadow-blue-500/20 transition-all group flex items-center justify-center gap-2"
            >
              {verifyMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Verify Identity</span>
                  <Radio className="w-4 h-4 group-hover:animate-pulse" />
                </>
              )}
            </Button>

            <div className="flex items-center gap-2 justify-center pt-2">
               <button
                 onClick={() => resendMutation.mutate()}
                 disabled={resendMutation.isPending}
                 className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-all group"
               >
                 <RefreshCw className={`w-3 h-3 ${resendMutation.isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                 Resend code
               </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cloud Footer */}
      <div className="absolute bottom-8 flex flex-col items-center opacity-40">
         <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-600 dark:text-slate-500">
           <ShieldCheck className="w-3 h-3 text-blue-500" />
           Cloud Secure Verified
         </div>
      </div>
    </div>
  );
}

