import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Search,
  ArrowLeft,
  Mail,
  Loader2,
  Plus,
  Settings,
  Megaphone,
  BookOpen,
  FileText,
  Activity,
  ClipboardList,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  BarChart3,
  MoreVertical,
  User,
  School,
  Calendar,
  Clock,
  MessageSquare
} from "lucide-react";
import { Link, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Leaderboard from "@/components/classroom/Leaderboard";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

interface Classroom {
  id: string;
  name: string;
  section: string;
  inviteCode: string;
}

interface Announcement {
  id: string;
  content: string;
  createdAt: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  type: string;
  url: string;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  difficulty: string;
  isStandalone?: boolean;
}

interface ActivityReport {
  id: string;
  studentName: string;
  lessonTitle: string;
  wpm: string;
  accuracy: string;
  errors: number;
  time: number;
  date: string;
  username?: string;
  assignmentId?: string;
}

interface Assignment {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  studentId?: string;
  status: string;
  dueDate: string;
  studentName?: string;
  feedback?: string;
}

export default function ClassroomDetails() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/teacher/classrooms/:id");
  const classroomId = params?.id;

  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "announcements";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Announcement state
  const [newAnnouncement, setNewAnnouncement] = useState("");
  
  // Module state
  const [isModuleOpen, setIsModuleOpen] = useState(false);
  const [newModule, setNewModule] = useState({ title: "", description: "", type: "file", url: "" });

  const { data: classroom } = useQuery<Classroom>({
    queryKey: [`/api/classrooms/${classroomId}`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  const { data: roster, isLoading: isRosterLoading } = useQuery<User[]>({
    queryKey: [`/api/classrooms/${classroomId}/students`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: [`/api/classrooms/${classroomId}/announcements`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  const { data: modules } = useQuery<Module[]>({
    queryKey: [`/api/classrooms/${classroomId}/modules`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  const { data: lessons } = useQuery<Lesson[]>({
    queryKey: [`/api/classrooms/${classroomId}/lessons`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  const { data: activities } = useQuery<ActivityReport[]>({
    queryKey: [`/api/classrooms/${classroomId}/activities`],
    enabled: !!classroomId,
    refetchInterval: 60000, // Live activity updates every 5 seconds
  });

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: [`/api/classrooms/${classroomId}/assignments`],
    enabled: !!classroomId,
    refetchInterval: 60000, // Live assignment updates
  });

  const [feedbackDialog, setFeedbackDialog] = useState<{ open: boolean; assignmentId: string; currentFeedback: string }>({
    open: false,
    assignmentId: "",
    currentFeedback: "",
  });

  // Mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/classrooms/${classroomId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/announcements`] });
      setNewAnnouncement("");
      toast({ 
        title: "Posted", 
        description: "Your announcement is now visible to all students in this room." 
      });
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
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/assignments`] });
      setFeedbackDialog(prev => ({ ...prev, open: false }));
      toast({ title: "Feedback Sent", description: "The student will be notified." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lesson");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/lessons`] });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
      toast({ title: "Lesson Deleted", description: "The typing protocol has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/classrooms/${classroomId}/announcements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/announcements`] });
      toast({ title: "Deleted", description: "Announcement removed." });
    }
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: typeof newModule) => {
      const res = await fetch(`/api/classrooms/${classroomId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
         try {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to create module");
         } catch(e) {
            throw new Error(`Failed to create module (${res.status})`);
         }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/classrooms/${classroomId}/modules`] });
      setNewModule({ title: "", description: "", type: "file", url: "" });
      toast({ title: "Module Added successfully!", description: "The learning material is now accessible to all students." });
    },
    onError: (err: Error) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const filteredRoster = (roster || [])
    .filter(s => 
      s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors selection:bg-blue-500/20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/teacher/classrooms">
          <Button variant="ghost" className="mb-8 text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rooms
          </Button>
        </Link>

        {classroom && (
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">{classroom.name}</h2>
              <p className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-[0.3em] text-xs">{classroom.section || "General Keyboard Training"}</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{roster?.length || 0}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Students</p>
              </div>
              <div className="h-10 w-[1px] bg-gray-200 dark:bg-white/10" />
              <div className="text-center">
                <div className="px-3 py-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {classroom.inviteCode}
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Join Code</p>
              </div>
              <Link href={`/teacher/classrooms/${classroomId}/settings`}>
                <Button variant="outline" className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-2xl h-12 px-6 font-bold shadow-sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto custom-scrollbar shadow-sm">
            <TabsTrigger value="announcements" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <Megaphone className="w-4 h-4 mr-2" /> Announcements ({announcements?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="lessons" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <BookOpen className="w-4 h-4 mr-2" /> Lesson Practice ({lessons?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="modules" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <FileText className="w-4 h-4 mr-2" /> Modules ({modules?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activities" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <Activity className="w-4 h-4 mr-2" /> Activities ({activities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <BarChart3 className="w-4 h-4 mr-2" /> Leaderboard
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <ClipboardList className="w-4 h-4 mr-2" /> Assignments ({assignments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-500 dark:data-[state=inactive]:text-gray-400 transition-all h-full">
              <Users className="w-4 h-4 mr-2" /> Students ({roster?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-6 outline-none">
            <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Latest Updates</h3>
               <Button 
                className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-12 px-8 font-bold shadow-lg shadow-blue-600/20 text-white"
                onClick={() => {
                  if(!newAnnouncement.trim()) {
                    toast({ title: "Empty Content", description: "Please write something before posting.", variant: "destructive" });
                    return;
                  }
                  createAnnouncementMutation.mutate(newAnnouncement.trim());
                }}
                disabled={createAnnouncementMutation.isPending || !newAnnouncement.trim()}
               >
                 {createAnnouncementMutation.isPending ? (
                   <Loader2 className="animate-spin w-4 h-4 mr-2" />
                 ) : (
                   <Plus className="w-4 h-4 mr-2" />
                 )}
                 Post Announcement
               </Button>
            </div>

            <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
               <Textarea 
                placeholder="Write an announcement for your students..."
                className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 rounded-2xl min-h-[120px] mb-4 focus:ring-blue-500 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
               />
               <p className="text-xs text-gray-400 dark:text-gray-500 italic uppercase font-bold tracking-tight">Post announcements to keep your students informed about important updates.</p>
            </Card>

            <div className="space-y-4">
              {announcements?.length === 0 ? (
                <div className="text-center py-12 bg-white/2 rounded-3xl border border-dashed border-white/10">
                  <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No announcements yet</p>
                </div>
              ) : (
                announcements?.map((a) => (
                  <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} key={a.id}>
                    <Card className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-3xl p-6 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors relative group shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                          <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                           <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">Announcement</p>
                           <p className="text-slate-600 dark:text-gray-300 leading-relaxed font-medium">{a.content}</p>
                           <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-4">
                             Posted on {format(new Date(a.createdAt), 'MMMM d, yyyy')}
                           </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all"
                        onClick={() => deleteAnnouncementMutation.mutate(a.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Lesson Practice Tab */}
          <TabsContent value="lessons" className="space-y-6 outline-none">
             <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Room-Specific Lessons</h3>
               <Link href={`/teacher/lessons/create?classroom=${classroomId}`}>
                <Button className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-12 px-8 font-bold shadow-lg shadow-blue-600/20 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Create Lesson
                </Button>
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(lessons || []).filter(l => l.isStandalone !== true).length === 0 ? (
                 <div className="col-span-full text-center py-20 bg-white dark:bg-white/2 rounded-3xl border border-dashed border-gray-200 dark:border-white/10 text-gray-500 shadow-sm">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No specific lessons for this room</p>
                 </div>
              ) : (
                (lessons || []).filter(l => l.isStandalone !== true).map(l => (
                  <Card key={l.id} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-3xl p-6 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-all group shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                       <h4 className="text-xl font-bold truncate pr-4 text-slate-900 dark:text-white">{l.title}</h4>
                       <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-tighter">
                         {l.difficulty}
                       </Badge>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-gray-300">
                         Edit
                       </Button>
                       <Button variant="ghost" className="flex-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-xs uppercase tracking-widest">
                         View
                       </Button>
                       <Button 
                         variant="ghost" 
                         className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 h-10 w-10 p-0 rounded-xl transition-all"
                         onClick={() => {
                           if (window.confirm(`Are you sure you want to delete "${l.title}"?`)) {
                             deleteLessonMutation.mutate(l.id);
                           }
                         }}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6 outline-none">
             <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Learning Modules</h3>
               <Dialog open={isModuleOpen} onOpenChange={setIsModuleOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-12 px-8 font-bold shadow-lg shadow-blue-600/20 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Add Module
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-[#1e293b] border-gray-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">New Module</DialogTitle>
                      <DialogDescription className="text-gray-500 dark:text-gray-400">Share files or resources with this classroom.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Module Title</label>
                        <Input 
                          placeholder="e.g. Home Row Basics" 
                          className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                          value={newModule.title}
                          onChange={(e) => setNewModule({...newModule, title: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                        <Input 
                          placeholder="Brief explanation of this material..." 
                          className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white"
                          value={newModule.description}
                          onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Upload File</label>
                        <Input 
                          type="file" 
                          className="bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-xl file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-1 file:mr-4 file:cursor-pointer hover:file:bg-blue-500 cursor-pointer pt-2.5 text-slate-900 dark:text-white"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewModule({
                                  ...newModule,
                                  url: reader.result as string,
                                  type: "file",
                                  title: newModule.title || file.name
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" className="rounded-xl text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5" onClick={() => setIsModuleOpen(false)}>Cancel</Button>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-500 rounded-xl px-8 text-white"
                        onClick={() => {
                          if(!newModule.title || !newModule.url) return;
                          createModuleMutation.mutate(newModule);
                          setIsModuleOpen(false);
                        }}
                      >
                        Add Module
                      </Button>
                    </DialogFooter>
                  </DialogContent>
               </Dialog>
            </div>

            <p className="text-gray-400 mb-8">Share learning materials with students. Students can access these files directly from their room view.</p>

            <div className="space-y-4">
               {modules?.length === 0 ? (
                 <div className="text-center py-24 bg-white dark:bg-white/2 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                    <FileText className="w-20 h-20 text-gray-300 dark:text-gray-700 mx-auto mb-6" />
                    <h4 className="text-2xl font-black mb-2 text-slate-900 dark:text-white uppercase italic tracking-tighter">No Modules Yet</h4>
                    <p className="text-gray-500 dark:text-gray-500 max-w-xs mx-auto mb-8 font-bold text-[10px] uppercase tracking-widest text-center">Add learning materials for students to access.</p>
                    <Button 
                      onClick={() => setIsModuleOpen(true)}
                      className="bg-blue-600 hover:bg-blue-500 rounded-2xl h-14 px-10 font-bold text-white shadow-lg shadow-blue-600/20"
                    >
                       <Plus className="w-5 h-5 mr-3" /> Add First Module
                    </Button>
                 </div>
               ) : (
                 modules?.map(m => (
                     <Card key={m.id} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                           <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">{m.title}</p>
                          {m.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{m.description}</p>}
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Uploaded {format(new Date(m.createdAt), 'MM/dd/yyyy')}</p>
                        </div>
                      </div>
                      <a href={m.url} download={m.title} className="rounded-xl h-12 px-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0 font-bold text-sm">
                        <Download className="w-4 h-4 mr-2" /> Download
                      </a>
                    </Card>
                 ))
               )}
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-6 outline-none">
             <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Student Activities</h3>
            </div>

            <div className="space-y-3">
               {activities?.length === 0 ? (
                 <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">No activity logs yet</div>
               ) : (
                 activities?.map(act => (
                    <Card key={act.id} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 text-xs font-black text-blue-600 dark:text-blue-400 uppercase">
                             {act.studentName[0]}
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 dark:text-white">{act.studentName}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{act.lessonTitle}</p>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-12 text-slate-900 dark:text-white">
                           <div className="text-center">
                              <p className="text-xl font-black text-blue-600 dark:text-blue-400">{Math.round(Number(act.wpm))}</p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">WPM</p>
                           </div>
                           <div className="text-center">
                              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{Math.round(Number(act.accuracy))}%</p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Accuracy</p>
                           </div>
                           <div className="text-center">
                              <p className="text-xl font-black text-red-600 dark:text-red-400">{act.errors}</p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Errors</p>
                           </div>
                           <div className="text-center">
                              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{Math.floor(act.time / 60)}m</p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">Time</p>
                           </div>
                           <div className="text-right min-w-[80px]">
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{format(new Date(act.date), 'MM/dd/yyyy')}</p>
                           </div>
                        </div>
                      </div>
                    </Card>
                 ))
               )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6 outline-none">
             {classroomId && <Leaderboard classroomId={classroomId} />}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-6 outline-none">
             <div className="flex items-center justify-between mb-8 px-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Room Assignments</h3>
               <div className="flex gap-4">
                  <Button variant="outline" className="border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl h-10 px-4 font-bold shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Export
                  </Button>
                  <Link href={`/teacher/assignments/create?classroom=${classroomId}`}>
                    <Button className="bg-blue-600 hover:bg-blue-500 rounded-xl h-10 px-6 font-bold shadow-lg shadow-blue-600/20 text-white">
                      <Plus className="w-4 h-4 mr-2" /> Create Assignment
                    </Button>
                  </Link>
               </div>
            </div>

            <div className="space-y-3">
               {assignments?.length === 0 ? (
                 <div className="text-center py-20 text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px]">No assignments for this classroom</div>
               ) : (
                  assignments?.map(assign => (
                    <Card key={assign.id} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.08] transition-colors group shadow-sm">
                       <div className="flex-1">
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">{assign.lessonTitle} Assignment</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-500 font-medium italic">Student: {assign.studentName || 'All Students'}</p>
                       </div>
                       <div className="flex items-center gap-8">
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className={`h-10 w-10 rounded-xl transition-all ${assign.feedback ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                             onClick={() => setFeedbackDialog({
                               open: true,
                               assignmentId: assign.id,
                               currentFeedback: assign.feedback || ""
                             })}
                           >
                             <MessageSquare className="h-4 w-4" />
                           </Button>
                          <div className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                             <Activity className="w-3 h-3 mr-2 text-gray-400 dark:text-gray-600" />
                             Due: {format(new Date(assign.dueDate), 'MM/dd/yyyy')}
                          </div>
                          <Badge className={
                             assign.status === 'completed' 
                             ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                             : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'
                          }>
                            {assign.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                    </Card>
                  ))
               )}
            </div>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6 outline-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Student Directory</h3>
               
               <div className="flex items-center gap-4 flex-1 max-w-xl">
                 <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input 
                      placeholder="Search by name, email or username..." 
                      className="pl-11 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 h-12 rounded-2xl focus:ring-blue-500 w-full text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <Button 
                  variant="outline" 
                  className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl h-12 px-4 shadow-sm text-slate-900 dark:text-white"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                 >
                   <Filter className="w-4 h-4 mr-2" />
                   {sortOrder === "asc" ? "A-Z" : "Z-A"}
                 </Button>
               </div>
            </div>

            {isRosterLoading ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-[2rem] bg-white dark:bg-white/5 animate-pulse border border-gray-100 dark:border-white/5 shadow-sm" />)}
               </div>
            ) : filteredRoster.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredRoster.map((student) => (
                    <motion.div
                      key={student.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[2.5rem] p-8 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all hover:border-blue-500/30 flex flex-col justify-between shadow-sm"
                    >
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/10 font-black text-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{student.firstName} {student.lastName}</h4>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-1">@{student.username}</p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                         <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Mail className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-600" />
                            <span className="truncate italic">{student.email}</span>
                         </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400"
                        >
                          Progress
                        </Button>
                        <Button
                          variant="ghost" 
                          size="icon"
                          className="w-12 h-12 rounded-xl text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                          onClick={() => {/* remove logic */}}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-24 bg-white dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                <Users className="h-20 w-20 text-gray-300 dark:text-gray-700 mx-auto mb-6 opacity-20" />
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase italic tracking-tighter">No Match Found</h3>
                <p className="text-gray-500 dark:text-gray-500 max-w-sm mx-auto font-black text-[10px] uppercase tracking-widest">
                  Try adjusting your search filters.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Feedback Dialog */}
      <Dialog open={feedbackDialog.open} onOpenChange={(open) => setFeedbackDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Neural Critique</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-gray-400 font-medium">Provide tactical guidance for this classroom task.</DialogDescription>
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
