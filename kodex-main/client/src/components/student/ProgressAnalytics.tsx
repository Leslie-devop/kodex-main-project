import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity } from "lucide-react";
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

  const processWeekData = () => {
    if (!weeklyProgress || weeklyProgress.length === 0) {
      return [];
    }
    
    // Max values to calculate height
    const maxWpm = Math.max(...weeklyProgress.map(d => Number(d.wpm) || 0), 10);

    return weeklyProgress.map((data: any) => {
      const wpmNum = Number(data.wpm) || 0;
      const accuracyNum = Number(data.accuracy) || 0;
      
      return {
        day: new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' }),
        wpm: wpmNum,
        height: Math.max(10, (wpmNum / maxWpm) * 100),
        accuracy: accuracyNum,
      };
    });
  };

  const weekData = processWeekData();

  // Determine performance trend based on improvement or average WPM change
  const performanceTrend = (studentStats?.improvement || 0) > 5 ? 'improving' :
                           (studentStats?.improvement || 0) < -5 ? 'declining' : 'stable';

  return (
    <Card data-testid="card-progress-analytics" className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5">
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

            <div className="flex items-end justify-between h-40 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-6 relative">
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
          {weekData.length > 0 ? (
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
          ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/5 rounded-3xl">
                 <div className="h-12 w-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 animate-pulse">
                    <Activity className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                 </div>
                 <div className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.3em]">Awaiting Data Acquisition</div>
                 <p className="text-[9px] text-gray-500 dark:text-gray-500 mt-2 font-medium uppercase">Neural patterns pending first mission completion.</p>
              </div>
          )}

          {/* Stats Summary */}
          {weekData.length > 0 && (
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100 dark:border-white/5">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {Math.round(weekData.reduce((sum, d) => sum + d.wpm, 0) / weekData.length)}
                </p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">Avg Velocity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {Math.round(weekData.reduce((sum, d) => sum + d.accuracy, 0) / weekData.length)}%
                </p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">Avg Precision</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {studentStats?.totalSessions || weekData.length}
                </p>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter mt-1">SESSIONS</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl h-12"
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