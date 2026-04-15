export interface TypingSessionData {
  id: string;
  currentWpm: number;
  accuracy: number;
  errors: number;
  timeSpent: number;
  timeRemaining: number;
  isActive: boolean;
  text: string;
  currentPosition: number;
  keystrokeData: KeystrokeEvent[];
}

export interface KeystrokeEvent {
  key: string;
  timestamp: number;
  correct: boolean;
  timingMs: number;
  finger?: string;
}

export interface DailyStats {
  todayWpm: number;
  todayAccuracy: number;
  sessionsToday: number;
  timeToday: number;
}

export interface WeeklyProgress {
  date: string;
  wpm: number;
  accuracy: number;
  timeSpent: number;
}

export interface StudentStats {
  avgWpm: number;
  avgAccuracy: number;
  totalSessions: number;
  totalTime: number;
  improvement: number;
}

export interface ErrorPattern {
  id: string;
  pattern: string;
  errorType: "swap" | "missing" | "extra" | "wrong";
  frequency: number;
  lastOccurrence: string;
}

export interface AISuggestion {
  id: string;
  type: "posture" | "technique" | "practice";
  content: string;
  priority: "low" | "medium" | "high";
  acknowledged: boolean;
  createdAt: string;
}

export interface LessonAssignment {
  id: string;
  lessonId: string;
  studentId: string;
  teacherId: string;
  lesson?: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
  };
  dueDate: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  progress: string;
  assignedAt: string;
  completedAt: string | null;
  maxAttempts: number;
  timeLimit: number | null;
  sessionCount?: number;
  feedback?: string;
  classroomId?: string;
}

export interface TypingActivity {
  id: string;
  lessonId: string | null;
  studentId: string;
  text: string;
  timeLimit: number | null;
  minAccuracy: string;
  minWpm: number | null;
  createdAt: string;
}

export interface SessionRequirements {
  minAccuracy: number;
  minWpm: number;
  timeLimit: number;
}
