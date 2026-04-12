import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Award, 
  Plus, 
  Eye, 
  FileText, 
  BarChart3, 
  School,
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user has teacher role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role && user.role !== "teacher") {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [user, isAuthenticated, isLoading, toast]);

  // Fetch teacher dashboard data
  const { data: dashboardStats } = useQuery<any>({
    queryKey: ["/api/teacher/dashboard-stats"],
    retry: false,
  });

  const { data: assignments } = useQuery<any[]>({
    queryKey: ["/api/assignments/teacher"],
    retry: false,
  });

  const { data: classrooms } = useQuery<any[]>({
    queryKey: ["/api/classrooms"],
    retry: false,
  });

  const { data: progressData } = useQuery<any[]>({
    queryKey: ["/api/teacher/progress"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 font-bold">K</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "teacher") {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const stats = [
    { 
      label: "Total Students", 
      value: dashboardStats?.totalStudents || 0, 
      icon: Users, 
      color: "from-blue-500 to-cyan-400",
      description: "Registered students"
    },
    { 
      label: "Active Classrooms", 
      value: dashboardStats?.totalClassrooms || 0, 
      icon: School, 
      color: "from-purple-500 to-pink-500",
      description: "Current active rooms"
    },
    { 
      label: "Assignments", 
      value: (dashboardStats?.activeAssignments || 0) + (dashboardStats?.completedAssignments || 0), 
      icon: TrendingUp, 
      color: "from-orange-500 to-amber-400",
      description: "Total tasks created"
    },
    { 
      label: "Total Lessons", 
      value: dashboardStats?.totalLessons || 0, 
      icon: BookOpen, 
      color: "from-emerald-500 to-teal-400",
      description: "Lessons in library"
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-blue-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 relative"
        >
          <div className="absolute -left-4 top-0 w-1 h-full bg-blue-600 rounded-full"></div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Welcome back, {user?.firstName || "Teacher"}!
          </h2>
          <p className="text-gray-400 text-lg">Your command center for student typing excellence.</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-black/20 group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.label}</h3>
                    <div className="text-3xl font-bold tracking-tight text-white mb-1">
                      {stat.value}
                    </div>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Quick Actions - Bento Box Style */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Link href="/teacher/lessons/create">
              <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 cursor-pointer h-full border border-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                  <Plus size={120} />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Create Lesson</h3>
                    <p className="text-blue-100/70">Design unique typing experiences with custom content and constraints.</p>
                  </div>
                  <div className="mt-8 flex items-center text-sm font-bold bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-md">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/teacher/classrooms">
              <div className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl p-8 cursor-pointer h-full border border-white/10 hover:bg-white/10 transition-all">
                <div className="mb-4 p-3 rounded-2xl bg-purple-500/20 w-fit">
                  <School className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Manage Classrooms</h3>
                <p className="text-gray-400 text-sm mb-6">Organize your students into sections and monitor their combined progress.</p>
                <div className="mt-auto flex items-center text-purple-400 text-sm font-semibold">
                  View Classrooms <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link href="/teacher/reports">
              <div className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl p-8 cursor-pointer h-full border border-white/10 hover:bg-white/10 transition-all">
                <div className="mb-4 p-3 rounded-2xl bg-orange-500/20 w-fit">
                  <FileText className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Generate Reports</h3>
                <p className="text-gray-400 text-sm mb-6">Export detailed analytics for offline review and administrative use.</p>
                <div className="mt-auto flex items-center text-orange-400 text-sm font-semibold">
                  Export Data <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>

            <Link href="/teacher/students">
              <div className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-xl p-8 cursor-pointer h-full border border-white/10 hover:bg-white/10 transition-all">
                <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 w-fit">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Student Directory</h3>
                <p className="text-gray-400 text-sm mb-6">Search and manage individual student profiles and their status.</p>
                <div className="mt-auto flex items-center text-emerald-400 text-sm font-semibold">
                  View All Students <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Performance Summary Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Class Performance</CardTitle>
                  <BarChart3 className="h-5 w-5 text-gray-500" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {progressData && progressData.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
                        <div className="text-2xl font-bold text-blue-400">
                          {Math.round(progressData.reduce((sum, p) => sum + p.averageWpm, 0) / progressData.length) || 0}
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-blue-500/70 font-bold">Avg WPM</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-400">
                          {Math.round(progressData.reduce((sum, p) => sum + p.averageAccuracy, 0) / progressData.length) || 0}%
                        </div>
                        <p className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-bold">Avg Accuracy</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Completed Assignments</span>
                        <span className="text-emerald-400 font-bold">{progressData.filter(p => p.status === 'completed').length}</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${(progressData.filter(p => p.status === 'completed').length / progressData.length) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">In Progress</span>
                        <span className="text-blue-400 font-bold">{progressData.filter(p => p.status === 'in_progress').length}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-6 w-6 text-gray-600" />
                    </div>
                    <p className="text-gray-500 text-sm">No data collected yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Link href="/teacher/progress">
              <Button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold tracking-wide group">
                DETAILED ANALYTICS 
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Recent Rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <Clock className="mr-2 h-5 w-5 text-blue-500" /> 
                Recent Assignments
              </h3>
              <Link href="/teacher/assignments">
                <span className="text-sm text-blue-400 hover:underline cursor-pointer">See all</span>
              </Link>
            </div>
            <div className="space-y-3">
              {assignments && assignments.length > 0 ? (
                assignments.slice(0, 4).map((assignment) => (
                  <div key={assignment.id} className="group bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-white/[0.07] hover:border-white/20">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                        <FileText className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-blue-400 transition-colors">{assignment.lesson?.title || 'Unknown Lesson'}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-0.5">
                          {assignment.student ? `Student: ${assignment.student.firstName}` : assignment.classroom ? `Class: ${assignment.classroom.name}` : 'Individual'}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      assignment.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      assignment.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {assignment.status}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <p className="text-gray-500 font-medium">No recent assignments</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <School className="mr-2 h-5 w-5 text-purple-500" /> 
                Your Classrooms
              </h3>
              <Link href="/teacher/classrooms">
                <span className="text-sm text-purple-400 hover:underline cursor-pointer">Manage all</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {classrooms && classrooms.length > 0 ? (
                classrooms.slice(0, 4).map((room) => (
                  <div key={room.id} className="group bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.07] transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Users className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-bold text-white">{room.name}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-0.5">{room.section || 'No Section'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white hover:bg-white/10 rounded-xl">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center h-full flex flex-col items-center justify-center">
                  <p className="text-gray-500 mb-4 font-medium">No classrooms established</p>
                  <Link href="/teacher/classrooms">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white rounded-full px-6">
                      Establish First Room
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
