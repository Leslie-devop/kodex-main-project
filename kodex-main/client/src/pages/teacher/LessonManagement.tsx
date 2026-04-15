import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Edit2, Trash2, Clock, Search, FileText } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  estimatedTime: number;
  createdAt: string;
  isStandalone?: boolean;
  classroomId?: string;
}

export default function LessonManagement() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [classroomFilter, setClassroomFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  const { data: classrooms } = useQuery<any[]>({
    queryKey: ["/api/classrooms"],
    retry: false,
    refetchInterval: 60000,
  });

  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    retry: false,
    refetchInterval: 60000,
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const response = await apiRequest("DELETE", `/api/lessons/${lessonId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lesson Deleted",
        description: "The lesson has been successfully removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lessons"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || user?.role !== "teacher") return null;

  const filteredLessons = lessons?.filter(l => l.isStandalone !== true)
    .filter(l => {
      const matchesSearch = 
        (l.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (l.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === "all" || l.difficulty === difficultyFilter;
      const matchesClassroom = classroomFilter === "all" || l.classroomId === classroomFilter || (classroomFilter === "unassigned" && !l.classroomId);

      return matchesSearch && matchesDifficulty && matchesClassroom;
    }).sort((a, b) => {
      if (sortOrder === "a-z") {
        return a.title.localeCompare(b.title);
      } else if (sortOrder === "z-a") {
        return b.title.localeCompare(a.title);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "intermediate": return "bg-amber-50 text-amber-600 border-amber-100";
      case "advanced": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

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
                    <BookOpen className="h-8 w-8" />
                </div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Lesson Repository
                </h2>
            </div>
            <p className="text-slate-500 dark:text-gray-400 font-semibold text-lg max-w-2xl">Manage your lesson library and design new typing protocols.</p>
          </motion.div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  placeholder="Filter lessons..." 
                  className="pl-12 w-full md:w-80 h-14 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl focus:ring-blue-500/20 font-bold shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Link href="/teacher/lessons/create">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl px-8 h-14 shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  <Plus className="mr-3 h-6 w-6" />
                  Initialize New Lesson
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 rounded-[2rem] bg-white border border-slate-100 animate-pulse" />)}
          </div>
        ) : filteredLessons && filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-blue-600/40 rounded-[2rem] transition-all hover:shadow-2xl hover:shadow-blue-600/5 overflow-hidden h-full flex flex-col shadow-sm dark:shadow-none">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight line-clamp-1">{lesson.title}</CardTitle>
                        <Badge className={`${getDifficultyColor(lesson.difficulty)} font-black text-[10px] uppercase truncate`}>
                          {lesson.difficulty}
                        </Badge>
                    </div>
                    {lesson.description && (
                      <p className="text-sm text-slate-500 dark:text-gray-400 font-bold line-clamp-2 mt-2">{lesson.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="p-8 pt-4 flex-1 flex flex-col justify-end">
                    <div className="bg-gray-50 dark:bg-slate-900/40 rounded-xl p-4 mb-6 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {lesson.estimatedTime ? Math.round(lesson.estimatedTime / 60) : 0} Minutes
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 font-black h-12"
                          onClick={() => navigate(`/teacher/lessons/${lesson.id}/assign`)}
                        >
                          DEPLOY
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-12 w-12 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100 border border-transparent transition-all"
                          onClick={() => navigate(`/teacher/lessons/${lesson.id}/edit`)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-12 w-12 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 border border-transparent transition-all"
                          onClick={() => {
                              if (window.confirm("Are you sure you want to delete this lesson?")) {
                                deleteLessonMutation.mutate(lesson.id);
                              }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-all">
            <div className="bg-gray-50 dark:bg-white/5 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 dark:border-white/10 shadow-sm">
                <BookOpen className="h-12 w-12 text-slate-300 dark:text-gray-700" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">No Lessons Available</h3>
            <p className="text-slate-500 dark:text-gray-500 max-w-sm mx-auto mb-10 font-medium text-lg">
              Initialize a new lesson to start building your typing curriculum.
            </p>
            <Link href="/teacher/lessons/create">
                <Button 
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] h-16 px-12 font-black text-lg shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
                >
                  INITIALIZE FIRST LESSON
                </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
