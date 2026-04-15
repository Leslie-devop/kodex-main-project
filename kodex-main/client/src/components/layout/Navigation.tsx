import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const getNavigationItems = () => {
    const commonItems = [
      { path: "/", label: "Dashboard", testId: "nav-dashboard" },
    ];

    switch (user?.role) {
      case "teacher":
        return [
          { path: "/teacher", label: "Dashboard", testId: "nav-dashboard" },
          { path: "/teacher/classrooms", label: "Classrooms", testId: "nav-classrooms" },
          { path: "/teacher/lessons", label: "Lessons", testId: "nav-lessons" },
          { path: "/teacher/assignments", label: "Assignments", testId: "nav-assignments" },
          { path: "/teacher/students", label: "Students", testId: "nav-students" },
          { path: "/teacher/reports", label: "Reports", testId: "nav-reports" },
        ];

      case "student":
      default:
        return [
          ...commonItems,
          { path: "/student/lessons", label: "Lessons", testId: "nav-lessons" },
          { path: "/student/assignments", label: "Assignments", testId: "nav-assignments" },
          { path: "/student/progress", label: "Progress", testId: "nav-progress" },
          { path: "/student/analytics", label: "Analytics", testId: "nav-analytics" },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="hidden md:flex items-center space-x-8" data-testid="navigation-main">
      {navigationItems.map((item) => (
        <Link key={item.path} href={item.path}>
          <span
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 cursor-pointer py-2 border-b-2 border-transparent hover:text-blue-600 dark:hover:text-blue-400",
              location === item.path ? "text-blue-600 dark:text-blue-400 border-blue-500/50 shadow-[0_4px_12px_-4px_rgba(59,130,246,0.3)]" : "text-slate-500 dark:text-gray-500"
            )}
            data-testid={item.testId}
          >
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}