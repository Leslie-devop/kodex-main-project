import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import StudentDashboard from "@/pages/student/Dashboard";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import LessonCreate from "@/pages/teacher/LessonCreate";
import LessonManagement from "@/pages/teacher/LessonManagement";
import LessonAssign from "@/pages/teacher/LessonAssign";
import TeacherStudentProgress from "@/pages/teacher/StudentProgress";
import Reports from "@/pages/teacher/Reports";
import Students from "@/pages/teacher/Students";
import Assignments from "@/pages/teacher/Assignments";
import Classrooms from "@/pages/teacher/Classrooms";
import ClassroomDetails from "@/pages/teacher/ClassroomDetails";
import StudentLessons from "@/pages/student/Lessons";
import StudentProgress from "@/pages/student/Progress";
import StudentAnalytics from "@/pages/student/Analytics";
import LessonPractice from "@/pages/student/LessonPractice";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import ProfileSettings from "@/pages/ProfileSettings";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/landing" component={Landing} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/settings" component={ProfileSettings} />
      <Route path="/profile" component={ProfileSettings} />
      
      <Route path="/">
        {user?.role === "teacher" && <TeacherDashboard />}
        {user?.role === "student" && <StudentDashboard />}
        {!user?.role && <StudentDashboard />} {/* Default to student */}
      </Route>

      <Route path="/teacher/lessons/create">
        {user?.role === "teacher" ? <LessonCreate /> : <NotFound />}
      </Route>

      <Route path="/teacher/lessons/:id/assign">
        {user?.role === "teacher" ? <LessonAssign /> : <NotFound />}
      </Route>

      <Route path="/teacher/lessons">
        {user?.role === "teacher" ? <LessonManagement /> : <NotFound />}
      </Route>

      <Route path="/teacher/assignments">
        {user?.role === "teacher" ? <Assignments /> : <NotFound />}
      </Route>

      <Route path="/teacher/students">
        {user?.role === "teacher" ? <Students /> : <NotFound />}
      </Route>
      
      <Route path="/teacher/classrooms/:id">
        {user?.role === "teacher" ? <ClassroomDetails /> : <NotFound />}
      </Route>
      
      <Route path="/teacher/classrooms">
        {user?.role === "teacher" ? <Classrooms /> : <NotFound />}
      </Route>

      <Route path="/teacher/reports">
        {user?.role === "teacher" ? <Reports /> : <NotFound />}
      </Route>

      <Route path="/teacher/progress">
        {user?.role === "teacher" ? <TeacherStudentProgress /> : <NotFound />}
      </Route>

      <Route path="/teacher">
        {user?.role === "teacher" ? <TeacherDashboard /> : <NotFound />}
      </Route>

      <Route path="/student/lesson/:lessonId">
        <LessonPractice />
      </Route>

      <Route path="/student/lessons">
        <StudentLessons />
      </Route>

      <Route path="/student/progress">
        <StudentProgress />
      </Route>

      <Route path="/student/analytics">
        <StudentAnalytics />
      </Route>

      <Route path="/student">
        <StudentDashboard />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;