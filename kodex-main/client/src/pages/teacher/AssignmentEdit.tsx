import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  Users,
  Calendar,
  Settings2,
  FileText,
  Loader2,
  Clock,
  Trash2,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AssignmentEdit() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [details, setDetails] = useState({
    title: "",
    description: "",
    difficulty: "beginner",
    timeLimit: 120,
    content: "",
    dueDate: "",
    dueTime: "23:59",
    status: "pending",
    allowBackspace: true,
    maxAttempts: "unlimited",
    feedback: ""
  });
  
  const [selectedClassroom, setSelectedClassroom] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [initialStudents, setInitialStudents] = useState<string[]>([]);
  const [siblingAssignments, setSiblingAssignments] = useState<any[]>([]);

  const { data: assignment, isLoading } = useQuery<any>({ 
    queryKey: [`/api/assignments/${id}`],
    enabled: !!id
  });

  const { data: allAssignments } = useQuery<any[]>({
    queryKey: ["/api/assignments/teacher"],
    enabled: !!assignment?.lessonId
  });

  const { data: students } = useQuery<any[]>({ 
    queryKey: [`/api/classrooms/${selectedClassroom}/students`],
    enabled: !!selectedClassroom 
  });

  useEffect(() => {
    if (assignment) {
      const d = assignment.dueDate ? new Date(assignment.dueDate) : null;
      setDetails({
        title: assignment.lesson?.title || "",
        description: assignment.lesson?.description || "",
        difficulty: assignment.lesson?.difficulty || "beginner",
        timeLimit: assignment.lesson?.timeLimit || 120,
        content: assignment.lesson?.content || "",
        dueDate: d ? d.toISOString().split('T')[0] : "",
        dueTime: d ? `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` : "23:59",
        status: assignment.status || "pending",
        allowBackspace: assignment.allowBackspace ?? true,
        maxAttempts: assignment.lesson?.maxAttempts === 0 ? "unlimited" : (assignment.lesson?.maxAttempts?.toString() || "unlimited"),
        feedback: assignment.feedback || ""
      });
      setSelectedClassroom(assignment.classroomId || null);
    }
  }, [assignment]);

  useEffect(() => {
    if (allAssignments && assignment) {
      // Find all sibling assignments that share this lessonId and classroomId
      const siblings = allAssignments.filter(a => a.lessonId === assignment.lessonId && a.classroomId === assignment.classroomId);
      setSiblingAssignments(siblings);
      
      const currentStudentIds = siblings.map(s => s.studentId).filter(Boolean);
      // Pre-select students who already have this assignment
      setSelectedStudents(currentStudentIds);
      setInitialStudents(currentStudentIds);
    }
  }, [allAssignments, assignment]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      // 1. Update the associated Lesson via PATCH
      if (assignment.lessonId) {
        const lessonRes = await fetch(`/api/lessons/${assignment.lessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload.title,
            description: payload.description,
            difficulty: payload.difficulty,
            timeLimit: payload.timeLimit,
            content: payload.content,
            maxAttempts: payload.maxAttempts === "unlimited" ? 0 : parseInt(payload.maxAttempts),
            allowBackspace: payload.allowBackspace
          }),
        });
        if (!lessonRes.ok) throw new Error("Failed to update lesson details");
      }

      // 2. Update the assignment specific details
      const assignRes = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: payload.dueDate,
          status: payload.status,
          allowBackspace: payload.allowBackspace,
          feedback: payload.feedback
        }),
      });
      if (!assignRes.ok) throw new Error("Failed to update assignment settings");
      
      // 3. Create assignments for any newly selected students
      const newStudents = payload.selectedStudents.filter((sid: string) => !payload.initialStudents.includes(sid));
      for (const studentId of newStudents) {
         await fetch("/api/assignments", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
              lessonId: assignment.lessonId,
              studentId,
              classroomId: assignment.classroomId || null,
              dueDate: payload.dueDate,
              status: "pending",
              allowBackspace: payload.allowBackspace,
              feedback: payload.feedback
           }),
         });
      }
      
      // 4. Delete assignments for any unselected students
      const unselectedStudents = payload.initialStudents.filter((sid: string) => !payload.selectedStudents.includes(sid));
      for (const studentId of unselectedStudents) {
          // Find the assignment ID that corresponds to this student
          const targetSibling = siblingAssignments.find(s => s.studentId === studentId);
          if (targetSibling) {
              await fetch(`/api/assignments/${targetSibling.id}`, { method: "DELETE" });
          }
      }

      return await assignRes.json();
    },
    onSuccess: () => {
      toast({ title: "Assignment Updated", description: "All changes have been successfully saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      navigate("/teacher/assignments");
    },
    onError: (err: any) => {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.title || !details.content) {
        toast({ title: "Missing Fields", description: "Title and content are required.", variant: "destructive" });
        return;
    }

    updateMutation.mutate({
      title: details.title,
      description: details.description,
      difficulty: details.difficulty,
      timeLimit: details.timeLimit,
      content: details.content,
      maxAttempts: details.maxAttempts,
      dueDate: (details.dueDate && details.dueTime) 
          ? new Date(`${details.dueDate}T${details.dueTime}`).toISOString() 
          : null,
      status: details.status,
      allowBackspace: details.allowBackspace,
      feedback: details.feedback,
      selectedStudents,
      initialStudents
    });
  };

  if (!isAuthenticated || user?.role !== "teacher") return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col items-center justify-center text-slate-900 dark:text-white">
        <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">Assignment Not Found</h2>
        <Button onClick={() => navigate("/teacher/assignments")} className="bg-blue-600 hover:bg-blue-500 rounded-xl text-white px-8">Return to Assignments</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/20 transition-colors">
      <Header />
      
      <main className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col xl:flex-row gap-10">
        <div className="flex-1 space-y-10">
          <div>
            <Button 
                variant="ghost" 
                onClick={() => navigate("/teacher/assignments")}
                className="mb-6 text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold -ml-2 rounded-xl group"
            >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Assignments
            </Button>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 uppercase italic">Edit Assignment Details</h2>
            <p className="text-slate-500 dark:text-gray-400 font-semibold text-base">Modify lesson parameters, update targeting, and configure settings.</p>
          </div>

          {/* Assignment Details */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
             <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                 <CardTitle className="text-xl font-black flex items-center gap-3 uppercase italic tracking-tighter">
                     <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                     Assignment Details
                 </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Title *</Label>
                        <Input 
                          value={details.title}
                          onChange={(e) => setDetails({...details, title: e.target.value})}
                          placeholder="Assignment Title" 
                          className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 focus:ring-blue-500/20 font-bold text-slate-900 dark:text-white" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Description</Label>
                        <Textarea 
                          value={details.description}
                          onChange={(e) => setDetails({...details, description: e.target.value})}
                          placeholder="Assignment Description" 
                          className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-blue-500/20 font-bold min-h-[100px] text-slate-900 dark:text-white" 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Difficulty</Label>
                            <Select value={details.difficulty} onValueChange={(val) => setDetails({...details, difficulty: val})}>
                                <SelectTrigger className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold text-slate-900 dark:text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10">
                                    <SelectItem value="beginner" className="font-bold">Beginner</SelectItem>
                                    <SelectItem value="intermediate" className="font-bold">Intermediate</SelectItem>
                                    <SelectItem value="advanced" className="font-bold">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Typing Time Limit</Label>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 5, 10, 15, 20].map(m => (
                                    <Button 
                                      key={m} 
                                      variant={details.timeLimit === m * 60 ? "default" : "outline"} 
                                      onClick={() => setDetails({...details, timeLimit: m * 60})}
                                      className={`h-12 w-12 rounded-xl text-sm font-black transition-all ${details.timeLimit === m * 60 ? 'bg-blue-600 shadow-lg shadow-blue-600/30 border-blue-600 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'}`}
                                    >
                                      {m}m
                                    </Button>
                                ))}
                                <div className="flex-1 min-w-[120px] flex gap-2">
                                    <Input 
                                      type="number" 
                                      placeholder="Custom" 
                                      className="h-12 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white" 
                                      value={details.timeLimit ? details.timeLimit / 60 : ''}
                                      onChange={(e) => setDetails({...details, timeLimit: parseInt(e.target.value) * 60 || 0})}
                                    />
                                    <Select defaultValue="minutes">
                                        <SelectTrigger className="h-12 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl font-bold w-28 text-slate-900 dark:text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10">
                                            <SelectItem value="minutes">Minutes</SelectItem>
                                            <SelectItem value="seconds">Seconds</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
                               <Clock className="w-4 h-4" />
                               <span className="text-xs font-black uppercase tracking-tighter">{details.timeLimit / 60} Minutes</span>
                               <span className="text-[10px] font-bold opacity-80 flex-1">Typing timer session limit</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Content * (Exercise Text)</Label>
                        <Textarea 
                          value={details.content}
                          onChange={(e) => setDetails({...details, content: e.target.value})}
                          placeholder="Enter the typing exercise text..." 
                          className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-3xl px-8 py-8 focus:ring-blue-500/20 font-medium min-h-[160px] text-lg leading-relaxed font-sans text-slate-900 dark:text-white" 
                        />
                    </div>
                </div>
             </CardContent>
          </Card>

          {/* Select Students Component */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
            <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-3 uppercase italic tracking-tighter">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Target Selection {selectedStudents.length > 0 && `(${selectedStudents.length} Students)`}
                </CardTitle>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5">
                    <Checkbox 
                      id="selectAll" 
                      checked={selectAll} 
                      onCheckedChange={(val) => {
                        setSelectAll(!!val);
                        if(val) setSelectedStudents(students?.map((s: any) => s.id) || []);
                        else setSelectedStudents([]);
                    }} />
                    <Label htmlFor="selectAll" className="text-xs font-black uppercase tracking-widest cursor-pointer text-slate-600 dark:text-gray-400">Select All</Label>
                </div>
            </CardHeader>
            <CardContent className="p-8">
              {!selectedClassroom ? (
                <div className="text-center py-10 text-gray-400 italic font-bold">This assignment was globally assigned or lacks a specific classroom context.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students?.map((s: any) => (
                    <div 
                      key={s.id} 
                      className={`flex items-center gap-4 p-5 border-2 rounded-2xl transition-all cursor-pointer ${selectedStudents.includes(s.id) ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-500/10' : 'border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/5'}`}
                      onClick={() => {
                          const isSelected = selectedStudents.includes(s.id);
                          if(isSelected) setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                          else setSelectedStudents([...selectedStudents, s.id]);
                      }}
                    >
                        <Checkbox 
                            id={`s-${s.id}`} 
                            checked={selectedStudents.includes(s.id)}
                            onCheckedChange={() => {}} // Handled by div click
                        />
                        <div className="h-10 w-10 min-w-[40px] rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-sm">
                            {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-black text-sm text-slate-900 dark:text-white truncate">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">{s.email}</p>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Assignment Settings */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
            <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                <CardTitle className="text-xl font-black flex items-center gap-3 uppercase italic tracking-tighter">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Assignment Window
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                    <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Due Date & Time (Optional)</Label>
                    <div className="flex gap-4 max-w-md">
                        <Input 
                            type="date" 
                            value={details.dueDate}
                            onChange={(e) => setDetails({...details, dueDate: e.target.value})}
                            className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold flex-1 text-slate-900 dark:text-white" 
                        />
                        <Input 
                            type="time" 
                            value={details.dueTime}
                            onChange={(e) => setDetails({...details, dueTime: e.target.value})}
                            className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold w-40 text-slate-900 dark:text-white" 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Attempts Capacity</Label>
                    <Select value={details.maxAttempts} onValueChange={(val) => setDetails({...details, maxAttempts: val})}>
                        <SelectTrigger className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold max-w-md text-slate-900 dark:text-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10">
                            <SelectItem value="unlimited" className="font-bold">Unlimited Attempts</SelectItem>
                            {[1, 2, 3, 4, 5, 10].map(n => (
                                <SelectItem key={n} value={n.toString()} className="font-bold">{n} Max {n === 1 ? 'Attempt' : 'Attempts'}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 dark:border-white/5 pt-8 mt-8">
                    <div className="space-y-3">
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Current Status</Label>
                        <Select value={details.status} onValueChange={(val) => setDetails({...details, status: val})}>
                            <SelectTrigger className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold text-slate-900 dark:text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10">
                                <SelectItem value="pending" className="font-bold">Pending Approval</SelectItem>
                                <SelectItem value="in_progress" className="font-bold">Active Deployment</SelectItem>
                                <SelectItem value="completed" className="font-bold">Finalized</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1">Backspace Access</Label>
                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 h-14 rounded-2xl border border-gray-100 dark:border-white/5">
                            <Button
                                variant={details.allowBackspace ? "default" : "outline"}
                                onClick={(e) => { e.preventDefault(); setDetails({ ...details, allowBackspace: !details.allowBackspace })}}
                                className={`flex-1 h-full rounded-xl transition-all font-black uppercase text-[10px] tracking-widest ${details.allowBackspace ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500"}`}
                            >
                                {details.allowBackspace ? "Active" : "Locked"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    <Label className="font-black text-xs uppercase tracking-widest text-gray-400 ml-1 flex items-center gap-2">
                       <MessageSquare className="w-4 h-4" /> Instructor Observation
                    </Label>
                    <Textarea 
                        value={details.feedback}
                        onChange={(e) => setDetails({...details, feedback: e.target.value})}
                        placeholder="Leave feedback on student performance..." 
                        className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-blue-500/20 font-bold min-h-[120px] text-slate-900 dark:text-white" 
                    />
                </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {updateMutation.isPending && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-center py-6"
                >
                    <div className="flex items-center gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-slate-900 dark:text-white">Applying Edits...</span>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Synchronizing records</span>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-6 pb-20 xl:hidden">
              <Button 
                size="lg"
                className="h-16 px-12 font-black text-lg bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-white disabled:opacity-50" 
                onClick={handleSubmit}
                disabled={updateMutation.isPending || !details.title || !details.content}
             >
                Save All Changes
             </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[360px] space-y-8 hidden xl:block">
           <Card className="border-gray-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-[2.5rem] bg-white dark:bg-[#1e293b] sticky top-12 overflow-hidden border-2 dark:border-blue-500/30">
             <CardHeader className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 p-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Edit Preview</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            {details.title || 'Assignment Title'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-black text-[10px] uppercase tracking-tighter italic">{details.difficulty}</Badge>
                            <Badge variant="outline" className="border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                {Math.round(details.timeLimit / 60)} MIN
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-white/5 pb-3">
                            <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Active Targets</span>
                            <span className="font-black text-blue-600 dark:text-blue-400">{selectedClassroom ? selectedStudents.length : 1}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-white/5 pb-3">
                            <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Deadline</span>
                            <span className="font-black text-slate-800 dark:text-gray-200">{details.dueDate ? format(new Date(details.dueDate), 'MMMM d, yyyy') : 'No Limit'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-gray-100 dark:border-white/5 pb-3">
                            <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Attempt Limit</span>
                            <span className="font-black uppercase text-slate-800 dark:text-gray-200">{details.maxAttempts}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Deploy State</span>
                            <span className="font-black uppercase text-[10px] tracking-widest text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg">{details.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 dark:bg-blue-600 p-8 text-white">
                    <Button 
                        className="w-full h-14 bg-white text-blue-600 hover:bg-gray-100 font-black rounded-2xl text-base shadow-xl active:scale-95 transition-all shadow-white/10"
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending || !details.title || !details.content}
                    >
                        Save All Changes
                    </Button>
                </div>
             </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
