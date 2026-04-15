import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, BarChart3, Clock, Target, Zap, AlertCircle, User } from "lucide-react";
import { motion } from "framer-motion";

interface Session {
  id: string;
  wpm: string;
  accuracy: string;
  errors: number;
  timeSpent: number;
  completedAt: string;
}

interface ReportData {
  assignment: any;
  sessions: Session[];
  teacher: {
    firstName: string;
    lastName: string;
    username: string;
  } | null;
  lesson: any;
}

interface MissionReportDialogProps {
  assignmentId: string | null;
  onClose: () => void;
}

export default function MissionReportDialog({ assignmentId, onClose }: MissionReportDialogProps) {
  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/assignments", assignmentId, "report"],
    enabled: !!assignmentId,
  });

  const overallStats = report?.sessions.reduce((acc, s) => {
    acc.totalWpm += parseFloat(s.wpm);
    acc.totalAccuracy += parseFloat(s.accuracy);
    acc.totalErrors += s.errors;
    return acc;
  }, { totalWpm: 0, totalAccuracy: 0, totalErrors: 0 }) || { totalWpm: 0, totalAccuracy: 0, totalErrors: 0 };

  const avgWpm = report?.sessions.length ? (overallStats.totalWpm / report.sessions.length).toFixed(2) : "0.00";
  const avgAccuracy = report?.sessions.length ? (overallStats.totalAccuracy / report.sessions.length).toFixed(2) : "0.00";

  return (
    <Dialog open={!!assignmentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-[#0f172a] border-gray-100 dark:border-white/10 text-slate-900 dark:text-white p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-8 pb-0">
          <div className="flex items-center justify-between mb-4">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
              Mission <span className="text-blue-500">Intelligence Report</span>
            </DialogTitle>
          </div>
          
          {report && (
            <div className="flex items-center gap-4 py-4 border-y border-gray-50 dark:border-white/5">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                 <User className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Commanding Officer</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {report.teacher ? `Instructor: ${report.teacher.firstName} ${report.teacher.lastName}` : "Command AI"}
                </p>
              </div>
            </div>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-8">
          <div className="space-y-8">
            {/* Feedback Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400">
                <MessageSquare className="h-4 w-4" />
                Teacher Feedback & Observations
              </div>
              <div className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-6 rounded-2xl min-h-[100px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                {report?.assignment?.feedback ? (
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic w-full">
                    "{report.assignment.feedback}"
                  </p>
                ) : (
                  <div className="text-center">
                    <AlertCircle className="h-6 w-6 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic uppercase tracking-tight">No tactical feedback logged by command yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Session Logs */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">
                <BarChart3 className="h-4 w-4" />
                Performance Log Engagement
              </div>
              <div className="space-y-4">
                {report?.sessions.map((session, index) => (
                   <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={session.id}
                    className="bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl p-5 hover:bg-gray-100/50 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 bg-blue-500/10 px-2 py-1 rounded">ATTEMPT {index + 1}</span>
                         <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                           {new Date(session.completedAt).toLocaleString()}
                         </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Velocity</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">{session.wpm} <span className="text-[10px] text-gray-500">WPM</span></div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Precision</div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{session.accuracy}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Integrity</div>
                        <div className="text-lg font-black text-red-500 dark:text-red-400">{session.errors} <span className="text-[10px] text-gray-500">ERR</span></div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Duration</div>
                        <div className="text-lg font-black text-slate-900 dark:text-white">{Math.floor(session.timeSpent / 60)}m {session.timeSpent % 60}s</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Overall Summary */}
             <section className="bg-gradient-to-br from-blue-600/10 via-transparent to-transparent border border-blue-500/20 rounded-[2rem] p-8">
               <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2">
                 <Zap className="h-4 w-4" />
                 Engagement Summary
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">AVG Velocity</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{avgWpm}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">AVG Precision</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgAccuracy}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Total Errors</div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-500">{overallStats.totalErrors}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Sessions</div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{report?.sessions.length}</div>
                  </div>
               </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
