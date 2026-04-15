import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Keyboard, Bell, ChevronDown, Settings, User, LogOut, Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import Navigation from "./Navigation";
import { Notification } from "@shared/schema";
import { format } from "date-fns";

export default function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "teacher":
        return "default";
      case "student":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000, // Poll every 10 seconds for real-time feel
    enabled: !!user,
  });

  const { theme, setTheme } = useTheme();
  
  // Safely handle notifications being an array
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const unreadNotifications = notificationsArray.filter(n => !n.isRead);
  const unreadCount = unreadNotifications.length;

  const handleNotificationClick = async (notification: Notification) => {
    // 1. Mark as read immediately in UI (optimistic)
    // Actually just trigger the mutation or simple fetch
    try {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }

    // 2. Redirect
    const { type, relatedId, classroomId } = notification;
    
    if (type === 'assignment_created') {
      if (classroomId) {
        setLocation(`/student/classrooms/${classroomId}?tab=assignments`);
      } else {
        setLocation('/student/assignments');
      }
    } else if (type === 'announcement_created') {
      if (classroomId) {
        setLocation(`/student/classrooms/${classroomId}?tab=announcements`);
      }
    } else if (type === 'lesson_created') {
      if (classroomId) {
        setLocation(`/student/classrooms/${classroomId}?tab=lessons`);
      } else {
        setLocation('/student/lessons');
      }
    } else if (type === 'module_uploaded') {
      if (classroomId) {
        setLocation(`/student/classrooms/${classroomId}?tab=modules`);
      }
    } else if (type === 'assignment_completed') {
      if (classroomId) {
        setLocation(`/teacher/classrooms/${classroomId}?tab=activities`);
      } else {
        setLocation('/teacher/reports');
      }
    } else if (type === 'feedback_received') {
      if (classroomId) {
        setLocation(`/student/classrooms/${classroomId}?tab=assignments`);
      } else {
        setLocation('/student/assignments');
      }
    } else if (type === 'classroom_deleted') {
      setLocation('/student/classrooms');
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return (
    <header className="bg-white/80 dark:bg-[#0f172a]/80 border-b border-gray-200 dark:border-white/5 backdrop-blur-2xl sticky top-0 z-50 py-1" data-testid="header-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6 group cursor-pointer" onClick={() => setLocation('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <Keyboard className="h-10 w-10 text-blue-600 dark:text-blue-400 relative z-10 drop-shadow-[0_0_10px_rgba(37,99,235,0.2)] dark:drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tighter">KODEX</h1>
              <div className="flex items-center mt-1">
                <div className="h-1 w-1 bg-blue-600 dark:bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Command Bridge</span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <Navigation />

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-all"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/5 rounded-xl transition-all"
                  data-testid="button-notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-[#0f172a] shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center justify-center text-[9px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white/95 dark:bg-[#0f172a]/95 border-gray-200 dark:border-white/10 backdrop-blur-3xl rounded-[1.5rem] p-3 shadow-xl dark:shadow-2xl">
                 <div className="flex items-center justify-between p-3 mb-2">
                   <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter text-sm">Notifications</h4>
                   {unreadCount > 0 && (
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="h-auto p-0 text-[10px] font-black uppercase text-blue-500 hover:text-blue-600 hover:bg-transparent tracking-widest"
                       onClick={(e) => {
                         e.stopPropagation();
                         markAllAsRead();
                       }}
                     >
                       Mark all read
                     </Button>
                   )}
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                   {unreadCount === 0 ? (
                     <div className="p-8 text-center">
                       <Bell className="h-8 w-8 text-gray-200 dark:text-white/5 mx-auto mb-3" />
                       <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Clear Signal</div>
                     </div>
                   ) : (
                     unreadNotifications.map((n) => (
                       <DropdownMenuItem 
                         key={n.id}
                         className="rounded-xl p-3 bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-100/50 dark:hover:bg-blue-500/10 focus:bg-blue-100/50 dark:focus:bg-blue-500/10 transition-all cursor-pointer border border-transparent hover:border-blue-500/20"
                         onClick={() => handleNotificationClick(n)}
                       >
                         <div className="flex flex-col gap-1">
                           <span className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
                             {n.message}
                           </span>
                           <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                             {format(new Date(n.createdAt!), 'h:mm a')}
                           </span>
                         </div>
                       </DropdownMenuItem>
                     ))
                   )}
                 </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/5 mx-2"></div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-4 p-2 pl-2 pr-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-blue-500/30 rounded-2xl transition-all"
                  data-testid="button-user-menu"
                >
                  <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full blur-md"></div>
                    <Avatar className="h-10 w-10 border border-gray-200 dark:border-white/10">
                      <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                      <AvatarFallback className="bg-blue-600 text-white font-black text-xs">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="hidden md:flex flex-col items-start translate-y-[1px]">
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      {user?.firstName || user?.username || "OPERATOR"}
                    </span>
                    <Badge className="h-4 p-0 px-2 text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 mt-1">
                      {user?.role?.toUpperCase() || "VISITOR"}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-72 bg-white dark:bg-[#0f172a]/95 border border-gray-100 dark:border-white/10 backdrop-blur-3xl rounded-[1.5rem] p-3 shadow-2xl">
                <div className="p-4 mb-2 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">{user?.firstName} {user?.lastName}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-1">{user?.email}</div>
                </div>
                
                <DropdownMenuItem 
                  className="rounded-xl p-3 focus:bg-gray-50 dark:focus:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 focus:text-slate-900 dark:focus:text-white transition-all cursor-pointer group"
                  onClick={() => setLocation('/profile')}
                  data-testid="menu-item-profile"
                >
                  <User className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-500 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest">Personnel Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="rounded-xl p-3 focus:bg-gray-50 dark:focus:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 focus:text-slate-900 dark:focus:text-white transition-all cursor-pointer group"
                  onClick={() => setLocation('/settings')}
                  data-testid="menu-item-settings"
                >
                  <Settings className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-500 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest">System Protocols</span>
                </DropdownMenuItem>
                
                <div className="h-[1px] bg-gray-100 dark:bg-white/5 my-2 mx-2"></div>

                <DropdownMenuItem 
                  className="rounded-xl p-3 focus:bg-red-500/10 hover:bg-red-500/10 text-gray-500 focus:text-red-400 transition-all cursor-pointer group"
                  onClick={async () => {
                    try {
                      await fetch('/api/logout', {
                        method: 'POST',
                        credentials: 'include'
                      });
                    } finally {
                      // Always redirect to login page after logout attempt
                      window.location.href = '/login';
                    }
                  }}
                  data-testid="menu-item-logout"
                >
                  <LogOut className="h-4 w-4 mr-3 text-red-500/60 group-hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
