import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import AssignedLessons from "@/components/student/AssignedLessons";
import ProgressAnalytics from "@/components/student/ProgressAnalytics";
import KeystrokeAnalytics from "@/components/student/KeystrokeAnalytics";
import AISuggestions from "@/components/student/AISuggestions";
import MyRooms from "@/components/student/MyRooms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen, Target, Sparkles, Activity, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch daily stats with high frequency polling
  const { data: dailyStats } = useQuery<{ todayWpm: number; todayAccuracy: number }>({
    queryKey: ["/api/analytics/student/daily"],
    retry: false,
    refetchInterval: 5000, 
  });

  // Fetch assignments with high frequency polling
  const { data: assignments, isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/assignments/student"],
    retry: false,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-white">
              Good morning, {user?.firstName || user?.username || "Student"}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400">System check complete. Ready to achieve peak performance today?</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(37,99,235,0.2)] dark:drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
                {dailyStats?.todayWpm || 0}
              </div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Daily Peak WPM</div>
            </div>
            <div className="text-center p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_8px_rgba(5,150,105,0.2)] dark:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                {dailyStats?.todayAccuracy || 0}%
              </div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Accuracy Node</div>
            </div>
          </div>
        </div>

        {/* Action Hubs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Practice */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/10 border border-blue-200 dark:border-blue-500/20 backdrop-blur-xl rounded-[2.5rem] overflow-hidden flex flex-col justify-center shadow-lg dark:shadow-2xl relative">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full"></div>
            <CardHeader className="p-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-200 dark:border-blue-500/30">
                <Play className="w-8 h-8 text-blue-600 dark:text-blue-400 ml-1" />
              </div>
              <CardTitle className="text-3xl font-black text-blue-950 dark:text-white mb-2">Engage Interface</CardTitle>
              <CardDescription className="text-blue-800 dark:text-blue-100/70 text-lg">
                Enter the neural typing terminal to practice exercises, complete assignments, and refine your biomechanics.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 flex gap-4">
              <Button 
                onClick={() => setLocation('/student/lessons')}
                className="bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-2xl h-14 px-8 font-bold shadow-md dark:shadow-lg flex-1 text-base tracking-wide"
              >
                <BookOpen className="w-5 h-5 mr-3" />
                BROWSE LESSONS
              </Button>
              <Button 
                variant="outline"
                className="border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 rounded-2xl h-14 px-8 font-bold flex-1 text-base tracking-wide text-gray-900 dark:text-white"
                onClick={() => {
                  const section = document.getElementById('assignments-section');
                  section?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Target className="w-5 h-5 mr-3 text-emerald-600 dark:text-emerald-400" />
                ACTIVE TASKS
              </Button>
            </CardContent>
          </Card>

          {/* My Rooms */}
          <MyRooms />
        </div>

        {/* Analytics Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-8">
            <ProgressAnalytics />
          </div>

          {/* Personnel Feedback & Suggestions */}
          <div className="space-y-8">
            <AISuggestions />
            
            <Card className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
              <CardHeader className="p-6 border-b border-gray-100 dark:border-white/5">
                <CardTitle className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-yellow-500 dark:text-yellow-400" />
                  Fleet Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 dark:text-gray-300 italic text-sm">"Targeting and precision are improving. Maintain posture integrity during high-velocity sequences." - System Instructor</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assigned Lessons - Priority Access */}
        <div className="mb-12" id="assignments-section">
           <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Tactical Objectives</h3>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-blue-500/20 text-blue-500">
                {assignments?.length || 0} ACTIVE TASKS
              </Badge>
           </div>
           <AssignedLessons assignments={assignments} isLoading={assignmentsLoading} />
        </div>

        {/* Deep Field Diagnostics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <KeystrokeAnalytics />
           </div>
           
           <Card className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 blur-3xl rounded-full group-hover:bg-white/20 transition-all duration-700"></div>
              <div className="relative z-10">
                 <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="h-6 w-6" />
                 </div>
                 <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Neural Tuning Required</h4>
                 <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
                    Your Pinky octet latency is exceeding projected thresholds. System suggests immediate isolation training on the "Lower Key" matrix.
                 </p>
                 <Button 
                   className="w-full bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 shadow-xl"
                   onClick={() => setLocation('/student/lessons')}
                 >
                    ISOLATE OCTETS
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
