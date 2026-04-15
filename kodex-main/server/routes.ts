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
} from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupLocalAuth(app);
  setupGoogleAuth(app);

  // Register auth routes
  registerAuthRoutes(app);

  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      const notifications = await storage.getNotificationsForUser(user.id);
      res.json(notifications);
    } catch(e) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch('/api/notifications/read-all', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // User management routes are now in authRoutes.ts

  // Lesson management routes
  app.get('/api/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const lessons = await storage.getLessons(req.user.id);
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

      if (lesson.classroomId) {
         const students = await storage.getClassroomStudents(lesson.classroomId);
         for (const student of students) {
           await storage.createNotification({
             userId: student.id,
             type: "lesson_created",
             message: `New lesson "${lesson.title}" created in your classroom.`,
             relatedId: lesson.id,
             classroomId: lesson.classroomId,
           });
         }
      }

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
      await storage.deleteLesson(req.params.id);
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

  app.patch('/api/lessons/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      const lesson = await storage.updateLesson(req.params.id, req.body);
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Failed to update lesson", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Assignment management routes
  app.get('/api/assignments/student', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignments = await storage.getAssignmentsForStudent(userId);
      
      // Populate the lesson details and session counts
      const populatedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const lesson = await storage.getLessonById(assignment.lessonId);
          const sessions = await storage.getSessionsForAssignment(assignment.id);
          const studentSessions = sessions.filter(s => String(s.studentId) === String(userId));
          return {
            ...assignment,
            lesson,
            sessionCount: studentSessions.length
          };
        })
      );
      
      res.json(populatedAssignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get('/api/assignments/:id/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignmentId = req.params.id;
      const assignment = await storage.getAssignmentById(assignmentId);

      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Verify ownership
      if (assignment.studentId && assignment.studentId !== userId) {
        return res.status(403).json({ message: "Unauthorized access to report" });
      }

      const sessions = await storage.getSessionsForAssignment(assignmentId);
      const studentSessions = sessions.filter(s => s.studentId === userId);
      const teacher = await storage.getUserById(assignment.teacherId);
      const lesson = await storage.getLessonById(assignment.lessonId);

      res.json({
        assignment,
        sessions: studentSessions,
        teacher: teacher ? {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          username: teacher.username
        } : null,
        lesson
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment report" });
    }
  });

  app.get('/api/assignments/teacher', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;
      const assignments = await storage.getAssignmentsForTeacher(userId);
      
      // Enrich with lesson, student and classroom info
      const enriched = await Promise.all(assignments.map(async (a) => {
        try {
          const lesson = await storage.getLessonById(a.lessonId);
          const student = a.studentId ? await storage.getUserById(a.studentId) : null;
          const classroom = a.classroomId ? await storage.getClassroomById(a.classroomId) : null;
          
          return {
            ...a,
            lesson: lesson || { title: "Unknown Lesson", difficulty: "beginner" },
            student: student || null,
            classroom: classroom || null,
            lessonTitle: lesson?.title || "Unknown Lesson",
            lessonDifficulty: lesson?.difficulty || "beginner",
            studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username : "All Students"
          };
        } catch (e) {
          console.error("Error enriching assignment:", a.id, e);
          return {
            ...a,
            lessonTitle: "Error Loading Lesson",
            studentName: "Error Loading Student"
          };
        }
      }));
      
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get('/api/assignments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const assignment = await storage.getAssignmentById(req.params.id);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });

      const lesson = await storage.getLessonById(assignment.lessonId);
      const student = assignment.studentId ? await storage.getUserById(assignment.studentId) : null;
      const classroom = assignment.classroomId ? await storage.getClassroomById(assignment.classroomId) : null;
      
      res.json({
        ...assignment,
        lesson: lesson || { title: "Unknown Lesson", difficulty: "beginner" },
        student: student || null,
        classroom: classroom || null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment details" });
    }
  });

  app.post('/api/assignments', requireRole(['teacher']), async (req: any, res) => {
    try {
      const userId = req.user.id;

      const assignmentData = insertLessonAssignmentSchema.parse({
        ...req.body,
        classroomId: (req.body.classroomId === "" || req.body.classroomId === "none") ? null : req.body.classroomId,
        teacherId: userId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
      });

      const assignment = await storage.createAssignment(assignmentData);
      const lesson = await storage.getLessonById(assignment.lessonId);

      if (assignment.studentId) {
         await storage.createNotification({
           userId: assignment.studentId,
           type: "assignment_created",
           message: `You have been assigned "${lesson?.title || 'a lesson'}".`,
           relatedId: assignment.id,
           classroomId: assignment.classroomId,
         });
      } else if (assignment.classroomId) {
         const students = await storage.getClassroomStudents(assignment.classroomId);
         for (const student of students) {
           await storage.createNotification({
             userId: student.id,
             type: "assignment_created",
             message: `New assignment "${lesson?.title || 'a lesson'}" in your classroom.`,
             relatedId: assignment.id,
             classroomId: assignment.classroomId,
           });
         }
      }

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

  app.patch('/api/assignments/:id', requireRole(['teacher']), async (req: any, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      
      let lessonTitle = "Objective";
      if (assignment.lessonId) {
        const lesson = await storage.getLessonById(assignment.lessonId);
        if (lesson) lessonTitle = lesson.title;
      }

      // Notify student if feedback is added
      if (req.body.feedback && assignment.studentId) {
          await storage.createNotification({
            userId: assignment.studentId,
            type: "feedback_received",
            message: `New feedback received from teacher for "${lessonTitle}".`,
            relatedId: assignment.id,
          });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update assignment", error: error instanceof Error ? error.message : 'Unknown error' });
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
          const completedSessions = sessions.filter(s => s.completed && s.timeSpent && s.timeSpent > 0);
          
          const student = assignment.studentId ? await storage.getUserById(assignment.studentId) : null;
          const lesson = await storage.getLessonById(assignment.lessonId);

          return {
            ...assignment,
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
            sessions: sessions,
            averageWpm: completedSessions.length > 0 ?
              completedSessions.reduce((sum, s) => sum + (parseFloat(s.wpm?.toString() || '0')), 0) / completedSessions.length : 0,
            averageAccuracy: completedSessions.length > 0 ?
              completedSessions.reduce((sum, s) => sum + (parseFloat(s.accuracy?.toString() || '0')), 0) / completedSessions.length : 0,
            averagePostureScore: completedSessions.length > 0 ?
              completedSessions.reduce((sum, s: any) => sum + (s.postureScore || 0), 0) / completedSessions.length : 100,
            totalSessions: sessions.length,
            completedSessions: completedSessions.length,
            progress: assignment.status === 'completed' ? 100 : (completedSessions.length > 0 ? 50 : 0) // Basic progress heuristic if not explicit
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
      const classrooms = await storage.getClassrooms(teacherId);
      const lessons = await storage.getLessons(teacherId);
      const assignments = await storage.getAssignmentsForTeacher(teacherId);
      
      let studentsInClassrooms: Set<string> = new Set();
      for (const classroom of classrooms) {
        const studentList = await storage.getClassroomStudents(classroom.id);
        studentList.forEach(s => studentsInClassrooms.add(String(s.id)));
      }

      const activeAssignments = assignments.filter(a => a.status === 'in_progress' || a.status === 'pending');
      const completedAssignments = assignments.filter(a => a.status === 'completed');

      res.json({
        totalStudents: studentsInClassrooms.size,
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

      // Check for duplicate room name for this teacher
      const existingRooms = await storage.getClassrooms(teacherId);
      if (existingRooms.some(r => r.name.toLowerCase() === classroomData.name.toLowerCase())) {
        return res.status(400).json({ message: "A room with this name already exists" });
      }

      const classroom = await storage.createClassroom(classroomData);
      res.json(classroom);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create classroom" });
    }
  });

  app.get('/api/classrooms/student', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const classrooms = await storage.getClassroomsForStudent(userId);
      res.json(classrooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student classrooms" });
    }
  });

  app.get('/api/classrooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroomById(req.params.id);
      if (!classroom) return res.status(404).json({ message: "Classroom not found" });
      
      const teacher = await storage.getUserById(classroom.teacherId);
      res.json({
        ...classroom,
        teacherName: teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username : "Unknown Instructor",
        teacherUsername: teacher?.username || "unknown"
      });
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
      const students = await storage.getClassroomStudents(req.params.id);
      await storage.deleteClassroom(req.params.id);
      
      // Notify all students in that room
      for (const student of students) {
          await storage.createNotification({
            userId: student.id,
            type: "classroom_deleted",
            message: `A classroom has been decommissioned by the instructor.`,
          });
      }
      
      res.json({ message: "Classroom deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete classroom" });
    }
  });

  app.get('/api/classrooms/:id/rankings', isAuthenticated, async (req: any, res) => {
    try {
      const rankings = await storage.getClassroomRankings(req.params.id);
      res.json(rankings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rankings" });
    }
  });

  app.post('/api/classrooms/:id/regenerate-code', requireRole(['teacher']), async (req: any, res) => {
    try {
      const classroom = await storage.regenerateClassroomCode(req.params.id);
      res.json(classroom);
    } catch (error) {
      res.status(500).json({ message: "Failed to regenerate code" });
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

  app.get('/api/classrooms/:id/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const announcements = await storage.getClassroomAnnouncements(req.params.id);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/classrooms/:id/announcements', requireRole(['teacher']), async (req: any, res) => {
    try {
      const announcement = await storage.createClassroomAnnouncement({
        ...req.body,
        classroomId: req.params.id,
        teacherId: req.user.id
      });

      const students = await storage.getClassroomStudents(req.params.id);
      for (const student of students) {
         await storage.createNotification({
           userId: student.id,
           type: "announcement_created",
           message: `New announcement posted in your classroom.`,
           relatedId: announcement.id,
           classroomId: req.params.id,
         });
      }

      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Failed to create announcement" });
    }
  });

  app.delete('/api/classrooms/:id/announcements/:announcementId', requireRole(['teacher']), async (req: any, res) => {
    try {
      await storage.deleteClassroomAnnouncement(req.params.announcementId);
      res.json({ message: "Announcement deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  app.get('/api/classrooms/:id/modules', isAuthenticated, async (req: any, res) => {
    try {
      const modules = await storage.getClassroomModules(req.params.id);
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post('/api/classrooms/:id/modules', requireRole(['teacher']), async (req: any, res) => {
    try {
      const module = await storage.createClassroomModule({
        ...req.body,
        classroomId: req.params.id,
        teacherId: req.user.id
      });

      const students = await storage.getClassroomStudents(req.params.id);
      for (const student of students) {
         await storage.createNotification({
           userId: student.id,
           type: "module_uploaded",
           message: `New module "${module.title}" uploaded in your classroom.`,
           relatedId: module.id,
           classroomId: req.params.id,
         });
      }

      res.json(module);
    } catch (error) {
      res.status(400).json({ message: "Failed to create module" });
    }
  });

  app.delete('/api/classrooms/:id/modules/:moduleId', requireRole(['teacher']), async (req: any, res) => {
    try {
      await storage.deleteClassroomModule(req.params.moduleId);
      res.json({ message: "Module deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  app.get('/api/classrooms/:id/lessons', isAuthenticated, async (req: any, res) => {
    try {
      const lessons = await storage.getLessonsByClassroom(req.params.id);
      const assignments = await storage.getAssignmentsByClassroom(req.params.id);
      
      // Get set of lesson IDs that are currently assigned as tasks in this room
      const assignedLessonIds = new Set(assignments.map(a => a.lessonId));
      
      // Only show lessons that are NOT standalone assignments AND NOT currently assigned as tasks
      const filtered = lessons.filter(l => !l.isStandalone && !assignedLessonIds.has(l.id));
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get('/api/classrooms/:id/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const classroomId = req.params.id;
      const assignments = await storage.getAssignmentsByClassroom(classroomId);
      
      // If student, only show theirs
      let filtered = assignments;
      if (req.user.role === 'student') {
        filtered = assignments.filter(a => !a.studentId || a.studentId === req.user.id);
      }
      
      // Join with additional info
      const enriched = await Promise.all(filtered.map(async (a) => {
        try {
          const lesson = await storage.getLessonById(a.lessonId);
          const student = a.studentId ? await storage.getUserById(a.studentId) : null;
          const classroom = a.classroomId ? await storage.getClassroomById(a.classroomId) : null;
          
          return {
            ...a,
            lesson: lesson || { title: "Unknown Lesson", difficulty: "beginner" },
            student: student || null,
            classroom: classroom || null,
            lessonTitle: lesson?.title || "Unknown Lesson",
            lessonDifficulty: lesson?.difficulty || "beginner",
            studentName: student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username : "All Students"
          };
        } catch (e) {
          console.error("Error enriching classroom assignment:", a.id, e);
          return {
            ...a,
            lessonTitle: "Error Loading Lesson",
            studentName: "Error Loading Student"
          };
        }
      }));

      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.get('/api/classrooms/:id/activities', isAuthenticated, async (req: any, res) => {
    try {
      const reports = await storage.getClassroomActivityReports(req.params.id);
      let filtered = reports;
      if (req.user.role === 'student') {
        filtered = reports.filter(r => r.studentId === req.user.id);
      }
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classroom activities" });
    }
  });

  app.post('/api/classrooms/join', isAuthenticated, async (req: any, res) => {
    try {
      const { inviteCode } = req.body;
      if (!inviteCode) {
        return res.status(400).json({ message: "Invite code is required" });
      }

      const classroom = await storage.getClassroomByInviteCode(inviteCode);
      if (!classroom) {
        return res.status(404).json({ message: "Invalid invite code" });
      }

      const userId = req.user.id;
      
      const students = await storage.getClassroomStudents(classroom.id);
      if (students.find(s => s.id === userId)) {
        return res.status(400).json({ message: "Already a member of this classroom" });
      }
      
      await storage.addStudentToClassroom(classroom.id, userId);

      res.status(200).json({ message: "Successfully joined classroom", classroom });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to join classroom" });
    }
  });

  // Typing session routes
  app.post('/api/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { lessonId, assignmentId, ...rest } = req.body;
      
      let activityId = req.body.activityId;

      // Check max attempts if assignmentId/lessonId is present
      if (assignmentId) {
        const assignment = await storage.getAssignmentById(assignmentId);
        if (assignment) {
          // Check due date
          if (assignment.dueDate && new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed') {
            return res.status(403).json({ message: "Assignment deadline has passed and objective is locked." });
          }

          if (assignment.maxAttempts > 0) {
             const sessions = await storage.getSessionsForAssignment(assignmentId);
             const studentSessions = sessions.filter(s => String(s.studentId) === String(userId));
             if (studentSessions.length >= assignment.maxAttempts) {
               return res.status(403).json({ 
                 message: `Maximum attempt limit (${assignment.maxAttempts}) reached for this assignment.`,
                 limitReached: true 
               });
             }
          }
        }
      } else if (lessonId) {
        const lesson = await storage.getLessonById(lessonId);
        if (lesson && lesson.maxAttempts && lesson.maxAttempts > 0) {
          const activities = await storage.getTypingActivitiesForStudent(userId);
          const activity = activities.find(a => a.lessonId === lessonId);
          if (activity) {
            const sessions = await storage.getSessionsForActivity(activity.id);
            if (sessions.length >= lesson.maxAttempts) {
              return res.status(403).json({ 
                message: `Maximum attempt limit (${lesson.maxAttempts}) reached for this lesson.`,
                limitReached: true 
              });
            }
          }
        }
      }

      // If lessonId is provided, find or create an activity
      if (lessonId && !activityId) {
        const activities = await storage.getTypingActivitiesForStudent(userId);
        const existingActivity = activities.find(a => a.lessonId === lessonId);
        
        if (existingActivity) {
          activityId = existingActivity.id;
        } else {
          // Get the lesson text to create the activity
          const lesson = await storage.getLessonById(lessonId);
          if (lesson) {
            const newActivity = await storage.createTypingActivity({
              lessonId,
              studentId: userId,
              text: lesson.content,
              minAccuracy: lesson.timeLimit ? "85.00" : "85.00", // Default
              minWpm: 60
            });
            activityId = newActivity.id;
          }
        }
      }

      const sessionData = insertTypingSessionSchema.parse({
        activityId,
        studentId: userId,
        assignmentId: assignmentId || null,
        text: rest.text || "",
        wpm: rest.wpm || "0.00",
        accuracy: rest.accuracy || "100.00",
        errors: rest.errors || 0,
        timeSpent: rest.timeSpent || 0,
        completed: rest.completed || false,
        passed: rest.passed || false,
        keystrokeData: rest.keystrokeData || null,
        postureScore: rest.postureScore || 100,
        completedAt: rest.completedAt || null,
      });

      const session = await storage.createTypingSession(sessionData);
      
      // If there's an assignmentId, update its status
      if (req.body.assignmentId) {
         await storage.updateAssignment(req.body.assignmentId, {
           status: 'in_progress'
         });
      }

      res.json(session);
    } catch (error) {
      console.error("Session creation error:", error);
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
        const completedAt = new Date(req.body.completedAt);
        if (!isNaN(completedAt.getTime())) {
          updateData.completedAt = completedAt;
        }
      }

      const updatedSession = await storage.updateTypingSession(sessionId, updateData);

      // If session is completed, update the associated assignment progress
      // If session is completed, update the associated assignment progress
      if (updatedSession.completed) {
        let targetAssignmentId = updatedSession.assignmentId;
        
        // Fallback to searching by activity if assignmentId is missing
        if (!targetAssignmentId && updatedSession.activityId) {
          const activity = (await storage.getTypingActivitiesForStudent(userId)).find(a => a.id === updatedSession.activityId);
          if (activity && activity.lessonId) {
            const assignments = await storage.getAssignmentsForStudent(userId);
            const assignment = assignments.find(a => a.lessonId === activity.lessonId && a.status !== 'completed');
            if (assignment) targetAssignmentId = assignment.id;
          }
        }

        if (targetAssignmentId) {
          const assignment = await storage.getAssignmentById(targetAssignmentId);
          if (assignment && assignment.status !== 'completed') {
            await storage.updateAssignment(assignment.id, {
              status: 'completed',
              progress: "100.00",
              completedAt: new Date()
            });

            const lesson = await storage.getLessonById(assignment.lessonId);
            const student = await storage.getUserById(userId);
            if (lesson && student) {
               await storage.createNotification({
                 userId: assignment.teacherId,
                 type: "assignment_completed",
                 message: `${student.firstName || student.username} completed "${lesson.title}".`,
                 relatedId: assignment.id,
                 classroomId: assignment.classroomId,
               });
            }
          }
        }
      }

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
      const teacherId = req.user.id;
      const classrooms = await storage.getClassrooms(teacherId);
      
      let allStudents: any[] = [];
      for (const classroom of classrooms) {
        const students = await storage.getClassroomStudents(classroom.id);
        allStudents = [...allStudents, ...students];
      }
      
      // Deduplicate students by id
      const uniqueStudentsMap = new Map();
      allStudents.forEach(student => {
        uniqueStudentsMap.set(student.id, student);
      });
      const uniqueStudents = Array.from(uniqueStudentsMap.values());

      res.json(uniqueStudents.map(student => ({
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

          const completedSessions = sessions.filter(s => s.completed && s.timeSpent && s.timeSpent > 0);
          return {
            assignmentId: assignment.id,
            classroomId: assignment.classroomId,
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
            sessions: sessions,
            averageWpm: completedSessions.length > 0 ? completedSessions.reduce((sum: number, s: any) => sum + (parseFloat(s.wpm?.toString() || '0')), 0) / completedSessions.length : 0,
            averageAccuracy: completedSessions.length > 0 ? completedSessions.reduce((sum: number, s: any) => sum + (parseFloat(s.accuracy?.toString() || '0')), 0) / completedSessions.length : 0,
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
