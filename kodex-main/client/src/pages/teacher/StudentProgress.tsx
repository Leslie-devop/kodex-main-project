import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Search, TrendingUp, Clock, Award, User, BarChart3, FileText, ArrowLeft } from "lucide-react";

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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch students with high frequency polling
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
    retry: false,
    refetchInterval: 10000,
  });

  // Fetch progress data with high frequency polling
  const { data: progressData, isLoading } = useQuery<ProgressData[]>({
    queryKey: ["/api/teacher/progress"],
    retry: false,
    refetchInterval: 10000,
  });

  if (!isAuthenticated || user?.role !== "teacher") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white flex items-center justify-center transition-colors">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">You don't have permission to access this page.</p>
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

  // Calculate overall stats with 2 decimal precision
  const totalAssignments = progressData?.length || 0;
  const completedAssignments = progressData?.filter(p => p.status === 'completed').length || 0;
  const averageWpm = progressData && progressData.length > 0 ? 
    (progressData.reduce((sum, p) => sum + p.averageWpm, 0) / progressData.length).toFixed(2) : "0.00";
  const averageAccuracy = progressData && progressData.length > 0 ? 
    (progressData.reduce((sum, p) => sum + p.averageAccuracy, 0) / progressData.length).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-blue-500/20 transition-colors">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="mb-12">
          <h2 className="text-4xl font-black tracking-tight mb-2 flex items-center uppercase italic tracking-tighter">
            <TrendingUp className="mr-4 h-10 w-10 text-blue-600 dark:text-blue-500" />
            Student Progress
          </h2>
          <p className="text-slate-500 dark:text-gray-400 font-semibold">Monitor student performance and track progress across all assignments.</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card data-testid="card-total-assignments" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                Total Assignments
              </CardTitle>
              <FileText className="h-4 w-4 text-slate-400 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {totalAssignments}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-completed" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                Completed
              </CardTitle>
              <Award className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-emerald-600">
                {completedAssignments}
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 uppercase font-bold tracking-tight">
                {totalAssignments > 0 ? ((completedAssignments / totalAssignments) * 100).toFixed(2) : "0.00"}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-wpm" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                Average WPM
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 flex items-center">
                {averageWpm} <span className="text-sm ml-2 text-slate-400">WPM</span>
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 uppercase font-bold tracking-tight">
                Fleet Velocity
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-average-accuracy" className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                Average Accuracy
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {averageAccuracy}%
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 uppercase font-bold tracking-tight">
                Typing accuracy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 pl-1">
          <div className="relative group max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input
              placeholder="Search students or lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 rounded-2xl focus:ring-blue-500/10 text-slate-900 dark:text-white font-bold shadow-sm"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Progress Data */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 h-32 rounded-[2rem] shadow-sm"></div>
            ))}
          </div>
        ) : filteredProgress.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredProgress.map((progress) => (
              <Card key={progress.id} className="bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all rounded-[2.5rem] shadow-sm dark:shadow-none group" data-testid={`card-progress-${progress.id}`}>
                <CardContent className="p-10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10 border-b border-gray-100 dark:border-white/5 pb-10">
                    <div className="flex items-center space-x-6">
                      <div className="h-20 w-20 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[1.75rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                          {progress.student?.firstName} {progress.student?.lastName}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1 bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-full border border-gray-100 dark:border-white/5 w-fit">{progress.student?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Velocity</div>
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                          {Number(progress.averageWpm).toFixed(2)} <span className="text-xs opacity-50">WPM</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Precision</div>
                        <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                          {Number(progress.averageAccuracy).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Engagements</div>
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                          {progress.completedSessions}<span className="text-sm opacity-50 ml-1">/ {progress.totalSessions}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Curriculum</span>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getDifficultyColor(progress.lesson?.difficulty || '')}`}>
                          {progress.lesson?.difficulty}
                        </div>
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white uppercase italic">{progress.lesson?.title}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Status</span>
                        <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${getStatusColor(progress.status)}`}>
                          {progress.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                          <div 
                            style={{ width: `${Math.min(100, Math.max(0, Number(progress.progress)))}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 dark:bg-blue-500 transition-all duration-700"
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{Number(progress.progress).toFixed(1)}% complete</p>
                           {progress.dueDate && (
                             <div className="flex items-center text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                               <Clock className="h-3 w-3 mr-2" />
                               Expires: {format(new Date(progress.dueDate), "MMM dd, yyyy")}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[4rem] text-center py-32 px-10 shadow-sm transition-all duration-500">
            <div className="bg-gray-50 dark:bg-white/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100 dark:border-white/10">
              <BarChart3 className="h-12 w-12 text-slate-300 dark:text-gray-700" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase italic">No Progress Detected</h3>
            <p className="text-slate-500 dark:text-gray-500 max-w-sm mx-auto mb-10 font-medium text-lg">
              {searchQuery ? 'Search criteria returned zero matched units.' : 'System baseline active. Awaiting student intelligence data.'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => navigate("/teacher/lessons/create")}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] h-16 px-12 font-black text-lg shadow-2xl shadow-blue-600/20 active:scale-95 transition-all"
              >
                DEPLOY INITIAL CURRICULUM
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}