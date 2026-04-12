import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypingSession } from "@/hooks/useTypingSession";

interface TypingSessionProps {
  lessonId?: string;
}

export default function TypingSession({ lessonId }: TypingSessionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [typedText, setTypedText] = useState("");
  
  // Fetch lesson data if lessonId is provided
  const { data: lesson } = useQuery<{ content?: string }>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
    retry: false,
  });
  
  const {
    sessionData,
    startSession,
    endSession,
    resetSession,
    updateTyping,
    isLoading,
    error
  } = useTypingSession({
    text: lesson?.content || "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for typing practice. It helps improve both speed and accuracy when learning to type. Regular practice with varied texts can significantly enhance your typing skills and build muscle memory for common letter combinations.",
    requirements: {
      minAccuracy: 85,
      minWpm: 60,
      timeLimit: 300 // 5 minutes default
    }
  });

  useEffect(() => {
    if (isInputFocused && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isInputFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setTypedText(newValue);
    
    // Update typing metrics without database calls for smooth performance
    if (sessionData && updateTyping) {
      updateTyping(newValue);
    }
  };

  const renderTextWithHighlights = () => {
    if (!sessionData?.text) return null;
    
    const text = sessionData.text;
    const typed = typedText;
    
    return (
      <div className="font-mono text-3xl leading-relaxed tracking-wider">
        {text.split("").map((char, index) => {
          const typedChar = typed[index];
          let className = "transition-all duration-150 ";
          
          if (index < typed.length) {
            if (typedChar === char) {
              className += "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]";
            } else {
              className += "text-red-500 bg-red-500/10 rounded px-0.5 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]";
            }
          } else if (index === typed.length) {
            className += "text-blue-400 border-b-2 border-blue-400 animate-pulse";
          } else {
            className += "text-white/20";
          }
          
          return (
            <span key={index} className={className}>
              {char === " " ? (index < typed.length ? " " : "·") : char}
            </span>
          );
        })}
      </div>
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracyStatus = () => {
    if (sessionData.accuracy >= 95) return "excellent";
    if (sessionData.accuracy >= 85) return "good";
    return "needs-improvement";
  };

  const getWpmStatus = () => {
    if (sessionData.currentWpm >= 80) return "excellent";
    if (sessionData.currentWpm >= 60) return "good";
    return "needs-improvement";
  };

  const handleContainerClick = () => {
    setIsInputFocused(true);
    if (!sessionData.isActive && typedText.length === 0) {
      startSession();
    }
  };

  const handleStartSession = () => {
    startSession();
    setIsInputFocused(true);
  };

  const handlePauseSession = () => {
    endSession();
  };

  const handleResetSession = () => {
    resetSession();
    setInputValue("");
    setTypedText("");
    setIsInputFocused(false);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem]">
          <CardContent className="p-12 text-center">
            <div className="animate-pulse space-y-8">
              <div className="h-8 bg-white/10 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
              <div className="h-48 bg-white/10 rounded-2xl"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <Card className="bg-red-500/5 border border-red-500/20 backdrop-blur-xl rounded-[2.5rem]">
          <CardContent className="p-12 text-center">
            <div className="text-red-400 font-bold mb-6 text-xl uppercase tracking-widest">Neural Link Failure</div>
            <p className="text-gray-400 mb-8">Failed to establish connection with the typing intelligence engine.</p>
            <Button onClick={handleResetSession} className="bg-red-500 hover:bg-red-600 rounded-xl px-10 h-14 font-black">REBOOT ENGINE</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden relative" data-testid="card-typing-session">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        
        <CardHeader className="p-10 pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black text-gray-400 uppercase tracking-[0.3em]">
              NEURAL TYPING INTERFACE v2.4
            </CardTitle>
            <div className="flex items-center space-x-4">
              {!sessionData.isActive ? (
                <Button 
                  onClick={handleStartSession}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 h-12 font-black tracking-widest text-xs"
                  data-testid="button-start-session"
                >
                  <Play className="h-4 w-4 mr-2" />
                  INITIALIZE
                </Button>
              ) : (
                <Button 
                  onClick={handlePauseSession}
                  className="bg-amber-600/10 text-amber-500 hover:bg-amber-600 hover:text-white border border-amber-500/20 rounded-xl px-6 h-12 font-black tracking-widest text-xs"
                  data-testid="button-pause-session"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  HALT
                </Button>
              )}
              <Button 
                onClick={handleResetSession}
                variant="ghost" 
                className="text-gray-500 hover:text-white hover:bg-white/5 rounded-xl px-6 h-12 font-black tracking-widest text-xs"
                data-testid="button-reset-session"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                REBOOT
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-10">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="relative group p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.05] transition-all">
              <div className="text-3xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" data-testid="text-current-wpm">
                {Math.round(sessionData.currentWpm) || 0}
              </div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Velocity (WPM)</div>
              <div className={`mt-3 text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block border ${
                getWpmStatus() === "excellent" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                getWpmStatus() === "good" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}>
                {getWpmStatus() === "excellent" ? "MACH SPEED" :
                 getWpmStatus() === "good" ? "STABLE" : "CALIBRATING"}
              </div>
            </div>
            
            <div className="relative group p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.05] transition-all">
              <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" data-testid="text-accuracy">
                {Math.round(sessionData.accuracy)}%
              </div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Precision %</div>
              <div className={`mt-3 text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block border ${
                getAccuracyStatus() === "excellent" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                getAccuracyStatus() === "good" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {getAccuracyStatus() === "excellent" ? "DEADLY" :
                 getAccuracyStatus() === "good" ? "OPTIMAL" : "SYN-ERR"}
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl font-black text-purple-400" data-testid="text-time-elapsed">
                {formatTime(sessionData.timeSpent || 0)}
              </div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Uptime</div>
              <div className="mt-3 flex items-center space-x-1">
                <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl font-black text-red-500" data-testid="text-errors">
                {sessionData.errors || 0}
              </div>
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Faults Detected</div>
              <div className={`mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden`}>
                <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (sessionData.errors || 0) * 5)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Transmission Status</span>
              <span className="text-sm font-black text-blue-400">{Math.round((typedText.length / (sessionData.text?.length || 1)) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(typedText.length / (sessionData.text?.length || 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Core Text Environment */}
          <div 
            ref={containerRef}
            className={cn(
              "min-h-[240px] p-12 bg-black/40 rounded-[2.5rem] border-2 transition-all duration-300 cursor-text select-none flex items-center justify-center text-center",
              isInputFocused ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-black/60" : "border-white/5"
            )}
            onClick={handleContainerClick}
            data-testid="text-display-area"
          >
            {renderTextWithHighlights()}
          </div>

          <input
            ref={(el) => isInputFocused && el?.focus()}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="opacity-0 absolute -z-10"
            onBlur={() => setIsInputFocused(false)}
            onFocus={() => setIsInputFocused(true)}
            data-testid="input-typing"
          />

          {/* Instructions Overlay */}
          <div className="text-center py-4 border-t border-white/5">
            <div className="inline-flex items-center px-4 py-2 bg-white/5 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest border border-white/10">
              {!sessionData.isActive ? 
                <><Play className="h-3 w-3 mr-2 text-blue-500 animate-pulse" /> ENGAGE INTERFACE TO START TRANSMISSION</> : 
                <><div className="h-2 w-2 bg-emerald-500 rounded-full mr-2 animate-ping" /> STREAMING NEURAL DATA</>
              }
            </div>
          </div>

          {/* Completion Protocol */}
          {typedText.length === sessionData.text?.length && sessionData.text && (
            <div className="mt-12 p-10 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-[3rem] animate-in zoom-in-95 duration-500">
              <h3 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tighter italic">Mission Accomplished 🎉</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                <div className="text-center">
                  <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Final Velocity</div>
                  <div className="text-2xl font-black text-white">{Math.round(sessionData.currentWpm)} WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Precision Rating</div>
                  <div className="text-2xl font-black text-white">{Math.round(sessionData.accuracy)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Engaged Time</div>
                  <div className="text-2xl font-black text-white">{formatTime(sessionData.timeSpent || 0)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Total Faults</div>
                  <div className="text-2xl font-black text-white">{sessionData.errors || 0}</div>
                </div>
              </div>
              <Button 
                onClick={handleResetSession}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl h-16 font-black text-lg shadow-xl shadow-emerald-500/20"
                data-testid="button-try-again"
              >
                RE-ENGAGE MISSION
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}