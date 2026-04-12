import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import TypingSession from "@/components/typing/TypingSession";
import AssignedLessons from "@/components/student/AssignedLessons";
import ProgressAnalytics from "@/components/student/ProgressAnalytics";
import KeystrokeAnalytics from "@/components/student/KeystrokeAnalytics";
import AISuggestions from "@/components/student/AISuggestions";
import PostureGuide from "@/components/student/PostureGuide";
import QuickActions from "@/components/common/QuickActions";
import PostureTutorial from "@/components/PostureTutorial";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch daily stats
  const { data: dailyStats } = useQuery<{ todayWpm: number; todayAccuracy: number }>({
    queryKey: ["/api/analytics/student/daily"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-2" data-testid="text-welcome">
                Good morning, {user?.firstName || user?.username || "Student"}!
              </h2>
              <p className="text-gray-400">System check complete. Ready to achieve peak performance today?</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-6">
                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                  <div className="text-3xl font-black text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" data-testid="text-daily-wpm">
                    {dailyStats?.todayWpm || 0}
                  </div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Daily Peak WPM</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                  <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" data-testid="text-daily-accuracy">
                    {dailyStats?.todayAccuracy || 0}%
                  </div>
                  <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Accuracy Node</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Typing Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <TypingSession />
          </div>

          {/* AI Suggestions & Session Timer */}
          <div className="space-y-8">
            <AISuggestions />
            <PostureGuide />
          </div>
        </div>

        {/* Assigned Lessons & Progress Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <AssignedLessons />
          <ProgressAnalytics />
        </div>

        {/* Keystroke Analytics & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <KeystrokeAnalytics />
          </div>
          <div className="space-y-8">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
