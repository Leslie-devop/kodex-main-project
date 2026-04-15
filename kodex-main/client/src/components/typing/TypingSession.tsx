import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Clock, CheckCircle2, ShieldCheck, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTypingSession } from "@/hooks/useTypingSession";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import FingerGuide from "./FingerGuide";

interface TypingSessionProps {
  lessonId?: string;
  assignmentId?: string;
  onStart?: () => void;
  timeLimit?: number; // In minutes
  allowBackspace?: boolean;
}

export default function TypingSession({ lessonId, assignmentId, onStart, timeLimit, allowBackspace: propAllowBackspace }: TypingSessionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Fetch lesson data if lessonId is provided
  const { data: lesson } = useQuery<{ content?: string, allowBackspace?: boolean }>({
    queryKey: ["/api/lessons", lessonId],
    enabled: !!lessonId,
    retry: false,
  });

  // Determine if backspace is allowed from prop (for assignments) or lesson data
  const finalAllowBackspace = propAllowBackspace !== undefined ? propAllowBackspace : (lesson?.allowBackspace ?? true);
  
   const {
    sessionData,
    inputValue,
    setInputValue,
    typedText,
    setTypedText,
    startSession,
    endSession,
    resetSession,
    updateTyping,
    hasStarted,
    isLoading,
    error
  } = useTypingSession({
    text: lesson?.content,
    lessonId,
    assignmentId,
    requirements: {
      minAccuracy: 85,
      minWpm: 60,
      timeLimit: timeLimit ? timeLimit * 60 : 300 // default to 5 minutes if not provided
    },
    onStart,
    allowBackspace: finalAllowBackspace
  });

  useEffect(() => {
    setIsInputFocused(true);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // If we are already typing in the input, don't do anything special
      if (isInputFocused) return;
      
      // If the session is already completed or inactive and has content, don't auto-start
      if (typedText.length === sessionData.text?.length && sessionData.text) return;

      // Only respond to single characters (letters, numbers, space, punctuation)
      // and only if no modifier keys (except Shift) are pressed
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        setIsInputFocused(true);
        
        // If session hasn't started yet, start it
        if (!sessionData.isActive && typedText.length === 0) {
          startSession();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isInputFocused, sessionData.isActive, sessionData.text, typedText.length, startSession]);

  useEffect(() => {
    if (isInputFocused && containerRef.current) {
      // Focus the hidden input more reliably
      const input = document.querySelector('[data-testid="input-typing"]') as HTMLInputElement;
      if (input) input.focus();
    }
  }, [isInputFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sessionData.isActive && typedText.length === 0 && lesson?.content) {
      startSession();
    }
    const newValue = e.target.value;
    
    // Update typing metrics without database calls for smooth performance
    if (sessionData && updateTyping) {
      updateTyping(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent backspace if not allowed
    if (e.key === 'Backspace' && !finalAllowBackspace) {
      e.preventDefault();
      return;
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
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
            className += "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 animate-pulse";
          } else {
            className += "text-slate-300 dark:text-white/20";
          }
          
          return (
            <span key={index} className={className}>
              {char === " " ? " " : char}
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
    if (!sessionData.isActive && typedText.length === 0 && lesson?.content) {
      startSession();
    }
  };

  const handleResetSession = () => {
    resetSession();
    setInputValue("");
    setTypedText("");
    setIsInputFocused(false);
  };

  if (isLoading && !hasStarted) {
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
      <Card className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 backdrop-blur-2xl rounded-[3rem] shadow-2xl dark:shadow-none overflow-hidden relative" data-testid="card-typing-session">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        
        <CardHeader className="p-10 pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-black text-slate-400 dark:text-gray-400 uppercase tracking-[0.3em]">
              NEURAL TYPING INTERFACE v2.4
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-gray-100 dark:border-white/5 text-slate-400 dark:text-gray-500 bg-gray-50 dark:bg-white/[0.02] px-4 py-1 h-8">
              {sessionData.isActive ? (
                <span className="flex items-center text-emerald-400">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  Uplink Active
                </span>
              ) : (
                <span className="flex items-center text-blue-500/60">
                  <div className="h-2 w-2 bg-blue-500/40 rounded-full mr-2" />
                  Uplink Standby
                </span>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-10 pt-0 space-y-10">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="relative group p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" data-testid="text-current-wpm">
                {Math.round(sessionData.currentWpm) || 0}
              </div>
              <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Velocity (WPM)</div>
              <div className={`mt-3 text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block border ${
                getWpmStatus() === "excellent" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                getWpmStatus() === "good" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}>
                {getWpmStatus() === "excellent" ? "MACH SPEED" :
                 getWpmStatus() === "good" ? "STABLE" : "CALIBRATING"}
              </div>
            </div>
            
            <div className="relative group p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" data-testid="text-accuracy">
                {Math.round(sessionData.accuracy)}%
              </div>
              <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Precision %</div>
              <div className={`mt-3 text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block border ${
                getAccuracyStatus() === "excellent" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                getAccuracyStatus() === "good" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {getAccuracyStatus() === "excellent" ? "DEADLY" :
                 getAccuracyStatus() === "good" ? "OPTIMAL" : "SYN-ERR"}
              </div>
            </div>

            <div className="relative group p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all">
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">
                {typedText.length}
              </div>
              <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Characters Typed</div>
              <div className="mt-3 text-[9px] font-black uppercase px-2 py-0.5 rounded inline-block border bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                LETTER COUNT
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400" data-testid="text-time-remaining">
                {formatTime(sessionData.timeRemaining || 0)}
              </div>
              <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Operational Time</div>
              <div className="mt-3 flex items-center space-x-1">
                <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                <div className="h-1 w-1 bg-purple-500 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
            
            <div className="p-6 rounded-3xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
              <div className="text-3xl font-black text-red-600 dark:text-red-500" data-testid="text-errors">
                {sessionData.errors || 0}
              </div>
              <div className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Faults Detected</div>
              <div className={`mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden`}>
                <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (sessionData.errors || 0) * 5)}%` }}></div>
              </div>
            </div>
          </div>

          {/* Finger Positioning Guide */}
          <FingerGuide currentChar={sessionData.text?.[typedText.length] || ""} />

          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em]">Transmission Status</span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">{Math.round((typedText.length / (sessionData.text?.length || 1)) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden border border-gray-200 dark:border-white/10 p-0.5">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${sessionData.text ? (typedText.length / sessionData.text.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Core Text Environment */}
          <div 
            ref={containerRef}
            className={cn(
              "min-h-[240px] p-12 bg-gray-50 dark:bg-black/40 rounded-[2.5rem] border-2 transition-all duration-300 cursor-text select-none flex items-center justify-center text-center",
              isInputFocused ? "border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-slate-100 dark:bg-black/60" : "border-gray-100 dark:border-white/5"
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
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className="opacity-0 absolute -z-10"
            onBlur={() => setIsInputFocused(false)}
            onFocus={() => setIsInputFocused(true)}
            disabled={!sessionData.isActive && (typedText.length > 0)}
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

          {/* Dynamic Full Screen Completion Protocol */}
          <AnimatePresence>
            {typedText.length === sessionData.text?.length && sessionData.text && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl px-6"
              >
                {/* Background Cinematic Glows */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0.2 }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  className="absolute w-full max-w-4xl aspect-square bg-blue-600 rounded-full blur-[160px] pointer-events-none"
                />
                <motion.div 
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 0.8, opacity: 0.2 }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
                  className="absolute w-full max-w-3xl aspect-square bg-emerald-500 rounded-full blur-[160px] pointer-events-none"
                />

                <div className="relative z-10 w-full max-w-2xl text-center space-y-12">
                  {/* Animated Trophy Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                    className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-white/20"
                  >
                    <Trophy className="h-16 w-16 text-white" />
                  </motion.div>

                  {/* Cinematic Title Area */}
                  <div className="space-y-4">
                    <motion.h2 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-6xl md:text-7xl font-black text-white italic tracking-tighter"
                    >
                      MISSION <span className="text-blue-500 underline decoration-indigo-500/30">COMPLETED</span>
                    </motion.h2 >
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      transition={{ delay: 0.6 }}
                      className="text-[10px] font-black uppercase tracking-[0.5em] text-white"
                    >
                      Neural Transmission Successful // Data Synchronized
                    </motion.p>
                  </div>

                  {/* Detailed Performance Statistics */}
                  <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-white/[0.03] border border-white/10 rounded-[2.5rem] backdrop-blur-md"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Final Velocity</span>
                      <div className="text-xl font-black text-white">{Math.round(sessionData.currentWpm)} WPM</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Accuracy</span>
                      <div className="text-xl font-black text-emerald-400">{Math.round(sessionData.accuracy)}%</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Uptime</span>
                      <div className="text-xl font-black text-blue-400">{formatTime(sessionData.timeSpent || 0)}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Faults</span>
                      <div className="text-xl font-black text-red-500">{sessionData.errors || 0}</div>
                    </div>
                  </motion.div>

                  {/* Strategic Action Interface */}
                  <motion.div 
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex flex-col md:flex-row gap-4 justify-center"
                  >
                    <Button 
                      onClick={handleResetSession}
                      className="h-14 px-10 bg-white text-black hover:bg-white/90 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                      Re-Engage Mission
                    </Button>
                    <Link to="/student/lessons">
                      <Button 
                        variant="ghost" 
                        className="h-14 px-10 text-white border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all hover:scale-105 active:scale-95"
                      >
                        Return to Mission Hub
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time Up Protocol */}
          {hasStarted && !sessionData.isActive && sessionData.timeRemaining === 0 && typedText.length < (sessionData.text?.length || 0) && (
            <div className="mt-12 p-10 bg-gradient-to-br from-red-500/10 to-amber-500/10 border-2 border-red-500/30 rounded-[3rem] animate-in zoom-in-95 duration-500">
              <h3 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tighter italic">Session Halted: Time Expired ⏳</h3>
              <p className="text-center text-gray-400 mb-8 uppercase text-xs font-black tracking-widest">The operational time limit has been reached. Data transmission auto-submitted.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                <div className="text-center">
                  <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mb-1">Last Velocity</div>
                  <div className="text-2xl font-black text-white">{Math.round(sessionData.currentWpm)} WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mb-1">Precision</div>
                  <div className="text-2xl font-black text-white">{Math.round(sessionData.accuracy)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mb-1">Progress</div>
                  <div className="text-2xl font-black text-white">{Math.round((typedText.length / (sessionData.text?.length || 1)) * 100)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-black text-red-500/60 uppercase tracking-widest mb-1">Faults</div>
                  <div className="text-2xl font-black text-white">{sessionData.errors || 0}</div>
                </div>
              </div>
              <Button 
                onClick={handleResetSession}
                className="w-full bg-red-600 hover:bg-red-500 text-white rounded-2xl h-16 font-black text-lg shadow-xl shadow-red-500/20"
                data-testid="button-try-again-timeout"
              >
                REBOOT & RETRY
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}