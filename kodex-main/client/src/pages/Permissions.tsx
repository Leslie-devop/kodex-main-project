import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Keyboard } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Permissions() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleAllow = async () => {
    try {
      const response = await fetch("/api/auth/consent", { method: "POST" });
      if (!response.ok) throw new Error("Failed to grant consent");
      
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Navigate to onboarding after consent
      setLocation("/onboarding");
    } catch (error) {
       console.error(error);
    }
  };

  const handleDeny = () => {
    // If they deny, we might want to log them out or just show a message
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6 selection:bg-blue-500/20">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo/Icon Box */}
        <div className="w-20 h-20 bg-black rounded-xl flex items-center justify-center mb-8 shadow-lg">
          <div className="w-14 h-10 border-2 border-orange-200/40 rounded flex flex-col items-center justify-center p-1 relative">
            <Keyboard className="w-8 h-8 text-orange-300" strokeWidth={1.5} />
            <div className="absolute bottom-1.5 w-6 h-0.5 bg-orange-300/50 rounded-full"></div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-medium text-center text-slate-900 dark:text-white mb-6 leading-tight">
          Kodex would like to access your account
        </h1>

        {/* URL Badge */}
        <div className="bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-10">
          https://kodexz.replit.app
        </div>

        {/* Permissions List */}
        <div className="w-full text-left space-y-4 mb-12">
          <p className="text-[15px] text-slate-700 dark:text-slate-300">
            This app is requesting the following permissions:
          </p>
          <ul className="space-y-3">
            {[
              "Verify your identity",
              "Access your email address",
              "Access your basic profile information",
              "Stay signed in to this application"
            ].map((permission, i) => (
              <li key={i} className="flex items-start gap-3 text-[14px] text-slate-600 dark:text-slate-400">
                <span className="text-slate-900 dark:text-white mt-1.5">•</span>
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button 
            variant="outline" 
            onClick={handleDeny}
            className="h-12 text-[15px] font-medium text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-all"
          >
            Deny
          </Button>
          <Button 
            onClick={handleAllow}
            className="h-12 text-[15px] font-medium bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg shadow-sm transition-all"
          >
            Allow
          </Button>
        </div>
      </div>
    </div>
  );
}
