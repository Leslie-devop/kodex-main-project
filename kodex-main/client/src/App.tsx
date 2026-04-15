import React from "react";
import { Switch, Route } from "wouter";
import { motion } from "framer-motion";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Landing from "@/pages/Landing";
import StudentDashboard from "@/pages/student/Dashboard";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import LessonCreate from "@/pages/teacher/LessonCreate";
import LessonEditor from "@/pages/teacher/LessonEditor";
import LessonManagement from "@/pages/teacher/LessonManagement";
import LessonAssign from "@/pages/teacher/LessonAssign";
import AssignmentCreate from "@/pages/teacher/AssignmentCreate";
import AssignmentEdit from "@/pages/teacher/AssignmentEdit";
import TeacherStudentProgress from "@/pages/teacher/StudentProgress";
import Reports from "@/pages/teacher/Reports";
import Students from "@/pages/teacher/Students";
import Assignments from "@/pages/teacher/Assignments";
import Classrooms from "@/pages/teacher/Classrooms";
import ClassroomDetails from "@/pages/teacher/ClassroomDetails";
import StudentClassroomDetails from "@/pages/student/ClassroomDetails";
import ClassroomSettings from "@/pages/teacher/ClassroomSettings";
import StudentLessons from "@/pages/student/Lessons";
import StudentAssignments from "@/pages/student/Assignments";
import StudentProgress from "@/pages/student/Progress";
import StudentAnalytics from "@/pages/student/Analytics";
import LessonPractice from "@/pages/student/LessonPractice";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import ProfileSettings from "@/pages/ProfileSettings";
import VerifyOTP from "@/pages/VerifyOTP";
import Permissions from "@/pages/Permissions";
import AuthMethods from "@/pages/AuthMethods";
import MobileVerify from "@/pages/MobileVerify";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500">
        <div className="relative mb-12">
          {/* Outermost rapid spin */}
          <div className="h-32 w-32 rounded-full border-t-2 border-blue-600 dark:border-blue-500 animate-[spin_0.8s_linear_infinite]"></div>
          {/* Inner contrary spin */}
          <div className="absolute inset-2 h-28 w-28 rounded-full border-b-2 border-emerald-600 dark:border-emerald-500 animate-[spin_0.5s_linear_infinite_reverse] opacity-50"></div>
          {/* Core pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-4 bg-blue-600 dark:bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)] dark:shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 w-64">
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-600 dark:text-blue-500/80">
            Establishing <span className="text-slate-900 dark:text-white">Neural Link</span>
          </div>
        </div>
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
      <Route path="/mobile-verify" component={MobileVerify} />
      <Route path="/auth-methods" component={AuthMethods} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/settings" component={ProfileSettings} />
      <Route path="/profile" component={ProfileSettings} />
      <Route path="/profile" component={ProfileSettings} />
      <Route path="/permissions" component={Permissions} />
      
      <Route path="/">
        {!user?.isVerified ? <VerifyOTP /> : (
          !user?.hasConsent ? <Permissions /> : (
            !user?.role ? <Onboarding /> : (
              user.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />
            )
          )
        )}
      </Route>

      <Route path="/teacher/lessons/create">
        {user?.role === "teacher" ? <LessonCreate /> : <NotFound />}
      </Route>

      <Route path="/teacher/lessons/:id/edit">
        {user?.role === "teacher" ? <LessonEditor /> : <NotFound />}
      </Route>

      <Route path="/teacher/lessons/:id/assign">
        {user?.role === "teacher" ? <LessonAssign /> : <NotFound />}
      </Route>

      <Route path="/teacher/lessons">
        {user?.role === "teacher" ? <LessonManagement /> : <NotFound />}
      </Route>

      <Route path="/teacher/assignments/create">
        {user?.role === "teacher" ? <AssignmentCreate /> : <NotFound />}
      </Route>

      <Route path="/teacher/assignments/:id/edit">
        {user?.role === "teacher" ? <AssignmentEdit /> : <NotFound />}
      </Route>

      <Route path="/teacher/assignments">
        {user?.role === "teacher" ? <Assignments /> : <NotFound />}
      </Route>

      <Route path="/teacher/students">
        {user?.role === "teacher" ? <Students /> : <NotFound />}
      </Route>
      
      <Route path="/teacher/classrooms/:id/settings">
        {user?.role === "teacher" ? <ClassroomSettings /> : <NotFound />}
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

      <Route path="/student/lesson/:lessonId/:assignmentId?">
        {(params) => <LessonPractice lessonId={params.lessonId} assignmentId={params.assignmentId} />}
      </Route>

      <Route path="/student/lessons">
        <StudentLessons />
      </Route>

      <Route path="/student/assignments">
        <StudentAssignments />
      </Route>

      <Route path="/student/progress">
        <StudentProgress />
      </Route>

      <Route path="/student/analytics">
        <StudentAnalytics />
      </Route>

      <Route path="/student/classrooms/:id">
        {user?.role === "student" ? <StudentClassroomDetails /> : <NotFound />}
      </Route>

      <Route path="/student">
        <StudentDashboard />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

const AppContent = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;