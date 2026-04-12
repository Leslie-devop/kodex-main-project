import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  BarChart3, 
  Download, 
  Settings, 
  BookOpen, 
  Target,
  Award,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function QuickActions() {
  const { user } = useAuth();

  const getActionsForRole = () => {
    switch (user?.role) {
      case "teacher":
        return [
          {
            icon: <BookOpen className="h-6 w-6" />,
            label: "Create Lesson",
            description: "Design new typing exercises",
            testId: "action-create-lesson",
          },
          {
            icon: <Target className="h-6 w-6" />,
            label: "Assign Tasks",
            description: "Give lessons to students",
            testId: "action-assign-tasks",
          },
          {
            icon: <BarChart3 className="h-6 w-6" />,
            label: "Student Progress",
            description: "Monitor class performance",
            testId: "action-student-progress",
          },
          {
            icon: <Download className="h-6 w-6" />,
            label: "Export Reports",
            description: "Download class analytics",
            testId: "action-export-reports",
          },
        ];

      case "student":
      default:
        return [
          {
            icon: <Play className="h-6 w-6" />,
            label: "Start Practice",
            description: "Begin a new typing session",
            testId: "action-start-practice",
          },
          {
            icon: <BarChart3 className="h-6 w-6" />,
            label: "View Reports",
            description: "Check your progress analytics",
            testId: "action-view-reports",
          },
          {
            icon: <Download className="h-6 w-6" />,
            label: "Export Data",
            description: "Download your typing data",
            testId: "action-export-data",
          },
          {
            icon: <Settings className="h-6 w-6" />,
            label: "Settings",
            description: "Customize your preferences",
            testId: "action-settings",
          },
        ];
    }
  };

  const actions = getActionsForRole();

  const handleActionClick = (testId: string) => {
    // Handle different actions based on testId
    switch (testId) {
      case "action-start-practice":
        // Focus on typing session or start new one
        const typingArea = document.querySelector('[data-testid="typing-area"]');
        if (typingArea) {
          typingArea.scrollIntoView({ behavior: 'smooth' });
          const textarea = document.querySelector('textarea');
          if (textarea) {
            setTimeout(() => textarea.focus(), 500);
          }
        }
        break;
      
      case "action-export-data":
        // Trigger CSV export
        const csvButton = document.querySelector('[data-testid="button-export-csv"]') as HTMLButtonElement;
        if (csvButton) {
          csvButton.click();
        }
        break;
        
      default:
        // For other actions, you could implement navigation or modal opening
        console.log(`Action clicked: ${testId}`);
    }
  };

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-white/5">
        <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">
          Quick Access Terminals
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleActionClick(action.testId)}
              className="flex flex-col items-center space-y-4 p-8 h-auto bg-white/[0.02] border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-300 group rounded-[2rem]"
              data-testid={action.testId}
            >
              <div className="text-gray-500 group-hover:text-blue-400 transition-colors drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                {action.icon}
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest">
                  {action.label}
                </div>
                {action.description && (
                  <div className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Role-specific additional info */}
        {user?.role === "student" && (
          <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center space-x-6">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Award className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Mission Objective</div>
              <div className="text-sm font-bold text-white leading-relaxed">
                Maintain activity for 30 minutes to achieve <span className="text-emerald-400">Class-A Synchronicity</span>.
              </div>
            </div>
          </div>
        )}

        {user?.role === "teacher" && (
          <div className="mt-8 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center space-x-6">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Command Update</div>
              <div className="text-sm font-bold text-white leading-relaxed">
                3 students successfully synchronized their neural links this week.
              </div>
            </div>
          </div>
        )}


      </CardContent>
    </Card>
  );
}
