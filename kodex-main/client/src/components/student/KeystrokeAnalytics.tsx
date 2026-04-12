import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, AlertTriangle, TrendingDown, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ErrorPattern } from "@/types";

export default function KeystrokeAnalytics() {
  const { toast } = useToast();

  const { data: errorPatterns, isLoading, error } = useQuery<ErrorPattern[]>({
    queryKey: ["/api/analytics/errors"],
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
      case "swap":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "missing":
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case "extra":
        return <Plus className="h-4 w-4 text-amber-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType) {
      case "swap":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      case "missing":
        return "bg-orange-500/10 border-orange-500/20 text-orange-400";
      case "extra":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
  };

  const getErrorTypeLabel = (errorType: string) => {
    switch (errorType) {
      case "swap":
        return "Neural Swap Fault";
      case "missing":
        return "Omission Fault";
      case "extra":
        return "Duplicate Input Fault";
      case "wrong":
        return "Pathing Error";
      default:
        return errorType.toUpperCase();
    }
  };

  // Mock finger performance data
  const fingerPerformance = [
    { finger: "Pinky", performance: 60, status: "slow", color: "bg-red-400" },
    { finger: "Ring", performance: 75, status: "ok", color: "bg-orange-400" },
    { finger: "Middle", performance: 90, status: "good", color: "bg-green-400" },
    { finger: "Index", performance: 95, status: "excellent", color: "bg-green-500" },
    { finger: "Thumb", performance: 100, status: "perfect", color: "bg-blue-400" },
  ];

  const handleExportCSV = () => {
    if (!errorPatterns || errorPatterns.length === 0) {
      toast({
        title: "No Data",
        description: "No error patterns to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = [
      ["Pattern", "Error Type", "Frequency", "Last Occurrence"],
      ...errorPatterns.map(pattern => [
        pattern.pattern,
        pattern.errorType,
        pattern.frequency.toString(),
        new Date(pattern.lastOccurrence).toLocaleDateString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keystroke-analytics.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Keystroke analytics exported to CSV",
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem]">
        <CardHeader>
          <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Logic Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">
            Neural Input Diagnostics
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleExportCSV}
            className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-white hover:bg-white/5 h-10 px-4 rounded-xl"
            data-testid="button-export-csv"
          >
            <Download className="h-3 w-3 mr-2" />
            EXTRACT DATA
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-10">
        {/* Error Pattern Analysis */}
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">CRYTICAL HUB: DEVIATION VECTORS</h4>
          <div className="space-y-4">
            {errorPatterns && errorPatterns.length > 0 ? (
              errorPatterns.slice(0, 3).map((pattern, index) => (
                <div
                  key={pattern.id}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all hover:bg-white/[0.03] ${getErrorTypeColor(pattern.errorType)}`}
                  data-testid={`error-pattern-${index}`}
                >
                  <div className="flex items-center space-x-5">
                    <div className="p-3 bg-black/20 rounded-xl">
                      {getErrorTypeIcon(pattern.errorType)}
                    </div>
                    <div>
                      <div className="text-2xl font-black font-mono tracking-tighter" data-testid={`error-pattern-text-${index}`}>
                        {pattern.pattern}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{getErrorTypeLabel(pattern.errorType)}</span>
                    </div>
                  </div>
                  <div className="text-sm font-black bg-black/20 px-3 py-1 rounded-full border border-white/5" data-testid={`error-frequency-${index}`}>
                    {pattern.frequency} FAULTS
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                <div className="font-bold text-emerald-400 uppercase tracking-widest text-xs">Pristine Neural Link</div>
                <div className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">Complete high-velocity sessions to generate diagnostic data.</div>
              </div>
            )}
          </div>
        </div>

        {/* Typing Speed by Finger */}
        <div>
          <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">NEURAL INTERFACE: FINGER OCTETS</h4>
          <div className="grid grid-cols-5 gap-4">
            {fingerPerformance.map((finger, index) => (
              <div key={finger.finger} className="text-center group" data-testid={`finger-analysis-${index}`}>
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-tighter mb-3 group-hover:text-white transition-colors">{finger.finger}</div>
                <div className="h-24 bg-white/[0.03] border border-white/5 rounded-xl flex items-end justify-center p-1 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div 
                    className={`w-full rounded-lg transition-all duration-700 ease-out relative z-10 ${
                       finger.status === 'excellent' || finger.status === 'perfect' ? 'bg-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.3)]' :
                       finger.status === 'good' ? 'bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                       'bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    }`}
                    style={{ height: `${finger.performance}%` }}
                  ></div>
                </div>
                <div className="text-[9px] font-black mt-3 uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity" data-testid={`finger-status-${index}`}>
                  {finger.status === 'perfect' ? 'OPTIMAL' : 
                   finger.status === 'excellent' ? 'HIGH-EFF' : 
                   finger.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights and Recommendations */}
        {errorPatterns && errorPatterns.length > 0 && (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-8">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Neural Insights</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-xs text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                <span>Peak error frequency detected on <span className="text-blue-400 font-bold">"{errorPatterns[0]?.pattern}"</span> cluster nodes.</span>
              </li>
              <li className="flex items-start space-x-3 text-xs text-gray-400">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                <span><span className="text-amber-400 font-bold">{fingerPerformance.filter(f => f.status === "slow" || f.status === "ok").length} sub-optimal fingers</span> detected. Recommend recalibration.</span>
              </li>
            </ul>
          </div>
        )}

        {/* Action Items */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Badge className="bg-white/5 border-white/10 text-gray-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg" data-testid="badge-action-practice">
            CORE COMBINATIONS
          </Badge>
          <Badge className="bg-white/5 border-white/10 text-gray-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg" data-testid="badge-action-posture">
            FINGER ANCHORING
          </Badge>
          <Badge className="bg-white/5 border-white/10 text-gray-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg" data-testid="badge-action-rhythm">
            RHYTHM CADENCE
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
