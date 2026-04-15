import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, BookOpen, Play, Clock, BarChart3 } from "lucide-react";
import { Link } from "wouter";

interface Lesson {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: number;
  createdBy: string;
}

export default function StudentLessons() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch lessons data
  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
    retry: false,
    refetchInterval: 60000,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const filteredLessons = lessons?.filter(lesson => 
    lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.difficulty?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "intermediate":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const handleStartLesson = (lessonId: string) => {
    // Navigate to typing session with this lesson
    window.location.href = `/student/lesson/${lessonId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center text-slate-900 dark:text-white">
            <BookOpen className="mr-4 h-8 w-8 text-blue-500" />
            Available Lessons
          </h2>
          <p className="text-gray-400">Practice with these typing lessons to improve your skills.</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card data-testid="card-total-lessons" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Available Lessons
              </CardTitle>
              <BookOpen className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {lessons?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-beginner-lessons" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Beginner Lessons
              </CardTitle>
              <Play className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {lessons?.filter(l => l.difficulty === 'beginner').length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-tight">
                Great for starting out
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-search-results" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Search Results
              </CardTitle>
              <Search className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {filteredLessons.length}
              </div>
              <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-tight">
                Matching lessons
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative group max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search lessons by title, description, or difficulty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 h-14 rounded-2xl focus:ring-blue-500 text-slate-900 dark:text-white"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            // Loading skeleton
            [...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 rounded-[2rem]">
                <CardHeader>
                  <div className="h-5 bg-gray-100 dark:bg-white/10 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-3 bg-gray-100 dark:bg-white/10 rounded"></div>
                    <div className="h-3 bg-gray-100 dark:bg-white/10 rounded w-5/6"></div>
                    <div className="h-12 bg-gray-100 dark:bg-white/10 rounded-xl mt-4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredLessons.length > 0 ? (
            filteredLessons.map((lesson) => (
              <Card key={lesson.id} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.07] hover:border-blue-500/30 transition-all rounded-[2rem] shadow-sm dark:shadow-none overflow-hidden group" data-testid={`card-lesson-${lesson.id}`}>
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={getDifficultyColor(lesson.difficulty)}>
                      {lesson.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {lesson.title}
                  </CardTitle>
                  <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {lesson.description}
                  </p>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-white/10">
                    <div className="flex items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      ~{lesson.estimatedTime} Min Session
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleStartLesson(lesson.id)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 font-bold shadow-lg shadow-blue-500/10"
                    data-testid={`button-start-${lesson.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    START MISSION
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-gray-200/20 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
              <BookOpen className="mx-auto h-20 w-20 text-gray-300 dark:text-gray-700 mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {searchQuery ? "No Matches Detected" : "No Active Lessons"}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery 
                  ? "Adjust your search parameters to locate specific educational missions."
                  : "Command center high command hasn't deployed any lessons yet."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}