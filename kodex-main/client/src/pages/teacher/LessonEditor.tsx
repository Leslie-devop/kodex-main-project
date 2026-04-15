import React, { useState, useEffect } from "react";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowLeft,
  BookOpen,
  Loader2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function LessonEdit() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [details, setDetails] = useState({
    title: "",
    description: "",
    difficulty: "beginner",
    timeLimit: 120, // 2 minutes
    content: "",
    maxAttempts: "unlimited",
    allowBackspace: true,
    classroomId: ""
  });

  const { data: classrooms } = useQuery<any[]>({
    queryKey: ["/api/classrooms"],
    enabled: isAuthenticated && user?.role === "teacher"
  });

  const { data: lesson, isLoading } = useQuery<any>({
      queryKey: [`/api/lessons`],
      select: (lessons) => lessons.find((l: any) => l.id === id),
      enabled: !!id
  });

  useEffect(() => {
     if (lesson) {
         setDetails({
             title: lesson.title || "",
             description: lesson.description || "",
             difficulty: lesson.difficulty || "beginner",
             timeLimit: lesson.timeLimit || lesson.estimatedTime * 60 || 120,
             content: lesson.content || "",
             maxAttempts: lesson.maxAttempts === 0 ? "unlimited" : (lesson.maxAttempts?.toString() || "unlimited"),
             allowBackspace: lesson.allowBackspace ?? true,
             classroomId: lesson.classroomId || ""
         })
     }
  }, [lesson]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/lessons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          difficulty: payload.difficulty,
          estimatedTime: Math.round(payload.timeLimit / 60) || 1,
          timeLimit: payload.timeLimit,
          content: payload.content,
          maxAttempts: payload.maxAttempts === "unlimited" ? 0 : parseInt(payload.maxAttempts),
          allowBackspace: payload.allowBackspace,
          classroomId: payload.classroomId && payload.classroomId !== "none" ? payload.classroomId : null
        }),
      });
      if (!res.ok) throw new Error("Failed to modify lesson");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Lesson Modified", description: "The curriculum blueprint has been successfully updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      navigate("/teacher/lessons");
    },
    onError: (err: any) => {
        toast({ title: "Modification Failed", description: err.message, variant: "destructive" });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.title || !details.content) {
        toast({ title: "Missing Fields", description: "Title and content are strictly required.", variant: "destructive" });
        return;
    }
    updateMutation.mutate(details);
  };

  if (!isAuthenticated || user?.role !== "teacher") return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!lesson) {
     return (
       <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col items-center justify-center text-slate-900 dark:text-white">
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">Lesson Blueprint Not Found</h2>
          <Button onClick={() => navigate("/teacher/lessons")} className="bg-blue-600 hover:bg-blue-500 rounded-xl text-white px-8">Return to Repository</Button>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/20 transition-colors">
      <Header />
      
      <main className="max-w-[1400px] mx-auto px-6 py-12 flex flex-col xl:flex-row gap-10">
        <div className="flex-1 space-y-10">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Modify Lesson Architect</h2>
            <p className="text-slate-500 dark:text-gray-400 font-semibold text-base">Reconfigure parameters and curriculum structure.</p>
          </div>

          <Card className="border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-white/5">
             <CardHeader className="p-8 border-b border-gray-100 dark:border-white/5">
                 <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white">
                     <BookOpen className="w-6 h-6 text-blue-600" />
                     Lesson Architect Details
                 </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Classroom (Optional)</Label>
                        <Select 
                          value={details.classroomId || "none"} 
                          onValueChange={(val) => setDetails({...details, classroomId: val === "none" ? "" : val})}
                        >
                            <SelectTrigger className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 focus:ring-blue-500/20 font-bold">
                                <SelectValue placeholder="Global Lesson (All Students)" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10">
                                <SelectItem value="none" className="font-bold">Global Lesson (All Students)</SelectItem>
                                {classrooms?.map(c => (
                                    <SelectItem key={c.id} value={c.id} className="font-bold">{c.name} - {c.section}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                          Reassigning this lesson to a room will make it exclusive to that room.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Title *</Label>
                        <Input 
                          value={details.title}
                          onChange={(e) => setDetails({...details, title: e.target.value})}
                          placeholder="Lesson Title" 
                          className="h-14 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl px-6 focus:ring-blue-500/20 font-bold text-slate-900 dark:text-white" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Description</Label>
                        <Textarea 
                          value={details.description}
                          onChange={(e) => setDetails({...details, description: e.target.value})}
                          placeholder="Lesson Description" 
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
                                       value={details.timeLimit ? details.timeLimit / 60 : ''}
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
                         <p className="text-[10px] text-slate-400 dark:text-gray-500 font-bold italic">0 = unlimited attempts, 1+ = maximum attempts upon deployment</p>
                     </div>

                     <div className="space-y-3">
                         <Label className="font-black text-xs uppercase tracking-widest text-slate-500 dark:text-gray-400">Backspace Access</Label>
                         <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 h-14 rounded-2xl border border-gray-100 dark:border-white/5 max-w-md">
                             <Button
                                 variant={details.allowBackspace ? "default" : "outline"}
                                 onClick={(e) => { e.preventDefault(); setDetails({ ...details, allowBackspace: !details.allowBackspace })}}
                                 className={`flex-1 h-full rounded-xl transition-all font-black uppercase text-[10px] tracking-widest ${details.allowBackspace ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20" : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500"}`}
                             >
                                 {details.allowBackspace ? "Active" : "Locked"}
                             </Button>
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

          <AnimatePresence>
            {updateMutation.isPending && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex justify-center py-6"
                >
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-6 rounded-3xl shadow-2xl dark:shadow-none border border-gray-100 dark:border-white/5">
                        <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-500" />
                        <div className="flex flex-col">
                            <span className="font-black text-lg text-slate-900 dark:text-white">Modifying Curriculum...</span>
                            <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">Saving protocol changes</span>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-6 pb-20 xl:hidden">
              <Button 
                size="lg"
                className="h-16 px-12 font-black text-lg bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all text-white disabled:opacity-50" 
                onClick={handleSubmit}
                disabled={updateMutation.isPending || !details.title || !details.content}
             >
                Save Protocol Changes
             </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[360px] space-y-8 hidden xl:block">
           <Card className="border-gray-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-[2.5rem] bg-white dark:bg-white/5 sticky top-12 overflow-hidden border-2">
             <CardHeader className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 p-8">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-gray-400">Protocol Preview</CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="p-8 space-y-8">
                    <div>
                        <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">
                            {details.title || 'Lesson Title'}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 font-bold text-[10px] uppercase">{details.difficulty}</Badge>
                            <Badge variant="outline" className="border-gray-200 dark:border-white/10 text-slate-500 dark:text-gray-400 font-bold text-[10px] uppercase">
                                {Math.round(details.timeLimit / 60)} MIN
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">Max Attempts</span>
                            <span className="font-black uppercase text-slate-700 dark:text-gray-300">{details.maxAttempts}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-600 p-8 text-white">
                    <Button 
                        className="w-full h-14 bg-white text-blue-600 hover:bg-blue-50 font-black rounded-2xl text-base shadow-xl active:scale-95 transition-all shadow-white/10"
                        onClick={handleSubmit}
                        disabled={updateMutation.isPending || !details.title || !details.content}
                    >
                        Save Protocol changes
                    </Button>
                </div>
             </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
