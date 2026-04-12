import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Clock, Award, User, BarChart3, FileText } from "lucide-react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProgressData {
  id: string;
  studentId: string;
  lessonId: string;
  status: string;
  progress: number;
  averageWpm: number;
  averageAccuracy: number;
  totalSessions: number;
  completedSessions: number;
  assignedAt: string;
  dueDate?: string;
  student?: Student;
  lesson?: {
    title: string;
    difficulty: string;
  };
}

export default function StudentProgress() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch students
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
    retry: false,
  });

  // Fetch progress data
  const { data: progressData, isLoading } = useQuery<ProgressData[]>({
    queryKey: ["/api/teacher/progress"],
    retry: false,
  });

  if (!isAuthenticated || user?.role !== "teacher") {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const filteredProgress = progressData?.filter(progress => 
    progress.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    progress.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    progress.student?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    progress.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "in_progress": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "pending": return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
      case "overdue": return "bg-red-500/20 text-red-400 border border-red-500/30";
      default: return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-emerald-500/20 text-emerald-400";
      case "intermediate": return "bg-amber-500/20 text-amber-400";
      case "advanced": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  // Calculate overall stats
  const totalAssignments = progressData?.length || 0;
  const completedAssignments = progressData?.filter(p => p.status === 'completed').length || 0;
  const averageWpm = progressData && progressData.length > 0 ? 
    Math.round(progressData.reduce((sum, p) => sum + p.averageWpm, 0) / progressData.length) : 0;
  const averageAccuracy = progressData && progressData.length > 0 ? 
    Math.round(progressData.reduce((sum, p) => sum + p.averageAccuracy, 0) / progressData.length) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center">
            <TrendingUp className="mr-4 h-8 w-8 text-blue-500" />
            Student Progress
          </h2>
          <p className="text-gray-400">Monitor student performance and track progress across all assignments.</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card data-testid="card-total-assignments" className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Total Assignments
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalAssignments}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-completed" className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Completed
              </CardTitle>
              <Award className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {completedAssignments}
              </div>
              <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tight">
                {totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-wpm" className="bg-white/5 border-white/10 backdrop-blur-xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Average WPM
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400 flex items-center">
                {averageWpm} <span className="text-sm ml-1 text-gray-500">WPM</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tight">
                Fleet Velocity
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-accuracy" className="bg-white/5 border-white/10 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                Average Accuracy
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">
                {averageAccuracy}%
              </div>
              <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tight">
                Typing accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search students or lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-white/5 border-white/10 h-14 rounded-2xl focus:ring-blue-500 text-white"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Progress Data */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-white/5 border-white/10 rounded-[2rem]">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-6">
                    <div className="h-16 w-16 bg-white/10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-1/4 mb-3"></div>
                      <div className="h-3 bg-white/10 rounded w-1/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProgress.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredProgress.map((progress) => (
              <Card key={progress.id} className="bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-blue-500/30 transition-all rounded-[2rem]" data-testid={`card-progress-${progress.id}`}>
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                      <div className="h-16 w-16 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center">
                        <User className="h-8 w-8 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                          {progress.student?.firstName} {progress.student?.lastName}
                        </h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{progress.student?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-8">
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Velocity</div>
                        <div className="text-2xl font-black text-blue-400">
                          {Math.round(progress.averageWpm)} <span className="text-xs text-gray-500">WPM</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Precision</div>
                        <div className="text-2xl font-black text-emerald-400">
                          {Math.round(progress.averageAccuracy)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Sessions</div>
                        <div className="text-2xl font-black text-purple-400">
                          {progress.completedSessions}/{progress.totalSessions}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Lesson Assignment</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${getDifficultyColor(progress.lesson?.difficulty || '')}`}>
                          {progress.lesson?.difficulty}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-gray-300">{progress.lesson?.title}</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Status / Completion</span>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${getStatusColor(progress.status)}`}>
                          {progress.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-3 border border-white/10 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.max(0, progress.progress))}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 mt-2 text-right">{Math.round(progress.progress)}% complete</p>
                    </div>
                  </div>

                  {progress.dueDate && (
                    <div className="mt-6 flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                      <Clock className="h-4 w-4 mr-2" />
                      Due: {new Date(progress.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/5 border-dashed border-white/10 rounded-[3rem]">
            <CardContent className="text-center py-24">
              <BarChart3 className="h-20 w-20 mx-auto mb-6 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">No Progress Data</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                {searchQuery ? 'No results match your search parameters.' : 'No assignments have been actively engaged with yet.'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => window.location.href = "/teacher/lessons/create"}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-2xl h-14 px-10 font-bold"
                >
                  CREATE YOUR FIRST LESSON
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}