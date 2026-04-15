import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, FileText, Play, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LessonAssignment } from "@/types";
import MissionReportDialog from "./MissionReportDialog";
import { motion } from "framer-motion";

interface AssignedLessonsProps {
  assignments: LessonAssignment[] | undefined;
  isLoading: boolean;
}

export default function AssignedLessons({ assignments, isLoading }: AssignedLessonsProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "overdue":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Completed";
      case "in_progress": return "In Progress";
      case "overdue": return "Overdue";
      case "pending": return "Pending";
      default: return "Not Started";
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
        {assignments && assignments.length > 0 ? (
          assignments.map((assignment) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              className="group relative bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-[2rem] p-7 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:border-blue-500/40 transition-all overflow-hidden backdrop-blur-md shadow-sm dark:shadow-2xl flex flex-col min-h-[300px]"
            >
              {/* Cinematic Background Glow on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 h-full flex flex-col flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${getStatusColor(assignment.status)}`}>
                    {getStatusLabel(assignment.status)}
                  </div>
                  {assignment.lesson?.difficulty && (
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                      {assignment.lesson.difficulty} PHASE
                    </Badge>
                  )}
                </div>

                <div className="mb-8 flex-grow">
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tighter italic leading-none">
                    {assignment.lesson?.title || "Untitled Objective"}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-gray-500 mt-4 line-clamp-3 font-medium leading-relaxed uppercase tracking-tight">
                    {assignment.lesson?.description || "Deploying neural interface for mission objective. Full brief available in terminal."}
                  </p>
                </div>
                
                <div className="space-y-5 mt-auto pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">SYNC PROGRESS</span>
                    <span className="text-blue-500 dark:text-blue-400 font-mono">
                      {Math.round(Number(assignment.progress || 0))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 border border-gray-200 dark:border-white/5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Number(assignment.progress || 0))}%` }}
                      transition={{ duration: 1, ease: "circOut" }}
                      className="bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 h-full rounded-full"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <Calendar className="h-3 w-3 mr-2 text-blue-500" />
                        <span className={isOverdue(assignment.dueDate) ? "text-red-500" : "text-slate-300"}>
                           {formatDueDate(assignment.dueDate)}
                        </span>
                      </div>
                      {assignment.maxAttempts > 0 && (
                        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                           LOADS: <span className={(assignment.sessionCount || 0) >= assignment.maxAttempts ? "text-red-500" : "text-blue-400"}>
                             {assignment.sessionCount || 0}/{assignment.maxAttempts}
                           </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                       {assignment.feedback && (
                         <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-pulse">
                           <MessageSquare className="h-3 w-3 text-blue-500" />
                           <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">Critique</span>
                         </div>
                       )}
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-white/5 transition-all"
                        onClick={() => setSelectedReportId(assignment.id)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        disabled={
                          (assignment.maxAttempts > 0 && (assignment.sessionCount || 0) >= assignment.maxAttempts) ||
                          (isOverdue(assignment.dueDate) && assignment.status !== "completed")
                        }
                        className={`h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest gap-2 transition-all shadow-lg active:scale-95 ${
                          (assignment.maxAttempts > 0 && (assignment.sessionCount || 0) >= assignment.maxAttempts) ||
                          (isOverdue(assignment.dueDate) && assignment.status !== "completed")
                            ? "bg-red-500/10 text-red-500 border border-red-500/20 cursor-not-allowed opacity-50"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                        }`}
                        onClick={() => setLocation(`/student/lesson/${assignment.lessonId}/${assignment.id}`)}
                      >
                        {assignment.status === "completed" ? (
                          <>
                             <CheckCircle2 className="h-3.5 w-3.5" />
                             REVIEW
                          </>
                        ) : (assignment.maxAttempts > 0 && (assignment.sessionCount || 0) >= assignment.maxAttempts) ? (
                          <>LOCKED (LIMIT)</>
                        ) : isOverdue(assignment.dueDate) ? (
                          <>LOCKED (PAST DUE)</>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5 fill-current" />
                            ENGAGE
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-white dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/5 rounded-[4rem] backdrop-blur-xl">
             <div className="h-20 w-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-200 dark:border-white/10">
                <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-700" />
             </div>
            <p className="font-black text-slate-800 dark:text-white uppercase tracking-[0.4em] text-xl italic mb-3">Communication Clear</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">No tactical objectives active in your current sector.</p>
          </div>
        )}
      </div>

      <MissionReportDialog 
        assignmentId={selectedReportId} 
        onClose={() => setSelectedReportId(null)} 
      />
    </>
  );
}
