import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Eraser
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";

interface Assignment {
  id: string;
  lessonId: string;
  studentId?: string;
  classroomId?: string;
  dueDate: string;
  status: string;
  progress: string;
  allowBackspace: boolean;
  lesson?: { title: string };
  student?: { firstName: string, lastName: string };
  classroom?: { name: string };
  assignedAt: string;
}

export default function Assignments() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newAssignment, setNewAssignment] = useState({
    lessonId: "",
    targetType: "student" as "student" | "classroom",
    targetId: "",
    dueDate: "",
    allowBackspace: true
  });

  const { data: assignments, isLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/teacher"],
    retry: false,
  });

  const { data: lessons } = useQuery<any[]>({
    queryKey: ["/api/lessons"],
  });

  const { data: students } = useQuery<any[]>({
    queryKey: ["/api/teacher/students"],
  });

  const { data: classrooms } = useQuery<any[]>({
    queryKey: ["/api/classrooms"],
  });

  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        lessonId: data.lessonId,
        teacherId: user?.id,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        allowBackspace: data.allowBackspace,
        [data.targetType === "student" ? "studentId" : "classroomId"]: data.targetId
      };

      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to assign lesson");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      setIsAssignOpen(false);
      setNewAssignment({
        lessonId: "",
        targetType: "student",
        targetId: "",
        dueDate: "",
        allowBackspace: true
      });
      toast({ title: "Lesson Assigned", description: "Successfully distributed the assignment." });
    },
    onError: (error: Error) => {
      toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    }
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

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const filteredAssignments = assignments?.filter(a => 
    a.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.classroom?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center">
              <FileText className="mr-4 h-8 w-8 text-indigo-500" />
              Assignments
            </h2>
            <p className="text-gray-400">Distribute lessons to students or entire classrooms.</p>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-indigo-500 transition-colors" />
              <Input 
                placeholder="Filter assignments..." 
                className="pl-10 w-full md:w-64 bg-white/5 border-white/10 text-white rounded-xl focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-6 h-11 shadow-lg shadow-indigo-500/20">
                  <Plus className="mr-2 h-5 w-5" />
                  Assign Lesson
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1e293b] border-white/10 text-white rounded-[2rem] max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">New Assignment</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Set the parameters for this typing challenge.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-6">
                  <div className="space-y-2">
                    <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">Select Lesson</Label>
                    <Select
                      onValueChange={(val) => setNewAssignment({...newAssignment, lessonId: val})}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                        <SelectValue placeholder="Choose a lesson" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
                        {lessons?.map(l => (
                          <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">Target Type</Label>
                      <Select
                        defaultValue="student"
                        onValueChange={(val: any) => setNewAssignment({...newAssignment, targetType: val, targetId: ""})}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="classroom">Classroom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">Target Selection</Label>
                      <Select
                        onValueChange={(val) => setNewAssignment({...newAssignment, targetId: val})}
                        disabled={!newAssignment.targetType}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 h-12 rounded-xl">
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white rounded-xl">
                          {newAssignment.targetType === "student" ? (
                            students?.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)
                          ) : (
                            classrooms?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">Due Date</Label>
                      <Input 
                        type="date" 
                        className="bg-white/5 border-white/10 h-12 rounded-xl"
                        onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      />
                    </div>

                    <div className="flex flex-col justify-center space-y-2">
                       <div className="flex items-center justify-between">
                          <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-gray-500">Allow Backspace</Label>
                          <Switch 
                            checked={newAssignment.allowBackspace}
                            onCheckedChange={(val) => setNewAssignment({...newAssignment, allowBackspace: val})}
                          />
                       </div>
                       <p className="text-[10px] text-gray-500 italic">Disabling backspace creates a high-pressure mode.</p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAssignOpen(false)} className="rounded-xl h-12 text-gray-400 hover:text-white hover:bg-white/5">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => assignMutation.mutate(newAssignment)}
                    disabled={assignMutation.isPending || !newAssignment.lessonId || !newAssignment.targetId}
                    className="bg-indigo-600 hover:bg-indigo-500 rounded-xl h-12 px-8 font-bold"
                  >
                    {assignMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Deploy Assignment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        ) : filteredAssignments && filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map((assignment) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white/5 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between transition-all hover:bg-white/[0.07]"
              >
                <div className="flex items-center space-x-6">
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <FileText className="h-7 w-7 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                      {assignment.lesson?.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 mt-1">
                      <div className="flex items-center text-xs text-indigo-400 font-black uppercase tracking-widest">
                        {assignment.classroomId ? <School className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
                        {assignment.classroom?.name || `${assignment.student?.firstName} ${assignment.student?.lastName}`}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                      </div>
                      {assignment.dueDate && (
                        <div className={`flex items-center text-xs ${new Date(assignment.dueDate) < new Date() ? 'text-red-400 font-bold' : 'text-gray-500'}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {!assignment.allowBackspace && (
                        <div className="flex items-center text-xs text-orange-400 font-bold uppercase tracking-tighter">
                          <Eraser className="h-3 w-3 mr-1" /> NO BACKSPACE
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-6 md:mt-0">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Status</p>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight border ${
                      assignment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      assignment.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                      'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {assignment.status}
                    </div>
                  </div>
                  
                  <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this assignment?")) {
                        deleteMutation.mutate(assignment.id);
                      }
                    }}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
            <FileText className="h-20 w-20 text-gray-700 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">No Active Assignments</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">
              Lessons must be distributed to students before goals can be achieved.
            </p>
            <Button 
              onClick={() => setIsAssignOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 px-10 font-bold"
            >
              DEPLOY FIRST ASSIGNMENT
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}