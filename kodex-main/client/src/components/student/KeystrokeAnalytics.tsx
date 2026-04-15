import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle, TrendingDown, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ErrorPattern } from "@/types";
import { motion } from "framer-motion";

interface KeystrokeData {
  id: string;
  sessionId: string;
  studentId: string;
  keyPressed: string;
  timingMs: number;
  wasError: boolean;
  fingerUsed: string;
  createdAt: string;
}

export default function KeystrokeAnalytics() {
  const { toast } = useToast();

  const { data: errorPatterns, isLoading, error } = useQuery<ErrorPattern[]>({
    queryKey: ["/api/analytics/errors"],
    retry: false,
  });

  const { data: keystrokesRaw } = useQuery<KeystrokeData[]>({
    queryKey: ["/api/keystrokes/student"],
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

  const getErrorTypeIcon = (errorType: string) => {
    switch (errorType) {
      case "swap": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "missing": return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case "extra": return <Plus className="h-4 w-4 text-amber-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType) {
      case "swap": return "bg-red-500/10 border-red-500/20 text-red-400";
      case "missing": return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      case "extra": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
  };

  const getErrorTypeLabel = (errorType: string) => {
    switch (errorType) {
      case "swap": return "Neural Swap Fault";
      case "missing": return "Omission Fault";
      case "extra": return "Duplicate Input Fault";
      case "wrong": return "Pathing Error";
      default: return errorType.toUpperCase();
    }
  };

  const getFingerPerformance = () => {
    const baseStats = [
      { finger: "Pinky", performance: 0, status: "slow", color: "#ff6b6b" },
      { finger: "Ring", performance: 0, status: "slow", color: "#ff6b6b" },
      { finger: "Middle", performance: 0, status: "slow", color: "#ff6b6b" },
      { finger: "Index", performance: 0, status: "slow", color: "#ff6b6b" },
      { finger: "Thumb", performance: 0, status: "slow", color: "#ff6b6b" },
    ];

    if (!keystrokesRaw || keystrokesRaw.length === 0) return baseStats;
    
    const stats: Record<string, { errors: number, total: number }> = {
      pinky: { errors: 0, total: 0 },
      ring: { errors: 0, total: 0 },
      middle: { errors: 0, total: 0 },
      index: { errors: 0, total: 0 },
      thumb: { errors: 0, total: 0 },
    };

    keystrokesRaw.forEach(k => {
      const finger = k.fingerUsed?.toLowerCase() || 'unknown';
      if (stats[finger]) {
        stats[finger].total++;
        if (k.wasError) stats[finger].errors++;
      }
    });

    return ["Pinky", "Ring", "Middle", "Index", "Thumb"].map(fName => {
      const f = fName.toLowerCase();
      const st = stats[f];
      const performance = st.total > 0 ? Math.round(((st.total - st.errors) / st.total) * 100) : 0;
      
      let status = "Poor";
      let color = "#ff6b6b"; 
      
      if (performance >= 98) { status = "Perfect"; color = "#54a0ff"; }
      else if (performance >= 95) { status = "Optimal"; color = "#2ecc71"; }
      else if (performance >= 90) { status = "High-Eff"; color = "#54e096"; }
      else if (performance >= 80) { status = "Good"; color = "#54e096"; }
      else if (performance >= 70) { status = "Slow"; color = "#ff9f43"; }

      return { finger: fName, performance, status, color };
    });
  };

  const fingerPerformance = getFingerPerformance();

  const handleExportCSV = () => {
    if (!errorPatterns || errorPatterns.length === 0) {
      toast({ title: "No Data", description: "No error patterns to export", variant: "destructive" });
      return;
    }
    const csvData = [["Pattern", "Error Type", "Frequency", "Last Occurrence"], ...errorPatterns.map(p => [p.pattern, p.errorType, p.frequency.toString(), new Date(p.lastOccurrence).toLocaleDateString()])];
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "keystroke-analytics.csv"; a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Keystroke analytics exported to CSV" });
  };

  if (isLoading) return <Card className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-12 h-96 animate-pulse" />;

  return (
    <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 backdrop-blur-xl rounded-[2.5rem] shadow-sm dark:shadow-none overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-gray-50 dark:border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">
            Neural Input Diagnostics
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleExportCSV}
            className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 h-10 px-4 rounded-xl"
          >
            <Download className="h-3 w-3 mr-2" />
            EXTRACT DATA
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-12">
        {/* Error Patterns */}
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Critical Hub: Deviation Vectors</h4>
          <div className="space-y-4">
            {errorPatterns && errorPatterns.length > 0 ? (
              errorPatterns.slice(0, 3).map((pattern, index) => (
                <div key={pattern.id} className={`flex items-center justify-between p-5 rounded-2xl border ${getErrorTypeColor(pattern.errorType)}`}>
                  <div className="flex items-center space-x-5">
                    <div className="p-3 bg-gray-100 dark:bg-black/20 rounded-xl">{getErrorTypeIcon(pattern.errorType)}</div>
                    <div>
                      <div className="text-2xl font-black font-mono tracking-tighter">{pattern.pattern}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{getErrorTypeLabel(pattern.errorType)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-black bg-gray-100 dark:bg-black/20 px-3 py-1 rounded-full border border-gray-200 dark:border-white/5">{pattern.frequency} FAULTS</div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-xs">Pristine Neural Link</div>
              </div>
            )}
          </div>
        </div>

        {/* Finger Bio-Metrics */}
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-8">Neural Interface: Finger Octets</h4>
          <div className="grid grid-cols-5 gap-4 mb-8">
            {fingerPerformance.map((f, i) => (
              <div key={f.finger} className="text-center group">
                <div className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-tighter mb-3">{f.finger}</div>
                <div className="h-24 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl flex items-end justify-center p-1 overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100" />
                   <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${f.performance}%` }}
                     className="w-full rounded-lg relative z-10"
                     style={{ backgroundColor: f.color }}
                   />
                </div>
                <div className="text-[9px] font-black mt-3 uppercase tracking-tighter text-slate-400 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
                  {f.status} ({f.performance}%)
                </div>
              </div>
            ))}
          </div>

          {/* Color Scale Legend */}
          <div className="pt-8 border-t border-gray-50 dark:border-white/5">
             <div className="grid grid-cols-5 gap-1">
                {[
                  { label: "Poor", color: "#ff6b6b" },
                  { label: "Slow", color: "#ff9f43" },
                  { label: "Good", color: "#54e096" },
                  { label: "Excellent", color: "#2ecc71" },
                  { label: "Perfect", color: "#54a0ff" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="h-4 w-full rounded-sm mb-2" style={{ backgroundColor: item.color }} />
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Insights */}
        {errorPatterns && errorPatterns.length > 0 && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-8">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Neural Insights</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-xs text-slate-500 dark:text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>Critical latency detected on <span className="text-blue-600 dark:text-blue-400 font-bold">"{errorPatterns[0]?.pattern}"</span> cluster.</span>
              </li>
              <li className="flex items-start space-x-3 text-xs text-slate-500 dark:text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span><span className="text-amber-600 dark:text-amber-400 font-bold">{fingerPerformance.filter(f => f.performance < 85).length} sub-optimal fingers</span> identified.</span>
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
