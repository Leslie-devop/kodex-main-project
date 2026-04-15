import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, AlertCircle, Download, BarChart3, Clock, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";

interface DailyStats {
  todayWpm: number;
  todayAccuracy: number;
  sessionsToday: number;
  improvementToday: number;
}

interface ErrorData {
  id: string;
  pattern: string;
  frequency: number;
  errorType: string;
}

export default function StudentAnalytics() {
  const { user, isAuthenticated } = useAuth();

  const { data: dailyStats, isLoading: dailyLoading } = useQuery<DailyStats>({
    queryKey: ["/api/analytics/student/daily"],
    retry: false,
  });

  const { data: errorData, isLoading: errorLoading } = useQuery<ErrorData[]>({
    queryKey: ["/api/analytics/errors"],
    retry: false,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">
              DETAILED <span className="text-blue-500">ANALYTICS</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-wide font-mono text-xs uppercase tracking-[0.2em]">
              Real-time Neural Pattern Analysis & Daily Convergence
            </p>
          </div>
          <Button 
            onClick={() => {
              if (!dailyStats) return;
              const csvContent = "data:text/csv;charset=utf-8," 
                + "Metric,Value\n"
                + `Today's Best WPM,${Number(dailyStats.todayWpm || 0).toFixed(2)}\n`
                + `Today's Accuracy,${Number(dailyStats.todayAccuracy || 100).toFixed(2)}%\n`
                + `Sessions Today,${dailyStats.sessionsToday}\n`
                + `Daily Improvement,${Number(dailyStats.improvementToday || 0).toFixed(2)} WPM`;
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `kodex_tactical_data_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 text-xs font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/20"
          >
            <Download className="h-4 w-4" />
            Export Tactical Data
          </Button>
        </div>

        {/* Daily Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Today's Best WPM", value: Number(dailyStats?.todayWpm || 0).toFixed(2), icon: TrendingUp, color: "blue", suffix: "" },
            { label: "Today's Accuracy", value: `${Number(dailyStats?.todayAccuracy || 0).toFixed(2)}%`, icon: Target, color: "emerald", suffix: "" },
            { label: "Sessions Today", value: dailyStats?.sessionsToday || 0, icon: Activity, color: "purple", suffix: "" },
            { label: "Daily Improvement", value: `${(dailyStats?.improvementToday || 0) > 0 ? '+' : ''}${Number(dailyStats?.improvementToday || 0).toFixed(2)}`, icon: Zap, color: "amber", subtitle: "WPM change from yesterday" }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
                <item.icon className={`h-4 w-4 text-${item.color}-500/50`} />
              </div>
              <div className="text-4xl font-black text-slate-800 dark:text-white">{item.value}</div>
              {item.subtitle && (
                <p className="text-[9px] text-gray-600 font-medium mt-2 uppercase tracking-tight">{item.subtitle}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Tabs System */}
        <Tabs defaultValue="errors" className="space-y-8">
          <TabsList className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1 rounded-2xl w-full max-w-md mx-auto grid grid-cols-2 h-14">
            <TabsTrigger value="errors" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">
              Error Analysis
            </TabsTrigger>
            <TabsTrigger value="patterns" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[10px] font-black uppercase tracking-widest transition-all">
              Typing Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="errors">
            <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
              <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Common Mistakes Analysis</CardTitle>
                </div>
                <p className="text-xs text-gray-500 font-medium">Errors detected from your recent typing sessions</p>
              </CardHeader>
              <CardContent className="p-8">
                {errorData && errorData.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {errorData.map((error, idx) => (
                      <motion.div
                        key={error.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 rounded-3xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-[9px] font-black uppercase tracking-widest">
                            {error.errorType}
                          </Badge>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {error.frequency} Occurrences
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 dark:text-white mb-2 font-mono tracking-tighter">
                          {error.pattern}
                        </div>
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                          Neural Correction Required
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                       <div className="h-20 w-20 rounded-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center mx-auto mb-6">
                          <AlertCircle className="h-8 w-8 text-gray-300 dark:text-gray-700" />
                       </div>
                       <p className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">No error patterns detected yet</p>
                       <p className="text-xs text-gray-500 font-medium">Complete more typing sessions to see your common mistakes and patterns.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patterns">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
                <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5">
                  <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Daily Typing Behavior</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {[
                      { label: "Today's WPM", value: `${Number(dailyStats?.todayWpm || 0).toFixed(2)} WPM` },
                      { label: "Today's Accuracy", value: `${Number(dailyStats?.todayAccuracy || 0).toFixed(2)}%` },
                      { label: "Sessions Today", value: dailyStats?.sessionsToday || 0 },
                      { label: "Daily Improvement", value: `${Number(dailyStats?.improvementToday || 0).toFixed(2)} WPM` }
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 border-dashed">
                        <span className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest">{row.label}</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
                <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5">
                  <CardTitle className="flex items-center gap-3 text-xl font-black italic uppercase tracking-tighter">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Most Common Errors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {errorData && errorData.length > 0 ? (
                    <div className="space-y-4">
                      {errorData.slice(0, 5).map((error, idx) => (
                        <div key={error.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl font-mono font-black">
                              {error.pattern.split(' → ')[0]}
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{error.pattern}</div>
                              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{error.errorType} pattern</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black text-blue-500">{error.frequency}</div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Hits</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-20 text-center">
                      <div className="h-16 w-16 bg-white/[0.02] border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                         <AlertCircle className="h-6 w-6 text-gray-700" />
                      </div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">No tactical error data logged today.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}