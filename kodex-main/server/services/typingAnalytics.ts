import { storage } from "../storage";
import { aiService } from "./aiService";

export interface TypingMetrics {
  wpm: number;
  accuracy: number;
  errors: number;
  timeSpent: number;
  keystrokeCount: number;
}

export interface ErrorAnalysis {
  pattern: string;
  frequency: number;
  errorType: "swap" | "missing" | "extra" | "wrong";
  suggestion: string;
}

export class TypingAnalyticsService {
  async processTypingSession(
    studentId: string,
    sessionId: string,
    keystrokeData: Array<{
      key: string;
      timestamp: number;
      correct: boolean;
      timingMs: number;
      finger?: string;
    }>,
    finalMetrics: TypingMetrics
  ): Promise<void> {
    try {
      // Store keystroke analytics
      for (const keystroke of keystrokeData) {
        await storage.createKeystrokeAnalytics({
          sessionId,
          studentId,
          keyPressed: keystroke.key,
          timingMs: keystroke.timingMs,
          wasError: !keystroke.correct,
          fingerUsed: keystroke.finger || this.detectFinger(keystroke.key),
        });
      }

      // Analyze error patterns
      const errorPatterns = this.analyzeErrorPatterns(keystrokeData);
      
      // Store error patterns
      for (const pattern of errorPatterns) {
        await storage.upsertErrorPattern({
          studentId,
          pattern: pattern.pattern,
          errorType: pattern.errorType,
          frequency: 1, // Will be incremented by upsert
        });
      }

      // Generate AI suggestions
      const suggestions = await aiService.analyzeTypingPatterns(studentId, {
        wpm: finalMetrics.wpm,
        accuracy: finalMetrics.accuracy,
        errors: finalMetrics.errors,
        keystrokeData,
      });

      // Store AI suggestions
      for (const suggestion of suggestions) {
        await storage.createAISuggestion({
          studentId,
          type: suggestion.type,
          content: suggestion.content,
          priority: suggestion.priority,
        });
      }

    } catch (error) {
      console.error("Error processing typing session:", error);
      throw error;
    }
  }

  private analyzeErrorPatterns(keystrokeData: Array<{
    key: string;
    timestamp: number;
    correct: boolean;
    timingMs: number;
  }>): Array<{
    pattern: string;
    errorType: "swap" | "missing" | "extra" | "wrong";
  }> {
    const patterns: Array<{
      pattern: string;
      errorType: "swap" | "missing" | "extra" | "wrong";
    }> = [];

    // Simple pattern detection
    for (let i = 0; i < keystrokeData.length - 1; i++) {
      const current = keystrokeData[i];
      const next = keystrokeData[i + 1];

      if (!current.correct) {
        // Detect common error types
        if (next.correct && current.key.length === 1 && next.key.length === 1) {
          // Possible character swap
          patterns.push({
            pattern: `${next.key}${current.key} → ${current.key}${next.key}`,
            errorType: "swap",
          });
        } else {
          // Wrong character
          patterns.push({
            pattern: `${current.key} → (wrong key)`,
            errorType: "wrong",
          });
        }
      }
    }

    return patterns;
  }

  private detectFinger(key: string): string {
    const fingerMap: Record<string, string> = {
      // Left hand
      'q': 'pinky', 'w': 'ring', 'e': 'middle', 'r': 'index', 't': 'index',
      'a': 'pinky', 's': 'ring', 'd': 'middle', 'f': 'index', 'g': 'index',
      'z': 'pinky', 'x': 'ring', 'c': 'middle', 'v': 'index', 'b': 'index',
      
      // Right hand
      'y': 'index', 'u': 'index', 'i': 'middle', 'o': 'ring', 'p': 'pinky',
      'h': 'index', 'j': 'index', 'k': 'middle', 'l': 'ring', ';': 'pinky',
      'n': 'index', 'm': 'index', ',': 'middle', '.': 'ring', '/': 'pinky',
      
      // Special keys
      ' ': 'thumb',
    };

    return fingerMap[key.toLowerCase()] || 'unknown';
  }

