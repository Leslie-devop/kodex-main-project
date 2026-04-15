import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  FileText,
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  Settings2,
  User,
  Trash2,
  Trophy,
  Activity,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AssignmentCreate() {
  const { user, isAuthenticated } = useAuth();
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const queryClassroomId = searchParams.get('classroom') || "";
  const queryLessonId = searchParams.get('lesson') || "";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [assignmentType, setAssignmentType] = useState<"lesson" | "standalone">("lesson");
  const [selectedClassroom, setSelectedClassroom] = useState(queryClassroomId);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const [details, setDetails] = useState({
    title: "Assignment 1",
    description: "Keyboarding",
    difficulty: "beginner",
    timeLimit: 120, // in seconds (2m)
    content: "Life is full of unexpected moments that shape who we become. From small daily routines to major life-changing events, each experience adds a layer to our personal growth...",
    dueDate: "",
    dueTime: "23:59",
    lessonId: queryLessonId,
    maxAttempts: "unlimited",
    allowBackspace: true
  });

  // Track the previous classroom to notice changes
  const [prevClassroom, setPrevClassroom] = useState(queryClassroomId);

  const { data: classrooms } = useQuery<any[]>({ queryKey: ["/api/classrooms"] });
  const { data: lessons } = useQuery<any[]>({ queryKey: ["/api/lessons"] });
  
  // Clear students when classroom changes
  if (selectedClassroom !== prevClassroom) {
    setPrevClassroom(selectedClassroom);
    setSelectedStudents([]);
    setSelectAll(false);
  }

  const { data: students } = useQuery<any[]>({ 
    queryKey: [`/api/classrooms/${selectedClassroom}/students`],
    enabled: !!selectedClassroom && selectedClassroom !== "none"
  });

  const selectedLessonObj = useMemo(() => {
    if (assignmentType === "lesson") {
      return lessons?.find(l => l.id === details.lessonId);
    }
    return null;
  }, [details.lessonId, lessons, assignmentType]);

  const createAssignmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to create assignment");
      }
      return res.json();
    },
    onSuccess: () => {
      // success handled in handleSubmit loop
    }
  });

  // Standalone lesson creation
  const createLessonMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to create standalone lesson");
      }
      return res.json();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassroom) {
        toast({ title: "Missing", description: "Please select a classroom." });
        return;
    }

    if (selectedStudents.length === 0) {
        toast({ title: "No Students Selected", description: "You must select at least one student to deploy this assignment.", variant: "destructive" });
        return;
    }

    let lessonId = details.lessonId;

    if (assignmentType === "standalone") {
        if (selectedStudents.length === 0) {
            toast({ title: "No Students Selected", description: "You must select at least one student to deploy this assignment.", variant: "destructive" });
            return;
        }

        if (!details.title || !details.content) {
            toast({ title: "Missing Fields", description: "Standalone title and content are required." });
            return;
        }

        try {
            const newLesson = await createLessonMutation.mutateAsync({
                title: details.title,
                description: details.description,
                content: details.content,
                difficulty: details.difficulty,
                estimatedTime: Math.max(1, Math.round(details.timeLimit / 60)),
                timeLimit: details.timeLimit,
                maxAttempts: details.maxAttempts === "unlimited" ? 0 : parseInt(details.maxAttempts),
                isPublic: false,
                isStandalone: true,
                allowBackspace: !details.allowBackspace, // Restriction ACTIVE means allowBackspace is FALSE
                createdBy: user?.id,
                classroomId: selectedClassroom === "none" ? null : selectedClassroom
            });
            lessonId = newLesson.id;
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to create lesson for standalone assignment.", variant: "destructive" });
            return;
        }
    } else {
        if (!lessonId) {
            toast({ title: "Missing", description: "Please select a lesson." });
            return;
        }
    }

    if (selectedStudents.length === 0) {
        toast({ 
            title: "No Students Selected", 
            description: "You must select at least one student to deploy this assignment.", 
            variant: "destructive" 
        });
        return;
    }



    // Deploy to each student
    try {
        for (const studentId of selectedStudents) {
            await createAssignmentMutation.mutateAsync({
                lessonId,
                studentId,
                classroomId: (!selectedClassroom || selectedClassroom === "none") ? null : selectedClassroom,
                dueDate: (details.dueDate && details.dueTime) 
                    ? new Date(`${details.dueDate}T${details.dueTime}`).toISOString() 
                    : null,
                teacherId: user?.id,
                status: "pending",
                allowBackspace: !details.allowBackspace, // Restriction ACTIVE means allowBackspace is FALSE
                maxAttempts: details.maxAttempts === "unlimited" ? 0 : parseInt(details.maxAttempts),
                timeLimit: details.timeLimit
            });
        }

        toast({ title: "Assignments Created", description: `Successfully assigned to ${selectedStudents.length} students.` });
        
        queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
        queryClient.invalidateQueries({ queryKey: ["/api/assignments/student"] });
        queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
        if (selectedClassroom && selectedClassroom !== "none") {
            queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${selectedClassroom}/assignments`] });
        }
        
        navigate("/teacher/assignments");
    } catch (err: any) {
        toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
    }
  };

  if (!isAuthenticated || user?.role !== "teacher") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors selection:bg-blue-500/20">
      <Header />
      
      <main className="max-w-[1400px] mx-auto px-6 py-12 flex gap-10">
        <div className="flex-1 space-y-10">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Create New Assignment</h2>
            <p className="text-slate-500 dark:text-gray-400 font-semibold text-base">Create an assignment from a lesson or create a standalone assignment.</p>
          </div>

          {/* Assignment Type */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
            <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Assignment Type</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <RadioGroup value={assignmentType} onValueChange={(val: any) => setAssignmentType(val)} className="grid grid-cols-1 gap-4">
                <div 
                  className={`flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${assignmentType === 'lesson' ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10'}`}
                  onClick={() => setAssignmentType('lesson')}
                >
                  <div className={`p-4 rounded-xl mr-6 ${assignmentType === 'lesson' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-gray-200 dark:border-white/10'}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-lg text-slate-900 dark:text-white">From Lesson</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Choose from your existing lesson library</p>
                  </div>
                  <RadioGroupItem value="lesson" className="h-6 w-6 border-2" />
                </div>

                <div 
                  className={`flex items-center p-6 border-2 rounded-2xl cursor-pointer transition-all ${assignmentType === 'standalone' ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10'}`}
                  onClick={() => setAssignmentType('standalone')}
                >
                  <div className={`p-4 rounded-xl mr-6 ${assignmentType === 'standalone' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-gray-200 dark:border-white/10'}`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-lg text-slate-900 dark:text-white">Standalone Assignment</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Type your exercise content manually</p>
                  </div>
                  <RadioGroupItem value="standalone" className="h-6 w-6 border-2" />
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Select Classroom */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
            <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                    <Users className="w-6 h-6 text-blue-600" />
                    Select Classroom
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {classrooms?.map(c => (
                    <div 
                        key={c.id} 
                        className={`p-6 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${selectedClassroom === c.id ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-500/10 shadow-md' : 'border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10'}`}
                        onClick={() => setSelectedClassroom(c.id)}
                    >
                        <div>
                            <p className="font-black text-xs uppercase tracking-widest text-blue-600 dark:text-blue-500 mb-1">{c.name}</p>
                            <p className="text-sm text-slate-500 dark:text-gray-400 font-bold">{c.section}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedClassroom === c.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'border-gray-200 dark:border-white/10 text-transparent'}`}>
                           <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>

          {/* Assignment Details OR Select Lesson */}
          {assignmentType === 'lesson' ? (
             <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
               <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                   <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                       <BookOpen className="w-6 h-6 text-blue-600" />
                       Select Lesson
                   </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                      {lessons?.filter(l => !l.isStandalone).map(l => (
                        <div 
                          key={l.id}
                          className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${details.lessonId === l.id ? 'border-blue-600 bg-blue-50/30 dark:bg-blue-500/10' : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 bg-gray-50/30 dark:bg-white/[0.02]'}`}
                          onClick={() => setDetails({...details, lessonId: l.id})}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h4 className="font-black text-lg text-slate-900 dark:text-white">{l.title}</h4>
                                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 font-black text-[10px] uppercase truncate">{l.difficulty}</Badge>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-gray-400 font-bold">Duration: {l.timeLimit ? Math.round(l.timeLimit / 60) : 0} minutes</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${details.lessonId === l.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'border-gray-200 dark:border-white/10 text-transparent'}`}>
                               <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                     ))}
                  </div>
               </CardContent>
             </Card>
          ) : (
             <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
                <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                    <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Assignment Details
                    </CardTitle>
                </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                       <div className="space-y-2">
                           <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Title *</Label>
                           <Input 
                             value={details.title}
                             onChange={(e) => setDetails({...details, title: e.target.value})}
                             placeholder="Assignment 1" 
                             className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 focus:ring-blue-500/20 font-bold text-slate-900 dark:text-white" 
                           />
                       </div>
                       <div className="space-y-2">
                           <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Description</Label>
                           <Textarea 
                             value={details.description}
                             onChange={(e) => setDetails({...details, description: e.target.value})}
                             placeholder="Keyboarding" 
                             className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 focus:ring-blue-500/20 font-bold min-h-[100px] text-slate-900 dark:text-white" 
                           />
                       </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                               <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Difficulty</Label>
                               <Select value={details.difficulty} onValueChange={(val) => setDetails({...details, difficulty: val})}>
                                   <SelectTrigger className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold text-slate-900 dark:text-white">
                                       <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-2xl dark:bg-[#1e1b21] dark:border-white/10">
                                       <SelectItem value="beginner" className="font-bold text-slate-900 dark:text-gray-300">Beginner</SelectItem>
                                       <SelectItem value="intermediate" className="font-bold text-slate-900 dark:text-gray-300">Intermediate</SelectItem>
                                       <SelectItem value="advanced" className="font-bold text-slate-900 dark:text-gray-300">Advanced</SelectItem>
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="space-y-3">
                               <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Typing Time Limit</Label>
                               <div className="flex gap-2 flex-wrap">
                                   {[1, 2, 5, 10, 15, 20].map(m => (
                                       <Button 
                                         key={m} 
                                         variant={details.timeLimit === m * 60 ? "default" : "outline"} 
                                         onClick={() => setDetails({...details, timeLimit: m * 60})}
                                         className={`h-12 w-12 rounded-xl text-sm font-black transition-all ${details.timeLimit === m * 60 ? 'bg-blue-600 shadow-lg shadow-blue-600/30 border-blue-600 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                                       >
                                         {m}m
                                       </Button>
                                   ))}
                                   <div className="flex-1 min-w-[120px] flex gap-2">
                                       <Input 
                                         type="number" 
                                         placeholder="Custom" 
                                         className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl font-bold text-slate-900 dark:text-white" 
                                         onChange={(e) => setDetails({...details, timeLimit: parseInt(e.target.value) * 60 || 0})}
                                       />
                                       <Select defaultValue="minutes">
                                           <SelectTrigger className="h-12 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl font-bold w-28 text-slate-900 dark:text-white">
                                               <SelectValue />
                                           </SelectTrigger>
                                           <SelectContent className="dark:bg-[#1e1b21] dark:border-white/10">
                                               <SelectItem value="minutes" className="text-slate-900 dark:text-gray-300">Minutes</SelectItem>
                                               <SelectItem value="seconds" className="text-slate-900 dark:text-gray-300">Seconds</SelectItem>
                                           </SelectContent>
                                       </Select>
                                   </div>
                               </div>
                               <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-xs font-black uppercase tracking-tighter">{details.timeLimit / 60} Minutes</span>
                                  <span className="text-[10px] font-bold opacity-80 flex-1">This sets the typing timer for the session.</span>
                               </div>
                           </div>
                      </div>

                      <div className="space-y-2">
                           <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Content * (Sans-Serif Font)</Label>
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
          )}

          {/* Select Students */}
          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
            <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                    <Users className="w-6 h-6 text-blue-600" />
                    Select Students {selectedStudents.length > 0 && `(${selectedStudents.length} selected)`}
                </CardTitle>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5">
                    <Checkbox 
                      id="selectAll" 
                      checked={selectAll} 
                      onCheckedChange={(val) => {
                        setSelectAll(!!val);
                        if(val) setSelectedStudents(students?.map(s => s.id) || []);
                        else setSelectedStudents([]);
                    }} />
                    <Label htmlFor="selectAll" className="text-xs font-black uppercase tracking-widest cursor-pointer text-slate-900 dark:text-white">Select All</Label>
                </div>
            </CardHeader>
            <CardContent className="p-8">
              {!selectedClassroom ? (
                <div className="text-center py-20 text-slate-400 dark:text-gray-500 italic font-bold">Please select a classroom first to view student roster.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {students?.map(s => (
                    <div 
                      key={s.id} 
                      className={`flex items-center gap-4 p-5 border-2 rounded-2xl transition-all cursor-pointer ${selectedStudents.includes(s.id) ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-500/10' : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10'}`}
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
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-black text-slate-500 dark:text-gray-400 text-sm">
                            {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-sm text-slate-900 dark:text-white">{s.firstName} {s.lastName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">{s.email}</p>
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
                 <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                     <Calendar className="w-6 h-6 text-blue-600" />
                     Assignment Settings
                 </CardTitle>
             </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                     <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Due Date & Time (Optional)</Label>
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
                     <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold">Leave blank for no due date</p>
                 </div>

                <div className="space-y-3">
                     <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Maximum Attempts</Label>
                     <Select value={details.maxAttempts} onValueChange={(val) => setDetails({...details, maxAttempts: val})}>
                         <SelectTrigger className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 font-bold max-w-md text-slate-900 dark:text-white">
                             <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl dark:bg-[#1e1b21] dark:border-white/10">
                             <SelectItem value="unlimited" className="font-bold text-slate-900 dark:text-gray-300">Unlimited</SelectItem>
                             {[1, 2, 3, 4, 5, 10].map(n => (
                                 <SelectItem key={n} value={n.toString()} className="font-bold text-slate-900 dark:text-gray-300">{n} {n === 1 ? 'attempt' : 'attempts'}</SelectItem>
                             ))}
                         </SelectContent>
                     </Select>
                     <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold italic">0 = unlimited attempts, 1+ = maximum number of times student can attempt</p>
                 </div>

                <div className="space-y-3">
                    <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Backspace Restriction</Label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-3 h-14 rounded-2xl border border-slate-100 dark:border-white/5">
                        <Button
                            variant={details.allowBackspace ? "default" : "outline"}
                            onClick={(e) => { e.preventDefault(); setDetails({ ...details, allowBackspace: !details.allowBackspace })}}
                            className={`flex-1 h-full rounded-xl transition-all font-black uppercase text-[10px] tracking-widest ${details.allowBackspace ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500"}`}
                        >
                            {details.allowBackspace ? "RESTRICTION: ACTIVE" : "RESTRICTION: OFF"}
                        </Button>
                    </div>
                </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {(createAssignmentMutation.isPending || createLessonMutation.isPending) && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-center py-6"
                >
                    <div className="flex items-center gap-4 bg-white dark:bg-[#1e293b] p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-slate-900 dark:text-white">
                                {createLessonMutation.isPending ? "Constructing Lesson..." : "Deploying Objective..."}
                            </span>
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Synchronizing neural networks</span>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-6 pb-20">
              <Button variant="ghost" className="h-16 px-10 font-bold text-slate-500 dark:text-gray-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5" onClick={() => navigate(selectedClassroom ? `/teacher/classrooms/${selectedClassroom}` : "/teacher/classrooms")}>Cancel</Button>
              <Button 
                size="lg"
                className="h-16 px-12 font-black text-lg bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-white disabled:opacity-50" 
                onClick={handleSubmit}
                disabled={
                    createAssignmentMutation.isPending || 
                    createLessonMutation.isPending || 
                    (assignmentType === 'lesson' && !details.lessonId) || 
                    (assignmentType === 'standalone' && (!details.title || !details.content)) || 
                    selectedStudents.length === 0
                }
             >
                Deploy Assignment for {selectedStudents.length} {selectedStudents.length === 1 ? 'Student' : 'Students'}
             </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[360px] space-y-8 hidden xl:block">
           <Card className="border-gray-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-[2.5rem] bg-white dark:bg-white/5 sticky top-12 overflow-hidden border-2">
             <CardHeader className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 p-8">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Assignment Preview</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">
                            {assignmentType === 'lesson' ? (selectedLessonObj?.title || 'No Lesson Selected') : (details.title || 'Assignment 1')}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 font-bold text-[10px] uppercase">{details.difficulty}</Badge>
                            <Badge variant="outline" className="border-gray-200 dark:border-white/10 text-slate-500 dark:text-gray-400 font-bold text-[10px] uppercase">
                                {assignmentType === 'lesson' ? (selectedLessonObj?.timeLimit ? Math.round(selectedLessonObj.timeLimit / 60) : 0) : Math.round(details.timeLimit / 60)} MIN
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Students</span>
                            <span className="font-black text-blue-600 dark:text-blue-400">{selectedStudents.length}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Due Date</span>
                            <span className="font-black text-slate-700 dark:text-gray-300">{details.dueDate ? format(new Date(details.dueDate), 'MM/dd/yyyy') : 'Unscheduled'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Max Attempts</span>
                            <span className="font-black uppercase text-slate-700 dark:text-gray-300">{details.maxAttempts}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Type</span>
                            <span className="font-black uppercase text-xs text-slate-700 dark:text-gray-300">{assignmentType === 'lesson' ? 'Lesson-based' : 'Standalone'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 p-8 text-white">
                    <Button 
                        className="w-full h-14 bg-white text-blue-600 hover:bg-blue-50 font-black rounded-2xl text-base shadow-xl active:scale-95 transition-all shadow-white/10"
                        onClick={handleSubmit}
                        disabled={
                            createAssignmentMutation.isPending || 
                            createLessonMutation.isPending || 
                            (assignmentType === 'lesson' && !details.lessonId) || 
                            (assignmentType === 'standalone' && (!details.title || !details.content)) || 
                            selectedStudents.length === 0
                        }
                    >
                        Create Assignment for {selectedStudents.length} {selectedStudents.length === 1 ? 'Student' : 'Students'}
                    </Button>
                </div>
             </CardContent>
           </Card>

           <Card className="border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none rounded-[2.5rem] bg-white dark:bg-white/5 overflow-hidden border-2">
              <CardHeader className="bg-white dark:bg-black/20 border-b border-gray-50 dark:border-white/5 p-6 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Selected Students ({selectedStudents.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                      {selectedStudents.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 dark:text-gray-500 text-sm font-bold italic">No students selected</div>
                      ) : (
                          selectedStudents.map(id => {
                              const s = students?.find(st => st.id === id);
                              if (!s) return null;
                              return (
                                  <div key={id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 group">
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-[10px]">
                                              {s.firstName[0]}{s.lastName[0]}
                                          </div>
                                          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">{s.firstName} {s.lastName}</span>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedStudents(selectedStudents.filter(sid => sid !== id));
                                        }}
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </Button>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
