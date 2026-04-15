import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft,
  Megaphone,
  BookOpen,
  FileText,
  ClipboardList,
  ChevronRight,
  Download,
  ExternalLink,
  Clock,
  Target,
  Activity,
  User as UserIcon,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Leaderboard from "@/components/classroom/Leaderboard";

interface ActivityReport {
  id: string;
  studentName: string;
  lessonTitle: string;
  wpm: string;
  accuracy: string;
  errors: number;
  time: number;
  date: string;
}

interface Classroom {
  id: string;
  name: string;
  section: string;
  description: string;
  teacherName: string;
  teacherUsername: string;
}

interface Announcement {
  id: string;
  content: string;
  createdAt: string;
}

interface Module {
  id: string;
  title: string;
  type: string;
  url: string;
  createdAt: string;
}

interface Lesson {
  id: string;
  title: string;
  difficulty: string;
  description: string;
}

interface Assignment {
  id: string;
  lessonId: string;
  status: string;
  dueDate: string;
  lessonTitle?: string;
  feedback?: string;
}

export default function StudentClassroomDetails() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/student/classrooms/:id");
  const classroomId = params?.id;

  // Handle active tab from query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "announcements";
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: classroom } = useQuery<Classroom>({
    queryKey: [`/api/classrooms/${classroomId}`],
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

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: [`/api/classrooms/${classroomId}/assignments`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  const { data: activities } = useQuery<ActivityReport[]>({
    queryKey: [`/api/classrooms/${classroomId}/activities`],
    enabled: !!classroomId,
    refetchInterval: 60000,
  });

  if (!isAuthenticated || user?.role !== "student") return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/student">
          <Button variant="ghost" className="mb-8 text-gray-400 hover:text-white rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>

        {classroom && (
          <div className="space-y-6 mb-12">
            <div className="space-y-2">
              <h2 className="text-[72px] font-black leading-none tracking-tighter text-white uppercase drop-shadow-2xl">
                {classroom?.name}
              </h2>
              {classroom?.description && (
                <p className="text-gray-400 font-bold text-lg max-w-2xl leading-relaxed">
                  {classroom.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6">
               <div className="bg-blue-600 px-6 py-2 rounded-2xl border border-blue-400/30 shadow-lg shadow-blue-600/20">
                  <p className="text-[12px] font-black text-white uppercase tracking-[0.3em]">
                    {classroom?.section || "ACTIVE ROOM"}
                  </p>
               </div>
               
               <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-2xl backdrop-blur-sm">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <UserIcon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">Instructor</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">{classroom?.teacherName}</span>
                      <span className="text-blue-400/60 text-[10px] font-bold uppercase tracking-tighter">@{classroom?.teacherUsername}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-14 w-full justify-start overflow-x-auto custom-scrollbar">
            <TabsTrigger value="announcements" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
              <Megaphone className="w-4 h-4 mr-2" /> Announcements ({announcements?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="lessons" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
              <BookOpen className="w-4 h-4 mr-2" /> Training Lessons ({lessons?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="modules" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
              <FileText className="w-4 h-4 mr-2" /> Learning Modules ({modules?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
              <ClipboardList className="w-4 h-4 mr-2" /> Room Tasks ({assignments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activities" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
              <Activity className="w-4 h-4 mr-2" /> Activities ({activities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all h-full">
              <BarChart3 className="w-4 h-4 mr-2" /> Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Announcements */}
          <TabsContent value="announcements" className="space-y-6 outline-none">
            {announcements?.length === 0 ? (
              <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                <Megaphone className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No announcements yet</p>
              </div>
            ) : (
              announcements?.map((a) => (
                <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} key={a.id}>
                  <Card className="bg-white/5 border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <Megaphone className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                         <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{a.content}</p>
                         <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-4">
                           Instructor shared on {format(new Date(a.createdAt), 'MM/dd/yyyy')}
                         </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Training Lessons */}
          <TabsContent value="lessons" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lessons?.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                   <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No specific lessons for this room</p>
                </div>
              ) : (
                lessons?.map(l => (
                  <Card key={l.id} className="bg-white/5 border-white/10 rounded-3xl p-6 hover:bg-white/[0.08] transition-all group cursor-pointer" onClick={() => setLocation(`/student/lesson/${l.id}`)}>
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-xl font-bold truncate pr-4">{l.title}</h4>
                       <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-tighter">
                         {l.difficulty}
                       </Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-6">{l.description || "Master your technique with this targeted lesson."}</p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 font-bold text-xs uppercase tracking-widest group-hover:shadow-lg group-hover:shadow-blue-600/20 transition-all">
                       Initialize Lesson
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Modules */}
          <TabsContent value="modules" className="space-y-6 outline-none">
            <div className="space-y-4">
               {modules?.length === 0 ? (
                 <div className="text-center py-24 bg-white/2 rounded-[3rem] border border-dashed border-white/10">
                    <FileText className="w-20 h-20 text-gray-700 mx-auto mb-6" />
                    <h4 className="text-2xl font-black mb-2">No Modules Shared</h4>
                    <p className="text-gray-500 max-w-xs mx-auto font-bold text-sm tracking-tight text-center">Your instructor hasn't uploaded any study materials yet.</p>
                 </div>
               ) : (
                 modules?.map(m => (
                    <Card key={m.id} className="bg-white/5 border-white/10 rounded-3xl p-6 flex items-center justify-between group hover:bg-white/[0.08] transition-colors relative">
                      <a 
                        href={m.url} 
                        download={m.title} 
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                           <Download className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{m.title}</p>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Available since {format(new Date(m.createdAt), 'MM/dd/yyyy')}</p>
                        </div>
                      </a>
                      <a 
                        href={m.url} 
                        download={m.title} 
                        className="rounded-xl h-12 w-12 bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors shadow-sm relative z-10"
                        title="Download Module"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </Card>
                 ))
               )}
            </div>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="space-y-6 outline-none">
            <div className="space-y-3">
               {assignments?.length === 0 ? (
                 <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs">No active tasks for this room</div>
               ) : (
                  assignments?.map(assign => (
                    <Card key={assign.id} className="bg-white/5 border-white/10 rounded-2xl p-6 flex items-center justify-between hover:bg-white/[0.08] transition-colors group cursor-pointer" onClick={() => setLocation(`/student/lesson/${assign.lessonId}/${assign.id}`)}>
                       <div className="flex-1">
                          <h4 className="font-bold text-lg">{assign.lessonTitle || "Neural Assignment"}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                               <Clock className="w-3 h-3 mr-2" />
                               Due: {format(new Date(assign.dueDate), 'MM/dd')}
                            </div>
                            <div className="flex items-center text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">
                               <Target className="w-3 h-3 mr-2" />
                               Task ID: {assign.id.slice(0, 8)}
                            </div>
                          </div>
                       </div>
                        <div className="flex items-center gap-6">
                          {assign.feedback && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 bg-blue-500/10 rounded-lg" onClick={(e) => e.stopPropagation()}>
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="bg-slate-900 border-white/10 text-white p-4 rounded-xl shadow-2xl">
                                <p className="text-[10px] font-black uppercase text-blue-400 mb-2">Instructor Feedback</p>
                                <p className="text-xs leading-relaxed">{assign.feedback}</p>
                              </PopoverContent>
                            </Popover>
                          )}
                          <Badge className={
                             assign.status === 'completed' 
                             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                             : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }>
                            {assign.status}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-all" />
                       </div>
                    </Card>
                  ))
               )}
            </div>
          </TabsContent>

          {/* Activities */}
          <TabsContent value="activities" className="space-y-6 outline-none">
             <div className="space-y-3">
                {activities?.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 font-bold uppercase tracking-widest text-xs">No activity logs recorded yet</div>
                ) : (
                  activities?.map(act => (
                     <Card key={act.id} className="bg-white/5 border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-colors">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                           <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-xs font-black text-blue-400 uppercase">
                             {act.studentName[0]}
                           </div>
                           <div>
                              <p className="font-bold text-white text-md leading-tight">{act.studentName}</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{act.lessonTitle}</p>
                           </div>
                         </div>
                         
                         <div className="flex items-center gap-12">
                            <div className="text-center">
                               <p className="text-lg font-black text-blue-400">{Math.round(Number(act.wpm))}</p>
                               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">WPM</p>
                            </div>
                            <div className="text-center">
                               <p className="text-lg font-black text-emerald-400">{Math.round(Number(act.accuracy))}%</p>
                               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Accuracy</p>
                            </div>
                            <div className="text-center">
                               <p className="text-lg font-black text-red-400">{act.errors}</p>
                               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Errors</p>
                            </div>
                            <div className="text-center">
                               <p className="text-lg font-black text-indigo-400">{Math.floor(act.time / 60)}m</p>
                               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Time</p>
                            </div>
                            <div className="text-right min-w-[80px]">
                               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{format(new Date(act.date), 'MM/dd/yyyy')}</p>
                            </div>
                         </div>
                       </div>
                     </Card>
                  ))
                )}
             </div>
          </TabsContent>
          {/* Leaderboard */}
          <TabsContent value="leaderboard" className="space-y-6 outline-none">
             {classroomId && <Leaderboard classroomId={classroomId} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
