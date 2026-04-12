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
import { Keyboard, Bell, ChevronDown, Settings, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import Navigation from "./Navigation";

export default function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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

  return (
    <header className="bg-[#0f172a]/80 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-50 py-1" data-testid="header-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-6 group cursor-pointer" onClick={() => setLocation('/')}>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <Keyboard className="h-10 w-10 text-blue-400 relative z-10 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white leading-none tracking-tighter">KODEX</h1>
              <div className="flex items-center mt-1">
                <div className="h-1 w-1 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Command Bridge</span>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <Navigation />

          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-6">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-[#0f172a] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
            </Button>
            
            <div className="h-8 w-[1px] bg-white/5 mx-2"></div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-4 p-2 pl-2 pr-4 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 rounded-2xl transition-all"
                  data-testid="button-user-menu"
                >
                  <div className="relative">
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/20 to-transparent rounded-full blur-md"></div>
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={user?.profileImageUrl || ""} alt="Profile" />
                      <AvatarFallback className="bg-blue-600 text-white font-black text-xs">
                        {getInitials(user?.firstName, user?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="hidden md:flex flex-col items-start translate-y-[1px]">
                    <span className="text-xs font-black text-white uppercase tracking-tight">
                      {user?.firstName || user?.username || "OPERATOR"}
                    </span>
                    <Badge className="h-4 p-0 px-2 text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-1">
                      {user?.role?.toUpperCase() || "VISITOR"}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent align="end" className="w-72 bg-[#0f172a]/95 border-white/10 backdrop-blur-3xl rounded-[1.5rem] p-3 shadow-2xl">
                <div className="p-4 mb-2 bg-white/5 rounded-2xl border border-white/5">
                  <div className="font-black text-white uppercase tracking-tighter text-sm">{user?.firstName} {user?.lastName}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{user?.email}</div>
                </div>
                
                <DropdownMenuItem 
                  className="rounded-xl p-3 focus:bg-white/5 hover:bg-white/5 text-gray-400 focus:text-white transition-all cursor-pointer group"
                  onClick={() => setLocation('/profile')}
                  data-testid="menu-item-profile"
                >
                  <User className="h-4 w-4 mr-3 text-blue-500 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest">Personnel Profile</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className="rounded-xl p-3 focus:bg-white/5 hover:bg-white/5 text-gray-400 focus:text-white transition-all cursor-pointer group"
                  onClick={() => setLocation('/settings')}
                  data-testid="menu-item-settings"
                >
                  <Settings className="h-4 w-4 mr-3 text-blue-500 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                  <span className="text-xs font-black uppercase tracking-widest">System Protocols</span>
                </DropdownMenuItem>
                
                <div className="h-[1px] bg-white/5 my-2 mx-2"></div>

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
