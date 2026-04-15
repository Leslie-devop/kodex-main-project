import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  BarChart3, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Calendar as LucideCalendar,
  Search,
  RefreshCw,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { LessonAssignment } from "@/types";
import type { TypingSession } from "@shared/schema";

interface StudentStats {
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalTimeMinutes: number;
  improvement: number;
}

interface PerformanceData {
  date: string;
  wpm: number;
  accuracy: number;
}

export default function StudentProgress() {
  const { user, isAuthenticated } = useAuth();
  const [timeRange, setTimeRange] = useState("daily");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ["/api/analytics/student/stats"],
    retry: false,
  });

  const { data: assignments } = useQuery<LessonAssignment[]>({
    queryKey: ["/api/assignments/student"],
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery<TypingSession[]>({
    queryKey: ["/api/sessions/student"],
  });

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const validSessions = sessions.filter(s => Number(s.timeSpent || 0) > 0);
    if (!selectedDate) return validSessions;
    
    return validSessions.filter(session => {
      const sessionDate = new Date(session.startedAt || session.completedAt || "");
      return sessionDate.toDateString() === selectedDate.toDateString();
    });
  }, [sessions, selectedDate]);

  const weeklyData = useMemo(() => {
    if (!sessions) return [];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const daySessions = sessions.filter(s => s.completed && Number(s.timeSpent || 0) > 0 && new Date(s.completedAt || s.startedAt || "").toDateString() === dateStr);
      
      const avgWpm = daySessions.length > 0 
        ? Math.round(daySessions.reduce((acc, s) => acc + Number(s.wpm || 0), 0) / daySessions.length) 
        : 0;
      const avgAcc = daySessions.length > 0 
        ? Math.round(daySessions.reduce((acc, s) => acc + (Number(s.accuracy) || 0), 0) / daySessions.length) 
        : 0;
        
      result.push({
        label: format(d, 'EEE, MMM d'),
        wpm: avgWpm,
        accuracy: avgAcc
      });
    }
    return result;
  }, [sessions]);

  const monthlyData = useMemo(() => {
    if (!sessions) return [];
    const result = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.getMonth();
      const year = d.getFullYear();
      
      const monthSessions = sessions.filter(s => {
        const sDate = new Date(s.completedAt || s.startedAt || "");
        return s.completed && Number(s.timeSpent || 0) > 0 && sDate.getMonth() === month && sDate.getFullYear() === year;
      });

      const avgWpm = monthSessions.length > 0 
        ? Math.round(monthSessions.reduce((acc, s) => acc + Number(s.wpm || 0), 0) / monthSessions.length) 
        : 0;
      const avgAcc = monthSessions.length > 0 
        ? Math.round(monthSessions.reduce((acc, s) => acc + (Number(s.accuracy) || 0), 0) / monthSessions.length) 
        : 0;

      result.push({
        label: format(d, 'MMM yyyy'),
        wpm: avgWpm,
        accuracy: avgAcc
      });
    }
    return result;
  }, [sessions]);

  const assignmentStats = useMemo(() => {
    if (!assignments) return { pending: 0, in_progress: 0, completed: 0, overdue: 0 };
    return assignments.reduce((acc, curr) => {
      const isOverdue = curr.dueDate && new Date(curr.dueDate) < new Date();
      if (curr.status === "completed") acc.completed++;
      else if (isOverdue) acc.overdue++;
      else if (curr.status === "in_progress") acc.in_progress++;
      else acc.pending++;
      return acc;
    }, { pending: 0, in_progress: 0, completed: 0, overdue: 0 });
  }, [assignments]);

  const trend = useMemo(() => {
    const improvement = stats?.improvement || 0;
    if (improvement > 5) return { label: "Improving", color: "text-emerald-400", icon: TrendingUp };
    if (improvement < -5) return { label: "Needs Focus", color: "text-red-400", icon: TrendingDown };
    return { label: "Stable", color: "text-blue-400", icon: Target };
  }, [stats]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const currentChartData = timeRange === "monthly" ? monthlyData : weeklyData;

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white mb-2">
            GLOBAL <span className="text-blue-500">PROGRESS MATRIX</span>
          </h1>
          <p className="text-gray-400 font-medium font-mono text-xs uppercase tracking-[0.3em]">
            Historical Convergence: Multi-temporal Performance Analytics
          </p>
        </div>

        {/* Global Overview Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none">
             <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global WPM</span>
             </div>
             <div className="text-4xl font-black text-slate-800 dark:text-white">{Number(stats?.avgWpm || 0).toFixed(2)}</div>
             <div className="mt-2 text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-gray-600">Lifetime Average Velocity</div>
          </Card>
          <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none">
             <div className="flex items-center justify-between mb-4">
                <Target className="h-5 w-5 text-emerald-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global Accuracy</span>
             </div>
             <div className="text-4xl font-black font-mono text-emerald-400">{Number(stats?.avgAccuracy || 0).toFixed(2)}%</div>
             <div className="mt-2 text-[10px] font-black uppercase tracking-tighter text-gray-600">Total precision integrity</div>
          </Card>
          <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none">
             <div className="flex items-center justify-between mb-4">
                <Award className="h-5 w-5 text-purple-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Sessions</span>
             </div>
             <div className="text-4xl font-black text-slate-800 dark:text-white">{stats?.totalSessions || 0}</div>
             <div className="mt-2 text-[10px] font-black uppercase tracking-tighter text-slate-500 dark:text-gray-600">Completed synchronizations</div>
          </Card>
          <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none">
             <div className="flex items-center justify-between mb-4">
                <Clock className="h-5 w-5 text-orange-500" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Uptime</span>
             </div>
             <div className="text-4xl font-black text-slate-800 dark:text-white">{formatTime(stats?.totalTimeMinutes || 0)}</div>
             <div className="mt-2 text-[10px] font-black uppercase tracking-tighter text-gray-600">Active neural connection</div>
          </Card>
        </div>

        {/* Temporal Performance Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Improvement Card with Calendar Filter */}
          <div className="lg:col-span-1 border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 rounded-[2.5rem] p-10 text-center relative overflow-hidden group shadow-sm dark:shadow-none">
             <div className="absolute top-0 right-0 p-6 z-20">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-md",
                    selectedDate ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-gray-50 dark:bg-white/5 text-slate-400 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                  )}>
                    <LucideCalendar className="h-6 w-6" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1e293b] border-white/10 rounded-2xl shadow-2xl" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className="rounded-2xl border-none"
                    />
                  </PopoverContent>
                </Popover>
             </div>
             
             <div className="space-y-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Convergence Delta</div>
                <div className={`text-7xl font-black ${trend.color} tracking-tighter italic`}>
                  {Number(stats?.improvement || 0).toFixed(2)}<span className="text-2xl ml-1">%</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                   <trend.icon className={`h-4 w-4 ${trend.color}`} />
                   <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${trend.color}`}>{trend.label} Phase</span>
                </div>
                <p className="text-[9px] text-gray-600 uppercase font-bold tracking-tighter">Analysis of peak performance variance relative to historical averages.</p>
             </div>
          </div>

          {/* Historical Charts with Time Range Toggles */}
          <Card className="lg:col-span-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
            <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-500">Temporal Velocity Chart</CardTitle>
              <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 h-10 p-1">
                  <TabsTrigger value="daily" className="text-[9px] font-black uppercase tracking-widest px-3 data-[state=active]:bg-blue-600">Daily</TabsTrigger>
                  <TabsTrigger value="weekly" className="text-[9px] font-black uppercase tracking-widest px-3 data-[state=active]:bg-blue-600">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly" className="text-[9px] font-black uppercase tracking-widest px-3 data-[state=active]:bg-blue-600">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-8">
               <div className="flex items-end justify-between h-48 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-8 relative">
                  <div className="absolute top-8 right-8 flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">Velocity</span>
                     </div>
                  </div>
                  {currentChartData.map((data: any, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-4 flex-1 group/bar relative">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity z-10">
                        {data.wpm} WPM
                      </div>
                      <div 
                        className="w-full max-w-[40px] bg-gradient-to-t from-blue-600/50 to-blue-400 rounded-sm hover:from-blue-400 hover:to-white transition-all duration-500 shadow-lg shadow-blue-500/10"
                        style={{ height: `${(data.wpm / 100) * 100}%` }}
                      />
                      <span className="text-[8px] font-black text-gray-700 uppercase leading-none text-center h-4">{data.label}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Engagement Log */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Engagement <span className="text-blue-500">History Log</span></h3>
              {selectedDate && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest px-3">
                  {format(selectedDate, "MMM dd, yyyy")}
                </Badge>
              )}
            </div>
            
            {selectedDate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDate(undefined)}
                className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Reset Historical View
              </Button>
            )}
          </div>
          
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="overflow-x-auto">
              {filteredSessions.length === 0 ? (
                <div className="p-20 text-center italic text-gray-600 uppercase font-black tracking-widest text-xs">
                   No tactical data sequences recorded for this period.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.2em]">
                      <th className="p-6">Tactical Protocol</th>
                      <th className="p-6 text-center">Velocity</th>
                      <th className="p-6 text-center">Precision</th>
                      <th className="p-6 text-center">Duration</th>
                      <th className="p-6 text-right">Synchronization Signal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredSessions?.map((session, idx) => (
                      <tr key={session.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-6">
                           <div className="text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Sequence #{filteredSessions.length - idx}</div>
                           <div className="text-[9px] text-slate-400 dark:text-gray-600 font-mono">NODE: {session.id.slice(0, 12)}</div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="text-lg font-black text-blue-400">{Number(session.wpm).toFixed(2)}</div>
                          <div className="text-[8px] font-black uppercase text-gray-600">Words Per Minute</div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="text-lg font-black font-mono text-emerald-400">{Number(session.accuracy).toFixed(2)}%</div>
                          <div className="text-[8px] font-black uppercase text-gray-600">Integrity Check</div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="text-sm font-bold text-gray-400">{Math.floor(Number(session.timeSpent || 0) / 60)}m {Number(session.timeSpent || 0) % 60}s</div>
                        </td>
                        <td className="p-6 text-right">
                           <div className="text-[10px] font-black text-white uppercase tracking-widest">
                             {format(new Date(session.startedAt || session.completedAt || ""), "MMM dd, yyyy")}
                           </div>
                           <div className="text-[9px] font-bold text-gray-500 uppercase">Archive Date</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}