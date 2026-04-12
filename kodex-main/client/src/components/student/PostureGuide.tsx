import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PostureTutorial from "@/components/PostureTutorial";
import { CheckCircle, AlertTriangle, Play, Monitor, Hand, Eye } from "lucide-react";
import { useState } from "react";

export default function PostureGuide() {
  const [showTutorial, setShowTutorial] = useState(false);
  const postureChecks = [
    {
      id: "feet",
      title: "Feet Position",
      description: "Both feet flat on floor",
      status: "good",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      id: "wrists",
      title: "Wrist Position",
      description: "Keep wrists straight and floating",
      status: "warning",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      id: "back",
      title: "Back Position",
      description: "Straight with chair support",
      status: "good",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      id: "screen",
      title: "Screen Distance",
      description: "20-26 inches from eyes",
      status: "good",
      icon: <CheckCircle className="h-4 w-4" />,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "warning":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "error":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      default:
        return "text-gray-400 bg-white/5 border-white/10";
    }
  };

  const postureScore = postureChecks.filter(check => check.status === "good").length / postureChecks.length * 100;

  return (
    <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 pb-4 border-b border-white/5">
        <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-widest">
          Ergonomic Calibration
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Posture Score */}
        <div className="text-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-4xl font-black text-blue-400 mb-1 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" data-testid="posture-score">
            {Math.round(postureScore)}%
          </div>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Alignment Rating</div>
          <Badge 
            className={`mt-4 px-4 py-1 text-[9px] font-black uppercase tracking-widest border ${postureScore >= 75 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}`}
            data-testid="posture-status"
          >
            {postureScore >= 75 ? "OPTIMAL ALIGNMENT" : "RE-CALIBRATION REQ"}
          </Badge>
        </div>

        {/* Visual Guide */}
        <div className="text-center">
          <div className="bg-gradient-to-b from-blue-500/10 to-transparent rounded-3xl p-8 mb-4 border border-blue-500/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-50"></div>
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30 group-hover:scale-110 transition-transform duration-500">
              <Monitor className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Neural Terminal Alignment</div>
          </div>
        </div>

        {/* Posture Checklist */}
        <div className="space-y-6">
          {postureChecks.map((check, index) => (
            <div 
              key={check.id}
              className="flex items-center space-x-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
              data-testid={`posture-check-${index}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${getStatusColor(check.status)} shadow-lg`}>
                {check.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight" data-testid={`check-title-${index}`}>
                  {check.title}
                </div>
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-tighter" data-testid={`check-description-${index}`}>
                  {check.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
            <Hand className="h-4 w-4 mr-2" />
            Quick Tips
          </h4>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Keep shoulders relaxed and level</li>
            <li>• Position screen at eye level</li>
            <li>• Take breaks every 30 minutes</li>
            <li>• Use proper lighting to reduce eye strain</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-14 font-black tracking-widest text-xs shadow-lg shadow-emerald-500/10"
            data-testid="button-posture-tutorial"
            onClick={() => setShowTutorial(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            VIRTUAL TUTORIAL
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 rounded-xl h-14 border border-white/5"
            data-testid="button-ergonomics-tips"
            onClick={() => setShowTutorial(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            LIVE SCANNER ACTIVE
          </Button>
        </div>

        {/* Live Feedback */}
        <div className="text-center text-[9px] font-black text-gray-600 uppercase tracking-widest py-3 border-t border-white/5">
          Neural-Vision Link: Active
        </div>

        {/* Posture Tutorial Modal */}
        <PostureTutorial
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onStartDetection={() => {
            console.log("Posture detection started");
          }}
        />
      </CardContent>
    </Card>
  );
}
