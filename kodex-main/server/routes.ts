import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated, requireRole } from "./localAuth";
import { registerAuthRoutes } from "./authRoutes";
import { setupGoogleAuth } from "./googleAuth";
import { typingAnalyticsService } from "./services/typingAnalytics";
import { aiService } from "./services/aiService";
import {
  insertLessonSchema,
  insertLessonAssignmentSchema,
  insertTypingActivitySchema,
  insertTypingSessionSchema,
  insertClassroomSchema,
  insertClassroomStudentSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupLocalAuth(app);
  setupGoogleAuth(app);

  // Register auth routes
  registerAuthRoutes(app);





  // User management routes are now in authRoutes.ts

  // Lesson management routes
  app.get('/api/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const lessons = await storage.getLessons();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post('/api/lessons', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const lessonData = insertLessonSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const lesson = await storage.createLesson(lessonData);
      res.json(lesson);
    } catch (error) {
      res.status(400).json({ message: "Failed to create lesson", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/lessons/:id', isAuthenticated, async (req, res) => {
    try {
      const lesson = await storage.getLessonById(req.params.id);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.delete('/api/lessons/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;


      await storage.deleteLessson(req.params.id);
      res.json({ message: "Lesson deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  app.put('/api/lessons/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const lessonId = req.params.id;

      const lesson = await storage.updateLesson(lessonId, req.body);
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  // Lesson assignment routes
  app.get('/api/assignments/student', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignments = await storage.getAssignmentsForStudent(userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get('/api/assignments/teacher', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignments = await storage.getAssignmentsForTeacher(userId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post('/api/assignments', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const assignmentData = insertLessonAssignmentSchema.parse({
        ...req.body,
        teacherId: userId,
      });

      const assignment = await storage.createAssignment(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create assignment", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete('/api/assignments/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      await storage.deleteAssignment(req.params.id);
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Typing activity routes
  app.post('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activityData = insertTypingActivitySchema.parse({
        ...req.body,
        studentId: userId,
      });

      const activity = await storage.createTypingActivity(activityData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ message: "Failed to create activity", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/activities/student', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const activities = await storage.getTypingActivitiesForStudent(userId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Teacher-specific student management routes
  app.get('/api/teacher/students', requireRole(['teacher']), async (req: any, res) => {
    try {
      const students = await storage.getAllUsers();
      const studentUsers = students.filter(user => user.role === 'student');
      res.json(studentUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/teacher/progress', requireRole(['teacher']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const assignments = await storage.getAssignmentsForTeacher(teacherId);

      // Get detailed progress for each assignment
      const progressData = await Promise.all(
        assignments.map(async (assignment) => {
          const sessions = await storage.getSessionsForAssignment(assignment.id);
          const lessonSessions = sessions;

          return {
            ...assignment,
            sessions: lessonSessions,
            averageWpm: lessonSessions.length > 0 ?
              lessonSessions.reduce((sum, s) => sum + (parseFloat(s.wpm?.toString() || '0')), 0) / lessonSessions.length : 0,
            averageAccuracy: lessonSessions.length > 0 ?
              lessonSessions.reduce((sum, s) => sum + (parseFloat(s.accuracy?.toString() || '0')), 0) / lessonSessions.length : 0,
            totalSessions: lessonSessions.length,
            completedSessions: lessonSessions.filter(s => s.completed).length
          };
        })
      );

      res.json(progressData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress data" });
    }
  });

  app.get('/api/teacher/dashboard-stats', requireRole(['teacher']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const allUsers = await storage.getAllUsers();
      const lessons = await storage.getLessons();
      const assignments = await storage.getAssignmentsForTeacher(teacherId);
      const classrooms = await storage.getClassrooms(teacherId);

      const students = allUsers.filter(user => user.role === 'student');
      const activeAssignments = assignments.filter(a => a.status === 'in_progress' || a.status === 'pending');
      const completedAssignments = assignments.filter(a => a.status === 'completed');

      res.json({
        totalStudents: students.length,
        totalLessons: lessons.length,
        totalClassrooms: classrooms.length,
        activeAssignments: activeAssignments.length,
        completedAssignments: completedAssignments.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Classroom management routes
  app.get('/api/classrooms', requireRole(['teacher']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const classrooms = await storage.getClassrooms(teacherId);
      res.json(classrooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classrooms" });
    }
  });

  app.post('/api/classrooms', requireRole(['teacher']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const classroomData = insertClassroomSchema.parse({
        ...req.body,
        teacherId,
      });
      const classroom = await storage.createClassroom(classroomData);
      res.json(classroom);
    } catch (error) {
      res.status(400).json({ message: "Failed to create classroom", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/classrooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroomById(req.params.id);
      if (!classroom) return res.status(404).json({ message: "Classroom not found" });
      res.json(classroom);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classroom" });
    }
  });

  app.put('/api/classrooms/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      const classroom = await storage.updateClassroom(req.params.id, req.body);
      res.json(classroom);
    } catch (error) {
      res.status(400).json({ message: "Failed to update classroom" });
    }
  });

  app.delete('/api/classrooms/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      await storage.deleteClassroom(req.params.id);
      res.json({ message: "Classroom deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete classroom" });
    }
  });

  app.get('/api/classrooms/:id/students', requireRole(['teacher']), async (req: any, res) => {
    try {
      const students = await storage.getClassroomStudents(req.params.id);
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classroom students" });
    }
  });

  app.post('/api/classrooms/:id/students', requireRole(['teacher']), async (req: any, res) => {
    try {
      const { studentId } = req.body;
      await storage.addStudentToClassroom(req.params.id, studentId);
      res.json({ message: "Student added to classroom" });
    } catch (error) {
      res.status(400).json({ message: "Failed to add student to classroom" });
    }
  });

  app.delete('/api/classrooms/:id/students/:studentId', requireRole(['teacher']), async (req: any, res) => {
    try {
      await storage.removeStudentFromClassroom(req.params.id, req.params.studentId);
      res.json({ message: "Student removed from classroom" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove student" });
    }
  });

  // Typing session routes
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionData = insertTypingSessionSchema.parse({
        ...req.body,
        studentId: userId,
      });

      const session = await storage.createTypingSession(sessionData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Failed to create session", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.put('/api/sessions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;

      // Verify session belongs to user
      const sessions = await storage.getSessionsForStudent(userId);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Filter out invalid fields and ensure proper types
      const updateData: any = {};

      if (req.body.text) updateData.text = req.body.text;
      if (req.body.wpm !== undefined) updateData.wpm = parseFloat(req.body.wpm) || 0;
      if (req.body.accuracy !== undefined) updateData.accuracy = parseFloat(req.body.accuracy) || 0;
      if (req.body.errors !== undefined) updateData.errors = parseInt(req.body.errors) || 0;
      if (req.body.timeSpent !== undefined) updateData.timeSpent = parseInt(req.body.timeSpent) || 0;
      if (req.body.completed !== undefined) updateData.completed = Boolean(req.body.completed);
      if (req.body.passed !== undefined) updateData.passed = Boolean(req.body.passed);
      if (req.body.keystrokeData) updateData.keystrokeData = req.body.keystrokeData;
      if (req.body.completedAt) {
        // Ensure completedAt is a proper Date object
        const completedAt = new Date(req.body.completedAt);
        if (!isNaN(completedAt.getTime())) {
          updateData.completedAt = completedAt;
        }
      }

      const updatedSession = await storage.updateTypingSession(sessionId, updateData);
      res.json(updatedSession);
    } catch (error) {
      console.error("Session update error:", error);
      res.status(400).json({ message: "Failed to update session", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/sessions/student', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessions = await storage.getSessionsForStudent(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions/current', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const session = await storage.getRecentSessionForStudent(userId);
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current session" });
    }
  });

  // Analytics routes
  app.post('/api/sessions/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.params.id;
      const { keystrokeData, finalMetrics } = req.body;

      await typingAnalyticsService.processTypingSession(
        userId,
        sessionId,
        keystrokeData,
        finalMetrics
      );

      res.json({ message: "Analytics processed successfully" });
    } catch (error) {
      res.status(400).json({ message: "Failed to process analytics", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/analytics/student/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getStudentStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student stats" });
    }
  });

  app.get('/api/analytics/student/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await typingAnalyticsService.calculateDailyStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get('/api/analytics/student/weekly', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const progress = await storage.getWeeklyProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly progress" });
    }
  });

  app.get('/api/analytics/errors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const errorPatterns = await storage.getErrorPatternsForStudent(userId);
      res.json(errorPatterns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch error patterns" });
    }
  });

  // AI suggestions routes
  app.get('/api/ai/suggestions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const suggestions = await storage.getAISuggestionsForStudent(userId);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI suggestions" });
    }
  });

  app.post('/api/ai/suggestions/:id/acknowledge', isAuthenticated, async (req: any, res) => {
    try {
      const suggestionId = req.params.id;
      await storage.acknowledgeAISuggestion(suggestionId);
      res.json({ message: "Suggestion acknowledged" });
    } catch (error) {
      res.status(400).json({ message: "Failed to acknowledge suggestion" });
    }
  });

  app.post('/api/ai/predict-performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { targetDays = 30 } = req.body;

      const prediction = await aiService.predictPerformance(userId, targetDays);
      res.json(prediction);
    } catch (error) {
      res.status(500).json({ message: "Failed to predict performance" });
    }
  });

  // Keystroke analytics routes
  app.get('/api/keystrokes/session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const sessionId = req.params.sessionId;
      const analytics = await storage.getKeystrokeAnalyticsForSession(sessionId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keystroke analytics" });
    }
  });

  app.get('/api/keystrokes/student', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analytics = await storage.getKeystrokeAnalyticsForStudent(userId);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keystroke analytics" });
    }
  });

  // Teacher-specific routes
  app.get('/api/teacher/students', requireRole(['teacher']), async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const students = allUsers.filter(user => user.role === 'student');
      res.json(students.map(student => ({
        id: student.id,
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email,
        username: student.username
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get('/api/teacher/reports', requireRole(['teacher']), async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const assignments = await storage.getAssignmentsForTeacher(teacherId);

      // Get detailed report data for each assignment
      const reports = await Promise.all(
        assignments.map(async (assignment) => {
          const sessions = await storage.getSessionsForAssignment(assignment.id);
          const student = assignment.studentId ? await storage.getUserById(assignment.studentId) : null;
          const lesson = await storage.getLessonById(assignment.lessonId);

          return {
            assignmentId: assignment.id,
            student: student ? {
              id: student.id,
              firstName: student.firstName || '',
              lastName: student.lastName || '',
              email: student.email
            } : null,
            lesson: lesson ? {
              title: lesson.title,
              difficulty: lesson.difficulty
            } : null,
            status: assignment.status,
            assignedAt: assignment.assignedAt,
            dueDate: assignment.dueDate,
            completedAt: assignment.completedAt,
            sessions: sessions.length,
            averageWpm: sessions.length > 0 ? sessions.reduce((sum: number, s: any) => sum + (parseFloat(s.wpm?.toString() || '0')), 0) / sessions.length : 0,
            averageAccuracy: sessions.length > 0 ? sessions.reduce((sum: number, s: any) => sum + (parseFloat(s.accuracy?.toString() || '0')), 0) / sessions.length : 0,
            totalTime: sessions.reduce((sum: number, s: any) => sum + (parseFloat(s.timeSpent?.toString() || '0')), 0)
          };
        })
      );

      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // Report generation routes
  app.get('/api/reports/student/performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Generate comprehensive performance report
      const [stats, weeklyProgress, errorPatterns, suggestions] = await Promise.all([
        storage.getStudentStats(userId),
        storage.getWeeklyProgress(userId),
        storage.getErrorPatternsForStudent(userId),
        storage.getAISuggestionsForStudent(userId),
      ]);

      const report = {
        studentId: userId,
        generatedAt: new Date(),
        overallStats: stats,
        weeklyProgress,
        errorPatterns: errorPatterns.slice(0, 10), // Top 10 error patterns
        activeSuggestions: suggestions.slice(0, 5), // Top 5 suggestions
      };

      res.json(report);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate performance report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
