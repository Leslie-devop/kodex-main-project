import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface TypingAnalysis {
  wpm: number;
  accuracy: number;
  commonErrors: Array<{ pattern: string; frequency: number }>;
  slowKeys: string[];
  suggestions: string[];
}

export interface AISuggestionResponse {
  type: "posture" | "technique" | "practice";
  content: string;
  priority: "low" | "medium" | "high";
}

export class AIService {
  async analyzeTypingPatterns(
    studentId: string,
    sessionData: {
      wpm: number;
      accuracy: number;
      errors: number;
      keystrokeData?: any;
    }
  ): Promise<AISuggestionResponse[]> {
    try {
      // Get historical data for better analysis
      const errorPatterns = await storage.getErrorPatternsForStudent(studentId);
      const recentSessions = await storage.getSessionsForStudent(studentId);
      const keystrokeAnalytics = await storage.getKeystrokeAnalyticsForStudent(studentId);

      // Prepare analysis data
      const analysisData = {
        currentSession: sessionData,
        historicalPerformance: {
          averageWpm: recentSessions.length > 0 
            ? recentSessions.reduce((sum, s) => sum + Number(s.wpm || 0), 0) / recentSessions.length 
            : 0,
          averageAccuracy: recentSessions.length > 0 
            ? recentSessions.reduce((sum, s) => sum + Number(s.accuracy || 0), 0) / recentSessions.length 
            : 0,
          totalSessions: recentSessions.length,
        },
        commonErrors: errorPatterns.slice(0, 5).map(p => ({
          pattern: p.pattern,
          frequency: p.frequency,
          type: p.errorType,
        })),
        fingerPerformance: this.analyzeFingerPerformance(keystrokeAnalytics),
      };

      const prompt = `
        As a typing tutor AI, analyze the following typing data and provide specific, actionable suggestions to improve typing speed and accuracy:

        Current Session:
        - WPM: ${sessionData.wpm}
        - Accuracy: ${sessionData.accuracy}%
        - Errors: ${sessionData.errors}

        Historical Performance:
        - Average WPM: ${analysisData.historicalPerformance.averageWpm.toFixed(1)}
        - Average Accuracy: ${analysisData.historicalPerformance.averageAccuracy.toFixed(1)}%
        - Total Sessions: ${analysisData.historicalPerformance.totalSessions}

        Common Error Patterns:
        ${analysisData.commonErrors.map(e => `- ${e.pattern} (${e.frequency} times, type: ${e.type})`).join('\n')}

        Finger Performance Issues:
        ${analysisData.fingerPerformance.slowFingers.join(', ')}

        Based on this data, provide 2-3 specific suggestions for improvement. Focus on the most impactful areas.

        Respond in JSON format with an array of suggestions:
        {
          "suggestions": [
            {
              "type": "posture|technique|practice",
              "content": "Specific suggestion text",
              "priority": "low|medium|high"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert typing tutor AI. Provide specific, actionable advice to help students improve their typing skills. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];

    } catch (error) {
      console.error("Error analyzing typing patterns:", error);
      // Return fallback suggestions
      return [
        {
          type: "technique",
          content: "Focus on maintaining consistent rhythm while typing. Try using a metronome to keep steady timing.",
          priority: "medium"
        }
      ];
    }
  }

  async generatePostureSuggestions(
    sessionDuration: number,
    errorCount: number
  ): Promise<AISuggestionResponse[]> {
    try {
      const prompt = `
        Based on a typing session that lasted ${sessionDuration} seconds with ${errorCount} errors, 
        provide posture and ergonomic suggestions to improve typing comfort and reduce errors.

        Consider:
        - Session duration impact on posture
        - Error count suggesting possible posture issues
        - General ergonomic best practices

        Respond in JSON format:
        {
          "suggestions": [
            {
              "type": "posture",
              "content": "Specific posture suggestion",
              "priority": "low|medium|high"
            }
          ]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an ergonomics expert specializing in typing posture. Provide specific, actionable posture advice."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
      return result.suggestions || [];

    } catch (error) {
      console.error("Error generating posture suggestions:", error);
      return [
        {
          type: "posture",
          content: "Ensure your feet are flat on the floor and your wrists are straight while typing.",
          priority: "medium"
        }
      ];
    }
  }

  async predictPerformance(
    studentId: string,
    targetDays: number = 30
  ): Promise<{
    predictedWpm: number;
    predictedAccuracy: number;
    confidence: number;
  }> {
    try {
      const sessions = await storage.getSessionsForStudent(studentId);
      const recentSessions = sessions.slice(0, 10); // Last 10 sessions

      if (recentSessions.length < 3) {
        return {
          predictedWpm: 0,
          predictedAccuracy: 0,
          confidence: 0,
        };
      }

      const sessionData = recentSessions.map((s, index) => ({
        session: recentSessions.length - index,
        wpm: Number(s.wpm || 0),
        accuracy: Number(s.accuracy || 0),
      }));

      const prompt = `
        Based on the following typing session data, predict the student's WPM and accuracy after ${targetDays} days of continued practice:

        Recent Sessions (newest first):
        ${sessionData.map(s => `Session ${s.session}: ${s.wpm} WPM, ${s.accuracy}% accuracy`).join('\n')}

        Analyze the trend and provide realistic predictions assuming consistent practice.

        Respond in JSON format:
        {
          "predictedWpm": number,
          "predictedAccuracy": number,
          "confidence": number (0-100)
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a data analyst specializing in typing performance trends. Provide realistic predictions based on historical data."
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        predictedWpm: result.predictedWpm || 0,
        predictedAccuracy: result.predictedAccuracy || 0,
        confidence: result.confidence || 0,
      };

    } catch (error) {
      console.error("Error predicting performance:", error);
      return {
        predictedWpm: 0,
        predictedAccuracy: 0,
        confidence: 0,
      };
    }
  }

  private analyzeFingerPerformance(keystrokeData: any[]): {
    slowFingers: string[];
    fastFingers: string[];
  } {
    const fingerStats: Record<string, { total: number; avgTime: number }> = {};

    keystrokeData.forEach(k => {
      if (k.fingerUsed && k.timingMs) {
        if (!fingerStats[k.fingerUsed]) {
          fingerStats[k.fingerUsed] = { total: 0, avgTime: 0 };
        }
        fingerStats[k.fingerUsed].total++;
        fingerStats[k.fingerUsed].avgTime += k.timingMs;
      }
    });

    // Calculate averages
    Object.keys(fingerStats).forEach(finger => {
      fingerStats[finger].avgTime /= fingerStats[finger].total;
    });

    const fingerTimes = Object.entries(fingerStats).map(([finger, stats]) => ({
      finger,
      avgTime: stats.avgTime,
    }));

    fingerTimes.sort((a, b) => b.avgTime - a.avgTime);

    return {
      slowFingers: fingerTimes.slice(0, 2).map(f => f.finger),
      fastFingers: fingerTimes.slice(-2).map(f => f.finger),
    };
  }
}

export const aiService = new AIService();
