import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TypingSessionData, KeystrokeEvent, SessionRequirements } from "@/types";

interface UseTypingSessionOptions {
  text?: string;
  requirements?: SessionRequirements;
  onComplete?: (sessionData: TypingSessionData) => void;
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
    text: options.text || "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is commonly used for typing practice. It helps improve both speed and accuracy when learning to type.",
    currentPosition: 0,
    keystrokeData: [],
  });

  const [inputValue, setInputValue] = useState("");
  const [typedText, setTypedText] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const keystrokeBuffer = useRef<KeystrokeEvent[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current session
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
      toast({
        title: "Error",
        description: "Failed to create typing session",
        variant: "destructive",
      });
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
    // Reset everything first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const now = Date.now();
    setStartTime(now);
    setInputValue("");
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
  }, [sessionData.text, options.requirements, createSessionMutation]);

  const endSession = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSessionData(prev => ({ ...prev, isActive: false }));
    
    const finalData = {
      ...sessionData,
      isActive: false,
      completed: true,
      passed: options.requirements ? 
        sessionData.accuracy >= options.requirements.minAccuracy &&
        sessionData.currentWpm >= options.requirements.minWpm : true,
    };

    // Update session in backend
    if (sessionId) {
      updateSessionMutation.mutate({
        id: sessionId,
        data: {
          text: sessionData.text,
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
        sessionId,
        keystrokeData: keystrokeBuffer.current,
        finalMetrics: {
          wpm: finalData.currentWpm,
          accuracy: finalData.accuracy,
          errors: finalData.errors,
          timeSpent: finalData.timeSpent,
          keystrokeCount: keystrokeBuffer.current.length,
        },
      });
    }

    options.onComplete?.(finalData);
  }, [sessionData, sessionId, options, updateSessionMutation, submitAnalyticsMutation]);

  const updateTyping = useCallback((newInput: string) => {
    if (!sessionData.isActive || !startTime) return;

    const now = Date.now();
    const timeElapsed = now - startTime;
    const minutes = timeElapsed / 60000;

    // Calculate accurate typing metrics
    const targetText = sessionData.text;
    const correctChars = newInput.split('').reduce((count, char, index) => {
      if (index >= targetText.length) return count;
      return count + (char === targetText[index] ? 1 : 0);
    }, 0);

    const totalChars = Math.min(newInput.length, targetText.length);
    const errors = totalChars - correctChars;
    
    // WPM calculation: (correct characters / 5) / minutes
    const currentWpm = minutes > 0 && correctChars > 0 ? Math.round((correctChars / 5) / minutes) : 0;
    
    // Accuracy calculation: correct characters / total characters typed
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    // Update session data
    const updatedSessionData = {
      ...sessionData,
      currentWpm: Math.max(0, currentWpm),
      accuracy: Math.max(0, Math.min(100, accuracy)),
      errors: Math.max(0, errors),
      timeSpent: Math.round(timeElapsed / 1000),
      currentPosition: newInput.length,
    };

    setSessionData(updatedSessionData);
    setTypedText(newInput);
    setInputValue(newInput);

    // Only update database occasionally to avoid constant refreshes
    // Database will be updated on session end

    // Check if session is complete
    if (newInput.length >= targetText.length) {
      endSession();
    }
  }, [sessionData, sessionId, startTime, endSession]);

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
    isLoading: createSessionMutation.isPending || updateSessionMutation.isPending,
    error: createSessionMutation.error || updateSessionMutation.error,
  };
}
