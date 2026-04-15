import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TypingSessionData, KeystrokeEvent, SessionRequirements } from "@/types";

interface UseTypingSessionOptions {
  text?: string;
  lessonId?: string;
  assignmentId?: string;
  requirements?: SessionRequirements;
  onComplete?: (sessionData: TypingSessionData) => void;
  onStart?: () => void;
  allowBackspace?: boolean;
}

export function useTypingSession(options: UseTypingSessionOptions = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sessionData, setSessionData] = useState<TypingSessionData>({
    id: "",
    currentWpm: 0,
    accuracy: 100,
    errors: 0,
    timeSpent: 0,
    timeRemaining: 0,
    isActive: false,
    text: options.text || "",
    currentPosition: 0,
    keystrokeData: [],
  });

  const [hasStarted, setHasStarted] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const keystrokeBuffer = useRef<KeystrokeEvent[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionDataRef = useRef<TypingSessionData>(sessionData);
  const finalDataRef = useRef<TypingSessionData | null>(null);

  // Keep ref in sync
  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

  // Sync text when options.text changes
  useEffect(() => {
    if (options.text && !hasStarted) {
      setSessionData(prev => ({ ...prev, text: options.text || "" }));
    }
  }, [options.text, hasStarted]);

  // Sync initial time limit
  useEffect(() => {
    if (options.requirements?.timeLimit && !hasStarted) {
      setSessionData(prev => ({ ...prev, timeRemaining: options.requirements!.timeLimit! }));
    }
  }, [options.requirements?.timeLimit, hasStarted]);
  const { data: currentSession } = useQuery({
    queryKey: ["/api/sessions/current"],
    retry: false,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/sessions", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error: any) => {
      console.error("Failed to create typing session:", error);
      if (isUnauthorizedError(error as Error)) {
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
      
      const errorMessage = error.message || "";
      if (errorMessage.includes("Maximum attempt") || errorMessage.includes("limit reached")) {
        setSessionData(prev => ({ 
          ...prev, 
          isActive: false,
          error: "Maximum attempts reached for this mission. Please consult your instructor for recalibration."
        }));
        
        toast({
          title: "Deployment Halted",
          description: "Maximum attempts reached for this mission.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Neural Link Failure",
          description: "Failed to establish typing session. Please retry.",
          variant: "destructive",
        });
      }
    },
  });

  // Update session mutation (only used when needed, not on every keystroke)
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PUT", `/api/sessions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      // Only invalidate on completion, not during typing
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      console.error("Failed to update session:", error);
    },
  });

  // Submit analytics mutation
  const submitAnalyticsMutation = useMutation({
    mutationFn: async ({ sessionId, keystrokeData, finalMetrics }: {
      sessionId: string;
      keystrokeData: KeystrokeEvent[];
      finalMetrics: any;
    }) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/analytics`, {
        keystrokeData,
        finalMetrics,
      });
      return response.json();
    },
    onError: (error) => {
      console.error("Failed to submit analytics:", error);
    },
  });

  const calculateWPM = useCallback((charactersTyped: number, timeElapsed: number) => {
    if (timeElapsed === 0) return 0;
    const minutes = timeElapsed / 60000;
    const words = charactersTyped / 5; // Standard: 5 characters = 1 word
    return Math.round(words / minutes);
  }, []);

  const calculateAccuracy = useCallback((correct: number, total: number) => {
    if (total === 0) return 100;
    return Math.round((correct / total) * 100);
  }, []);

  const startSession = useCallback(() => {
    // Prevent starting with empty text
    if (!sessionDataRef.current.text || sessionDataRef.current.text.trim() === "") {
      return;
    }

    // Prevent double starting
    if (sessionDataRef.current.isActive) {
      return;
    }

    // Reset everything first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Immediately set ref to prevent concurrent calls from rapid typing
    sessionDataRef.current = { ...sessionDataRef.current, isActive: true };
    
    const now = Date.now();
    setStartTime(now);
    setInputValue("");
    setHasStarted(true);
    keystrokeBuffer.current = [];
    
    setSessionData(prev => ({ 
      ...prev, 
      isActive: true,
      currentWpm: 0,
      accuracy: 100,
      errors: 0,
      timeSpent: 0,
      timeRemaining: options.requirements?.timeLimit || 0,
      currentPosition: 0,
    }));
    
    // Create session in backend
    createSessionMutation.mutate({
      activityId: null,
      lessonId: options.lessonId,
      assignmentId: options.assignmentId,
      text: sessionData.text,
      timeLimit: options.requirements?.timeLimit || null,
      minAccuracy: options.requirements?.minAccuracy ? options.requirements.minAccuracy.toString() : "85.00",
      minWpm: options.requirements?.minWpm || 60,
    });

    // Start timer
    timerRef.current = setInterval(() => {
      setSessionData(prev => {
        if (!prev.isActive) return prev;
        
        const timeElapsed = Date.now() - now;
        const timeSpent = Math.round(timeElapsed / 1000);
        const timeRemaining = options.requirements?.timeLimit ? 
          Math.max(0, options.requirements.timeLimit - timeSpent) : 0;

        return {
          ...prev,
          timeSpent,
          timeRemaining,
        };
      });
    }, 1000);
    options.onStart?.();
  }, [sessionData.text, options.requirements, createSessionMutation, options.onStart]);

  const [isPendingSubmission, setIsPendingSubmission] = useState(false);

  const performSubmission = useCallback((id: string, currentSessionData?: TypingSessionData) => {
    const dataToUse = currentSessionData || finalDataRef.current || sessionDataRef.current;
    
    const finalData = {
      ...dataToUse,
      isActive: false,
      completed: true,
      passed: options.requirements ? 
        dataToUse.accuracy >= options.requirements.minAccuracy &&
        dataToUse.currentWpm >= options.requirements.minWpm : true,
    };

    // Update session in backend
    updateSessionMutation.mutate({
      id,
      data: {
        text: dataToUse.text,
        wpm: finalData.currentWpm,
        accuracy: finalData.accuracy,
        errors: finalData.errors,
        timeSpent: finalData.timeSpent,
        completed: true,
        passed: finalData.passed,
        keystrokeData: keystrokeBuffer.current,
        completedAt: new Date().toISOString(),
      },
    });
    
    // Refresh stats after session completion
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });

    // Submit analytics
    submitAnalyticsMutation.mutate({
      sessionId: id,
      keystrokeData: keystrokeBuffer.current,
      finalMetrics: {
        wpm: finalData.currentWpm,
        accuracy: finalData.accuracy,
        errors: finalData.errors,
        timeSpent: finalData.timeSpent,
        keystrokeCount: keystrokeBuffer.current.length,
      },
    });

    options.onComplete?.(finalData);
  }, [options, updateSessionMutation, submitAnalyticsMutation, queryClient]);

  const endSession = useCallback((forceData?: TypingSessionData) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const dataToUse = forceData || sessionDataRef.current;
    finalDataRef.current = dataToUse;
    
    setSessionData(prev => ({ ...prev, ...dataToUse, isActive: false }));
    
    if (sessionId) {
      performSubmission(sessionId, dataToUse);
    } else {
      setIsPendingSubmission(true);
    }
  }, [sessionId, performSubmission]);

  // Effect to handle delayed submission once sessionId is available
  useEffect(() => {
    if (sessionId && isPendingSubmission && finalDataRef.current) {
      performSubmission(sessionId, finalDataRef.current);
      setIsPendingSubmission(false);
    }
  }, [sessionId, isPendingSubmission, performSubmission]);

  const updateTyping = useCallback((newInput: string) => {
    const previousLength = typedText.length;
    
    // Enforcement: If backspace is not allowed, reject any input that is shorter than previous
    if (options.allowBackspace === false && newInput.length < previousLength) {
      setInputValue(typedText);
      return;
    }

    // Current target text
    const targetText = sessionData.text || "";
    
    // Always sync the input value immediately
    setInputValue(newInput);
    
    let effectiveStartTime = startTime;
    let currentNow = Date.now();

    let isJustStarting = false;
    // If session hasn't started, start it on first input
    if ((!sessionDataRef.current.isActive || !startTime) && newInput.length > 0) {
      startSession();
      effectiveStartTime = currentNow;
      setTypedText(newInput);
      isJustStarting = true;
    }

    if (!sessionDataRef.current.isActive && !isJustStarting && newInput.length > 0) {
      return;
    } else if (!sessionDataRef.current.isActive && !startTime && !isJustStarting) {
      return;
    }

    const now = currentNow;
    const finalStartTime = effectiveStartTime || now;
    const timeElapsed = now - finalStartTime;
    const minutes = timeElapsed / 60000;

    // Calculate accurate typing metrics
    const correctChars = newInput.split('').reduce((count, char, index) => {
      if (index >= targetText.length) return count;
      return count + (char === targetText[index] ? 1 : 0);
    }, 0);

    const totalChars = Math.min(newInput.length, targetText.length);
    const errors = totalChars - correctChars;
    
    // Log the new keystroke
    if (newInput.length > previousLength) {
      const addedChar = newInput[newInput.length - 1];
      const expectedChar = targetText[previousLength];
      const isCorrect = addedChar === expectedChar;
      
      keystrokeBuffer.current.push({
        key: addedChar,
        timestamp: now,
        correct: isCorrect,
        timingMs: keystrokeBuffer.current.length > 0 ? 
          now - keystrokeBuffer.current[keystrokeBuffer.current.length - 1].timestamp : 0,
      });
    }

    // WPM calculation: (correct characters / 5) / minutes
    const currentWpm = minutes > 0 && correctChars > 0 ? Math.round((correctChars / 5) / minutes) : 0;
    
    // Accuracy calculation: correct characters / total characters typed
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    // Update session data
    const updatedSessionData = {
      ...sessionDataRef.current,
      isActive: isJustStarting ? true : sessionDataRef.current.isActive,
      currentWpm: Math.max(0, currentWpm),
      accuracy: Math.max(0, Math.min(100, accuracy)),
      errors: Math.max(0, errors),
      timeSpent: Math.round(timeElapsed / 1000),
      currentPosition: newInput.length,
    };

    sessionDataRef.current = updatedSessionData;
    setSessionData(updatedSessionData);
    setTypedText(newInput);
    setInputValue(newInput);

    // Only update database occasionally to avoid constant refreshes
    // Database will be updated on session end

    // Check if session is complete
    if (newInput.length >= targetText.length) {
      endSession(updatedSessionData);
    }
  }, [sessionId, startTime, endSession, startSession, options.allowBackspace, sessionData.text, typedText.length]);

  const handleKeyPress = useCallback((key: string, correct: boolean) => {
    if (!sessionData.isActive || !startTime) return;

    const now = Date.now();
    const keystroke: KeystrokeEvent = {
      key,
      timestamp: now,
      correct,
      timingMs: keystrokeBuffer.current.length > 0 ? 
        now - keystrokeBuffer.current[keystrokeBuffer.current.length - 1].timestamp : 0,
    };

    keystrokeBuffer.current.push(keystroke);

    setSessionData(prev => {
      const timeElapsed = now - startTime;
      const totalKeystrokes = keystrokeBuffer.current.length;
      const correctKeystrokes = keystrokeBuffer.current.filter(k => k.correct).length;
      const errors = totalKeystrokes - correctKeystrokes;
      
      // Improved WPM calculation - use total characters typed, not just correct ones
      const currentWpm = timeElapsed > 0 ? calculateWPM(totalKeystrokes, timeElapsed) : 0;
      const accuracy = calculateAccuracy(correctKeystrokes, totalKeystrokes);

      return {
        ...prev,
        currentWpm,
        accuracy,
        errors,
        currentPosition: totalKeystrokes,
      };
    });
  }, [sessionData.isActive, startTime, calculateWPM, calculateAccuracy]);

  const resetSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSessionData(prev => ({
      ...prev,
      currentWpm: 0,
      accuracy: 100,
      errors: 0,
      timeSpent: 0,
      timeRemaining: options.requirements?.timeLimit || 0,
      isActive: false,
      currentPosition: 0,
      keystrokeData: [],
    }));
    
    setInputValue("");
    setTypedText("");
    setStartTime(null);
    setSessionId(null);
    keystrokeBuffer.current = [];
  }, [options.requirements]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-end session when time limit reached
  useEffect(() => {
    if (options.requirements?.timeLimit && 
        sessionData.timeRemaining === 0 && 
        sessionData.isActive) {
      endSession();
    }
  }, [sessionData.timeRemaining, sessionData.isActive, options.requirements, endSession]);

  return {
    sessionData,
    inputValue,
    setInputValue,
    typedText,
    setTypedText,
    startSession,
    endSession,
    resetSession,
    updateTyping,
    handleKeyPress,
    hasStarted,
    isLoading: createSessionMutation.isPending || updateSessionMutation.isPending,
    error: createSessionMutation.error || updateSessionMutation.error,
  };
}
