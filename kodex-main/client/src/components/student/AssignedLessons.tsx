import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { LessonAssignment } from "@/types";

export default function AssignedLessons() {
  const { toast } = useToast();

  const { data: assignments, isLoading, error } = useQuery<LessonAssignment[]>({
    queryKey: ["/api/assignments/student"],
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "overdue":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "overdue":
        return "Overdue";
      case "pending":
        return "Pending";
      default:
        return "Not Started";
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem]">
        <CardHeader>
          <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">Active Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            ))}
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
            Pending Protocols
          </CardTitle>
          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-tighter" data-testid="text-active-lessons">
            {assignments?.filter(a => a.status === "in_progress" || a.status === "pending").length || 0} ACTIVE MISSIONS
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-1 gap-6">
          {assignments && assignments.length > 0 ? (
            assignments.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/5 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
                data-testid={`card-assignment-${assignment.id}`}
                onClick={() => window.location.href = `/student/lesson/${assignment.lessonId}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight" data-testid={`text-lesson-title-${assignment.id}`}>
                      {assignment.lesson?.title || "Untitled Lesson"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1" data-testid={`text-lesson-description-${assignment.id}`}>
                      {assignment.lesson?.description || "No description available"}
                    </p>
                  </div>
                  <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${getStatusColor(assignment.status)}`} data-testid={`badge-status-${assignment.id}`}>
                    {getStatusLabel(assignment.status)}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">Synchronization</span>
                    <span className="text-blue-400" data-testid={`text-progress-${assignment.id}`}>
                      {Math.round(Number(assignment.progress || 0))}%
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 border border-white/10 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Number(assignment.progress || 0))}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <Calendar className="h-3 w-3 mr-2 text-blue-500" />
                      <span 
                        className={isOverdue(assignment.dueDate) ? "text-red-400" : ""}
                        data-testid={`text-due-date-${assignment.id}`}
                      >
                        DEALINE: {formatDueDate(assignment.dueDate)}
                      </span>
                    </div>

                    {assignment.lesson?.difficulty && (
                      <Badge className="bg-white/5 border-white/10 text-gray-500 text-[10px] font-bold uppercase py-0 px-2" data-testid={`badge-difficulty-${assignment.id}`}>
                        {assignment.lesson.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-700" />
              <p className="font-bold text-white uppercase tracking-widest text-sm" data-testid="text-no-assignments">Clear Roster</p>
              <p className="text-xs text-gray-500 mt-2">No pending objectives assigned by high command.</p>
            </div>
          )}
        </div>

        {assignments && assignments.length > 5 && (
          <Button 
            variant="ghost" 
            className="w-full mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/5 rounded-xl h-12"
            data-testid="button-view-all-lessons"
            onClick={() => window.location.href = "/student/lessons"}
          >
            Access Full Database ({assignments.length} Missions)
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
