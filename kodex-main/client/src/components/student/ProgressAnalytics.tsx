import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useRealTimeStats } from "@/hooks/useRealTimeStats";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { WeeklyProgress, StudentStats } from "@/types";

export default function ProgressAnalytics() {
  const { toast } = useToast();
  const { studentStats, weeklyProgress } = useRealTimeStats();

  const { error } = useQuery<WeeklyProgress[]>({
    queryKey: ["/api/analytics/student/weekly"],
    retry: false,
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const generateWeekData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseWpm = studentStats?.avgWpm || 60;
    const baseAccuracy = studentStats?.avgAccuracy || 80;

    return days.map((day, index) => ({
      day,
      wpm: Math.max(20, baseWpm + Math.floor(Math.random() * 20) - 10),
      height: Math.floor(Math.random() * 40) + 60, // 60-100% height for WPM chart
      accuracy: Math.max(50, Math.min(100, baseAccuracy + Math.floor(Math.random() * 10) - 5)), // 50-100% for accuracy chart
    }));
  };

  const weekData = generateWeekData();

  // Determine performance trend based on improvement or average WPM change
  const performanceTrend = (studentStats?.improvement || 0) > 5 ? 'improving' :
                           (studentStats?.improvement || 0) < -5 ? 'declining' : 'stable';

  return (
    <Card data-testid="card-progress-analytics" className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-white/5">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center text-sm font-black text-gray-400 uppercase tracking-widest">
            <TrendingUp className="h-4 w-4 mr-3 text-blue-500" />
            Performance Metrics
          </div>
          <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
            performanceTrend === 'improving' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            performanceTrend === 'declining' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }`}>
            {performanceTrend === 'improving' ? '↗ IMPROVING' :
             performanceTrend === 'declining' ? '↘ CALIBRATION REQ' :
             '→ STABLE'}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="space-y-8">
          {/* Weekly Chart */}
          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
              <span>Velocity (WPM)</span>
              <span>7-Day Cycle</span>
            </div>

            <div className="flex items-end justify-between h-40 bg-white/[0.02] border border-white/5 rounded-2xl p-6 relative">
              {weekData.map((data, index) => (
                <div key={data.day} className="flex flex-col items-center space-y-3 group relative">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {data.wpm} WPM
                  </div>
                  <div
                    className="bg-gradient-to-t from-blue-600 to-indigo-400 rounded-sm transition-all duration-500 hover:from-blue-400 hover:to-white min-w-[24px] relative group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] cursor-help"
                    style={{ height: `${data.height}%` }}
                  />
                  <span className="text-[10px] font-bold text-gray-600 uppercase">{data.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accuracy Chart */}
          <div className="space-y-3">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Precision Integrity</div>
            <div className="flex items-center space-x-1.5 h-12">
              {weekData.map((data, index) => (
                <div
                  key={`accuracy-${index}`}
                  className="flex-1 bg-emerald-500/20 rounded-sm border border-emerald-500/20 group relative cursor-help"
                  style={{ height: `${data.accuracy}%` }}
                >
                   <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {data.accuracy.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
            <div className="text-center">
              <p className="text-2xl font-black text-white">
                {Math.round(weekData.reduce((sum, d) => sum + d.wpm, 0) / weekData.length)}
              </p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">Avg Velocity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">
                {Math.round(weekData.reduce((sum, d) => sum + d.accuracy, 0) / weekData.length)}%
              </p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">Avg Precision</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-white">
                {studentStats?.totalSessions || weekData.length}
              </p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">SESSIONS</p>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/5 rounded-xl h-12"
            data-testid="button-detailed-analytics"
            onClick={() => window.location.href = "/student/analytics"}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            EXTRACT FULL ANALYTICS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}