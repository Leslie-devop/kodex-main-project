import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import TypingSession from "@/components/typing/TypingSession";
import AISuggestions from "@/components/student/AISuggestions";
import PostureGuide from "@/components/student/PostureGuide";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Target, Clock } from "lucide-react";
import { Link } from "wouter";

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  content: string;
  allowBackspace: boolean;
}

interface LessonAssignment {
  id: string;
  allowBackspace: boolean;
  timeLimit: number | null;
  dueDate: string | null;
  status: string;
}

interface LessonPracticeProps {
  lessonId: string;
  assignmentId?: string;
}

export default function LessonPractice({ lessonId, assignmentId }: LessonPracticeProps) {
  const { user, isAuthenticated } = useAuth();
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const { data: lesson, isLoading: isLessonLoading } = useQuery<Lesson>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
    retry: false,
  });

  const { data: assignment, isLoading: isAssignmentLoading } = useQuery<LessonAssignment>({
    queryKey: ["/api/assignments", assignmentId],
    enabled: !!assignmentId,
    retry: false,
  });

  const isLoading = isLessonLoading || (!!assignmentId && isAssignmentLoading);

  if (!isAuthenticated) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "intermediate": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "advanced": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  if (isLoading || !lesson) return null;

  const isLocked = assignmentId && assignment && 
    assignment.dueDate && new Date(assignment.dueDate) < new Date() && 
    assignment.status !== "completed";

  if (isLocked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="mb-12 inline-flex items-center justify-center p-8 bg-red-500/10 border-2 border-red-500/20 rounded-[3rem] animate-pulse">
            <ArrowLeft className="h-24 w-24 text-red-500" />
          </div>
          <h2 className="text-6xl font-black italic tracking-tighter uppercase mb-6">
            ACCESS <span className="text-red-500">DENIED</span>
          </h2>
          <p className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-12">
            Tactical deadline exceeded. This mission objective is now offline.
          </p>
          <Link to="/student/assignments">
            <Button className="h-16 px-12 bg-white text-black hover:bg-white/90 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105">
               RETURN TO MISSION HUB
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Compact Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-4">
            <Link to="/student/lessons">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white -ml-2 h-8">
                <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                Return to Mission Hub
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                {lesson.title}
              </h1>
              <Badge className={`px-3 py-0.5 text-[10px] font-black uppercase tracking-widest ${getDifficultyColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </Badge>
              {assignmentId && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                  Assigned Objective
                </Badge>
              )}
            </div>
            <p className="text-slate-500 dark:text-gray-400 max-w-2xl text-sm font-medium leading-relaxed">
              {lesson.description}
            </p>
          </div>

          <div className="flex items-center gap-6 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 rounded-2xl backdrop-blur-md shadow-sm dark:shadow-none">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Time Limit</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{lesson.estimatedTime} Min</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-100 dark:bg-white/5"></div>
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Objective</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">95% ACCURACY</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (9/12) */}
          <div className="lg:col-span-9 space-y-8">
            <TypingSession 
              lessonId={lessonId} 
              assignmentId={assignmentId}
              onStart={() => setIsSessionStarted(true)} 
              timeLimit={assignment?.timeLimit ? Math.round(assignment.timeLimit / 60) : lesson.estimatedTime}
              allowBackspace={assignmentId ? assignment?.allowBackspace : lesson.allowBackspace}
            />
            
            {/* Intel Section moved below Typing for better flow */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Pre-Mission Protocol</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <ul className="space-y-3 text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                    <li className="flex gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>Position neural connectors (fingers) correctly on home-row anchors.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>Sync respiratory rhythm; stay calm for optimal cadmium.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-sm dark:shadow-none">
                <CardHeader className="p-6 pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Tactical Engagement</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <ul className="space-y-3 text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                    <li className="flex gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>Prioritize precision over raw velocity; speed matures with rhythm.</span>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>Rely on muscle memory protocols; decouple visual tracking.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar (3/12) */}
          <div className="lg:col-span-3 space-y-6 sticky top-8">
            <PostureGuide autoStart={isSessionStarted} />
            <AISuggestions />
            
            {/* Quick Status Card */}
            <Card className="bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/20 rounded-2xl overflow-hidden">
               <CardContent className="p-4 text-center">
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">System Health</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-white">Neural Uplink Stable</div>
                  <div className="mt-2 h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                  </div>
               </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}