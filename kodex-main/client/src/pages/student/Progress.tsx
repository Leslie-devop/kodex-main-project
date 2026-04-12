import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Target, Award, Calendar, BarChart3, Clock } from "lucide-react";

interface StudentStats {
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalTimeMinutes: number;
  improvement: number;
}

interface WeeklyProgress {
  day: string;
  wpm: number;
  accuracy: number;
  sessionsCount: number;
}

export default function StudentProgress() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch student statistics
  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/analytics/student/stats"],
    retry: false,
  });

  // Fetch weekly progress
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery<WeeklyProgress[]>({
    queryKey: ["/api/analytics/student/weekly"],
    retry: false,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  // Generate weekly data if not available
  const generateWeekData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseWpm = stats?.avgWpm || 45;
    const baseAccuracy = stats?.avgAccuracy || 85;

    return days.map((day, index) => ({
      day,
      wpm: Math.max(20, baseWpm + Math.floor(Math.random() * 15) - 7),
      accuracy: Math.max(60, Math.min(100, baseAccuracy + Math.floor(Math.random() * 10) - 5)),
      sessionsCount: Math.floor(Math.random() * 3) + 1,
    }));
  };

  const displayWeeklyData = weeklyData && weeklyData.length > 0 ? weeklyData : generateWeekData();

  const getImprovementTrend = () => {
    const improvement = stats?.improvement || 0;
    if (improvement > 5) return { label: "Improving", color: "text-green-600", icon: TrendingUp };
    if (improvement < -5) return { label: "Needs Focus", color: "text-red-600", icon: TrendingDown };
    return { label: "Stable", color: "text-gray-600", icon: Target };
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getWpmLevel = (wpm: number) => {
    if (wpm >= 80) return { label: "Expert", color: "bg-purple-100 text-purple-800" };
    if (wpm >= 60) return { label: "Advanced", color: "bg-blue-100 text-blue-800" };
    if (wpm >= 40) return { label: "Intermediate", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Beginner", color: "bg-green-100 text-green-800" };
  };

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy >= 95) return { label: "Excellent", color: "bg-green-100 text-green-800" };
    if (accuracy >= 85) return { label: "Good", color: "bg-blue-100 text-blue-800" };
    if (accuracy >= 75) return { label: "Fair", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Needs Work", color: "bg-red-100 text-red-800" };
  };

  const trend = getImprovementTrend();
  const wpmLevel = getWpmLevel(stats?.avgWpm || 0);
  const accuracyLevel = getAccuracyLevel(stats?.avgAccuracy || 0);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2">Neural Synchronization Report</h2>
          <p className="text-gray-400 font-medium font-mono text-sm uppercase tracking-widest">System Diagnostics: Performance Over Time Matrix</p>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card data-testid="card-avg-wpm" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-blue-500/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Mean Velocity
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500/50 group-hover:text-blue-400 transition-colors" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">
                {statsLoading ? "..." : stats?.avgWpm || 0} <span className="text-sm text-gray-500">WPM</span>
              </div>
              <div className="mt-4">
                <Badge className={`${wpmLevel.color} text-[9px] font-black uppercase px-2 py-0.5 border-none rounded`}>
                   RANK: {wpmLevel.label.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-accuracy" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-emerald-500/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Precision Index
              </CardTitle>
              <Target className="h-4 w-4 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors">
                {statsLoading ? "..." : `${stats?.avgAccuracy || 0}%`}
              </div>
              <div className="mt-4">
                <Badge className={`${accuracyLevel.color} text-[9px] font-black uppercase px-2 py-0.5 border-none rounded`}>
                   INTEGRITY: {accuracyLevel.label.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-total-sessions" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-purple-500/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Cycles Logged
              </CardTitle>
              <Award className="h-4 w-4 text-purple-500/50 group-hover:text-purple-400 transition-colors" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-black text-white group-hover:text-purple-400 transition-colors">
                {statsLoading ? "..." : stats?.totalSessions || 0}
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">
                SYNCHRONIZATION SEQUENCES
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-time" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group hover:border-orange-500/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-white/5 border-b border-white/5">
              <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Total Uptime
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-500/50 group-hover:text-orange-400 transition-colors" />
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-4xl font-black text-white group-hover:text-orange-400 transition-colors">
                {statsLoading ? "..." : formatTime(stats?.totalTimeMinutes || 0)}
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">
                ACTIVE NEURAL ENGAGEMENT
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card data-testid="card-performance-trend" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="p-8 pb-4 border-b border-white/5 bg-white/5">
              <CardTitle className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <trend.icon className={`h-4 w-4 mr-3 ${trend.color} drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]`} />
                Improvement Vector
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="text-center">
                <div className={`text-5xl font-black ${trend.color} mb-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]`}>
                  {statsLoading ? "..." : `${(stats?.improvement || 0) > 0 ? '+' : ''}${stats?.improvement || 0}`}
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  WPM DELTA / 7 DAYS
                </p>
                <div className="mt-6">
                  <Badge className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest border-none rounded-lg ${
                    trend.label === 'Improving' ? 'bg-emerald-500/20 text-emerald-400' :
                    trend.label === 'Needs Focus' ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-gray-400'
                  }`}>
                    {trend.label} PHASE
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly WPM Chart */}
          <Card data-testid="card-weekly-wpm" className="lg:col-span-2 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
            <CardHeader className="p-8 pb-4 border-b border-white/5 bg-white/5">
              <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Velocity Matrix</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <div className="flex items-end justify-between h-48 bg-white/[0.02] border border-white/5 rounded-2xl p-8 relative">
                  {displayWeeklyData.map((data, index) => (
                    <div key={data.day} className="flex flex-col items-center space-y-4 group/bar relative">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {data.wpm} WPM
                      </div>
                      <div
                        className="bg-gradient-to-t from-blue-600 to-indigo-400 rounded-sm transition-all duration-500 hover:from-blue-400 hover:to-white min-w-[28px] relative group-hover/bar:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        style={{ height: `${Math.max(20, (data.wpm / 100) * 100)}%` }}
                      />
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">{data.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Accuracy Chart */}
        <Card data-testid="card-weekly-accuracy" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden group">
          <CardHeader className="p-8 pb-4 border-b border-white/5 bg-white/5">
            <CardTitle className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precision Integrity Scan</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-2 h-20 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                {displayWeeklyData.map((data, index) => (
                  <div
                    key={`accuracy-${index}`}
                    className="flex-1 bg-emerald-500/20 rounded-sm border border-emerald-500/20 transition-all hover:bg-emerald-400 cursor-pointer relative group/acc"
                    style={{ height: `${(data.accuracy / 100) * 100}%` }}
                  >
                    <div className="invisible group-hover/acc:visible absolute -top-10 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded whitespace-nowrap z-10">
                      {data.day}: {data.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between px-2">
                {displayWeeklyData.map((data) => (
                  <span key={`label-${data.day}`} className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">{data.day}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}