  async generateSessionReport(sessionId: string): Promise<{
    metrics: TypingMetrics;
    errorAnalysis: ErrorAnalysis[];
    fingersPerformance: Record<string, {
      accuracy: number;
      avgSpeed: number;
      keyCount: number;
    }>;
    improvements: string[];
  }> {
    try {
      const keystrokeData = await storage.getKeystrokeAnalyticsForSession(sessionId);
      
      if (keystrokeData.length === 0) {
        throw new Error("No keystroke data found for session");
      }

      // Calculate finger performance
      const fingerStats: Record<string, {
        correct: number;
        total: number;
        totalTime: number;
      }> = {};

      keystrokeData.forEach(k => {
        const finger = k.fingerUsed || 'unknown';
        if (!fingerStats[finger]) {
          fingerStats[finger] = { correct: 0, total: 0, totalTime: 0 };
        }
        
        fingerStats[finger].total++;
        fingerStats[finger].totalTime += k.timingMs || 0;
        
        if (!k.wasError) {
          fingerStats[finger].correct++;
        }
      });

      const fingersPerformance = Object.entries(fingerStats).reduce((acc, [finger, stats]) => {
        acc[finger] = {
          accuracy: (stats.correct / stats.total) * 100,
          avgSpeed: stats.totalTime / stats.total,
          keyCount: stats.total,
        };
        return acc;
      }, {} as Record<string, any>);

      // Calculate overall metrics
      const totalKeys = keystrokeData.length;
      const errors = keystrokeData.filter(k => k.wasError).length;
      const accuracy = ((totalKeys - errors) / totalKeys) * 100;
      const totalTime = keystrokeData.reduce((sum, k) => sum + (k.timingMs || 0), 0);
      const avgTimePerKey = totalTime / totalKeys;
      const wpm = totalKeys > 0 ? (totalKeys / 5) / (totalTime / 60000) : 0; // Assuming 5 chars per word

      return {
        metrics: {
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy * 100) / 100,
          errors,
          timeSpent: Math.round(totalTime / 1000), // Convert to seconds
          keystrokeCount: totalKeys,
        },
        errorAnalysis: [], // Would be populated with detailed error analysis
        fingersPerformance,
        improvements: [], // Would be populated with specific improvement suggestions
      };

    } catch (error) {
      console.error("Error generating session report:", error);
      throw error;
    }
  }

  async calculateDailyStats(studentId: string): Promise<{
    todayWpm: number;
    todayAccuracy: number;
    sessionsToday: number;
    improvementToday: number;
  }> {
    try {
      const allSessions = await storage.getSessionsForStudent(studentId);
      const now = new Date();
      
      // Today range
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      // Yesterday range
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayStart);

      const todaySessions = allSessions.filter(s => 
        s.completedAt && new Date(s.completedAt) >= todayStart && s.completed && (s.timeSpent || 0) > 0
      );

      const yesterdaySessions = allSessions.filter(s => 
        s.completedAt && 
        new Date(s.completedAt) >= yesterdayStart && 
        new Date(s.completedAt) < yesterdayEnd && 
        s.completed &&
        (s.timeSpent || 0) > 0
      );

      const todayBestWpm = todaySessions.length > 0 
        ? Math.max(...todaySessions.map(s => Number(s.wpm || 0))) 
        : 0;

      const todayBestAccuracy = todaySessions.length > 0 
        ? Math.max(...todaySessions.map(s => Number(s.accuracy || 0))) 
        : 0;

      const yesterdayBestWpm = yesterdaySessions.length > 0 
        ? Math.max(...yesterdaySessions.map(s => Number(s.wpm || 0))) 
        : 0;

      const improvement = todayBestWpm > 0 && yesterdayBestWpm > 0 
        ? todayBestWpm - yesterdayBestWpm 
        : 0;

      return {
        todayWpm: Math.round(todayBestWpm),
        todayAccuracy: Math.round(todayBestAccuracy),
        sessionsToday: todaySessions.length,
        improvementToday: Math.round(improvement),
      };

    } catch (error) {
      console.error("Error calculating daily stats:", error);
      return {
        todayWpm: 0,
        todayAccuracy: 0,
        sessionsToday: 0,
        improvementToday: 0,
      };
    }
  }
}

export const typingAnalyticsService = new TypingAnalyticsService();
