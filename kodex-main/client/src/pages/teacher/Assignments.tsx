import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { 
  FileText, 
  Plus, 
  Search, 
  Users, 
  School, 
  Calendar, 
  Clock,
  Trash2,
  Filter,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eraser,
  ExternalLink,
  ChevronDown,
  Edit2,
  MessageSquare
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Assignment {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  studentId?: string;
  classroomId?: string;
  dueDate: string;
  status: string;
  progress: string;
  allowBackspace: boolean;
  feedback?: string;
  lesson?: { title: string };
  student?: { firstName: string, lastName: string };
  studentName?: string;
  classroom?: { name: string };
  assignedAt: string;
}

export default function Assignments() {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; assignmentId: string; currentFeedback: string }>({
    open: false,
    assignmentId: "",
    currentFeedback: "",
  });

  const { data: classrooms } = useQuery<any[]>({
    queryKey: ["/api/classrooms"],
    retry: false,
    refetchInterval: 60000,
  });

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/teacher"],
    retry: false,
    refetchInterval: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      toast({ title: "Assignment Deleted", description: "The assignment has been successfully removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ id, feedback }: { id: string; feedback: string }) => {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) throw new Error("Failed to send feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      setFeedbackDialog(prev => ({ ...prev, open: false }));
      toast({ title: "Feedback Sent", description: "The student has been notified." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const filteredAssignments = assignments?.filter(a => {
    const matchesSearch = 
      (a.lesson?.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (a.lessonTitle?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (a.student?.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (a.studentName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (a.classroom?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesDifficulty = difficultyFilter === "all" || (a as any).lessonDifficulty === difficultyFilter;
    const matchesClassroom = classroomFilter === "all" || a.classroomId === classroomFilter || (classroomFilter === "unassigned" && !a.classroomId);

    return matchesSearch && matchesStatus && matchesDifficulty && matchesClassroom;
  }).sort((a, b) => {
    if (sortOrder === "a-z") {
      const titleA = (a.lesson?.title || a.lessonTitle || "").toLowerCase();
      const titleB = (b.lesson?.title || b.lessonTitle || "").toLowerCase();
      return titleA.localeCompare(titleB);
    } else if (sortOrder === "z-a") {
      const titleA = (a.lesson?.title || a.lessonTitle || "").toLowerCase();
      const titleB = (b.lesson?.title || b.lessonTitle || "").toLowerCase();
      return titleB.localeCompare(titleA);
    } else {
      return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/20 transition-colors">
      <Header />
      
      <main className="max-w-[1400px] mx-auto px-6 lg:px-10 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
                    <FileText className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Assignments
                </h2>
            </div>
            <p className="text-slate-500 dark:text-gray-400 font-semibold text-lg max-w-2xl">Distribute lessons to students or entire classrooms.</p>
          </motion.div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  placeholder="Filter assignments..." 
                  className="pl-12 w-full md:w-80 h-14 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl focus:ring-blue-500/20 font-bold shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Link href="/teacher/assignments/create">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl px-8 h-14 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  <Plus className="mr-3 h-6 w-6" />
                  Create Assignment
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs text-slate-900 dark:text-white">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-800">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Difficulty</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-40 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs text-slate-900 dark:text-white">
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-800">
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Classroom</Label>
                <Select value={classroomFilter} onValueChange={setClassroomFilter}>
                  <SelectTrigger className="w-40 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs text-slate-900 dark:text-white">
                    <SelectValue placeholder="All Classrooms" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-800 max-h-60">
                    <SelectItem value="all">All Classrooms</SelectItem>
                    <SelectItem value="unassigned">No Classroom</SelectItem>
                    {classrooms?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sort</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-40 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs text-slate-900 dark:text-white">
                    <SelectValue placeholder="Sort Order" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-800">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="a-z">Name (A-Z)</SelectItem>
                    <SelectItem value="z-a">Name (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-[2rem] bg-white border border-slate-100 animate-pulse" />)}
          </div>
        ) : filteredAssignments && filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredAssignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                    className="group border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-600/40 rounded-[2rem] transition-all hover:shadow-2xl hover:shadow-blue-600/5 overflow-hidden shadow-sm dark:shadow-none"
                >
                    <CardContent className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                          <div className="h-16 w-16 rounded-[1.25rem] bg-gray-50 dark:bg-slate-900/40 flex items-center justify-center border-2 border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform group-hover:bg-blue-50 group-hover:border-blue-100">
                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                  {assignment.lesson?.title || assignment.lessonTitle}
                                </h4>
                                <Badge className={assignment.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}>
                                    {assignment.status.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-2">
                              <div className="flex items-center text-sm text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                                {assignment.classroomId ? <School className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-500" /> : <Users className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-500" />}
                                {assignment.classroom?.name || `${assignment.student?.firstName} ${assignment.student?.lastName}` || 'Classroom Selection'}
                              </div>
                              <div className="flex items-center text-sm text-slate-400 dark:text-gray-500 font-medium">
                                <Calendar className="h-4 w-4 mr-2" />
                                {format(new Date(assignment.assignedAt), "MMM dd, yyyy")}
                              </div>
                              {assignment.dueDate && (
                                <div className={`flex items-center text-sm font-bold uppercase tracking-tight ${new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed' ? 'text-red-500' : 'text-slate-400 dark:text-gray-500'}`}>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Due: {format(new Date(assignment.dueDate), "MMM dd")}
                                </div>
                              )}
                              {(assignment as any).maxAttempts > 0 && (
                                <div className="flex items-center text-sm font-bold uppercase tracking-tight text-blue-500/60">
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Limit: {(assignment as any).maxAttempts} Attempts
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10">
                          <div className="text-right flex flex-col items-end">
                            <p className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] font-black mb-2">Completion</p>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(parseFloat(assignment.progress || "0"))}%</span>
                                <div className="w-32 h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-50 dark:border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${assignment.progress}%` }}
                                        className={`h-full rounded-full ${assignment.progress === '100' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.3)]'}`}
                                    />
                                </div>
                            </div>
                          </div>
                          
                          <div className="h-12 w-[2px] bg-gray-100 dark:bg-white/5 hidden lg:block"></div>
                          
                          <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`rounded-2xl h-10 w-10 border border-transparent transition-all ${assignment.feedback ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`}
                                onClick={() => setFeedbackDialog({
                                  open: true,
                                  assignmentId: assignment.id,
                                  currentFeedback: assignment.feedback || ""
                                })}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl h-10 w-10 border border-transparent hover:border-emerald-100 transition-all"
                                onClick={() => navigate(`/teacher/assignments/${assignment.id}/edit`)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl h-10 w-10 border border-transparent hover:border-red-100 transition-all"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this assignment?")) {
                                    deleteMutation.mutate(assignment.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                          </div>
                        </div>
                    </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-all">
            <div className="bg-gray-50 dark:bg-white/5 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/10 shadow-sm">
                <FileText className="h-12 w-12 text-slate-300 dark:text-gray-700" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">No Active Assignments</h3>
            <p className="text-slate-500 dark:text-gray-500 max-w-sm mx-auto mb-10 font-medium text-lg">
              Lessons must be distributed to students before goals can be achieved.
            </p>
            <Link href="/teacher/assignments/create">
                <Button 
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] h-16 px-12 font-black text-lg shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
                >
                  DEPLOY FIRST ASSIGNMENT
                </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Neural Critique</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-gray-400 font-medium">Provide tactical feedback for this assignment attempt.</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Textarea 
              placeholder="Write your feedback here..."
              className="min-h-[150px] bg-gray-50 dark:bg-white/5 border-slate-100 dark:border-white/10 rounded-2xl font-medium focus:ring-blue-600 text-slate-900 dark:text-white"
              value={feedbackDialog.currentFeedback}
              onChange={(e) => setFeedbackDialog(prev => ({ ...prev, currentFeedback: e.target.value }))}
            />
          </div>
          <DialogFooter className="gap-3">
             <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-xs h-12 px-6" onClick={() => setFeedbackDialog(prev => ({ ...prev, open: false }))}>
               Cancel
             </Button>
             <Button 
               className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs h-12 px-8 shadow-lg shadow-blue-600/20"
               onClick={() => feedbackMutation.mutate({ id: feedbackDialog.assignmentId, feedback: feedbackDialog.currentFeedback })}
               disabled={feedbackMutation.isPending}
             >
               {feedbackMutation.isPending ? "Transmitting..." : "Send Feedback"}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}