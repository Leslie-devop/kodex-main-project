import {
  users,
  lessons,
  lessonAssignments,
  typingActivities,
  typingSessions,
  keystrokeAnalytics,
  aiSuggestions,
  errorPatterns,
  classrooms,
  classroomStudents,
  type User,
  type UpsertUser,
  type InsertUser,
  type Lesson,
  type InsertLesson,
  type LessonAssignment,
  type InsertLessonAssignment,
  type TypingActivity,
  type InsertTypingActivity,
  type TypingSession,
  type InsertTypingSession,
  type KeystrokeAnalytics,
  type InsertKeystrokeAnalytics,
  type AISuggestion,
  type InsertAISuggestion,
  type ErrorPattern,
  type InsertErrorPattern,
  type Classroom,
  type InsertClassroom,
  type ClassroomStudent,
  type InsertClassroomStudent,
  classroomAnnouncements,
  classroomModules,
  type ClassroomAnnouncement,
  type InsertClassroomAnnouncement,
  type ClassroomModule,
  type InsertClassroomModule,
  notifications,
  type Notification,
  type InsertNotification
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, inArray, gt } from "drizzle-orm";

export interface IStorage {
  // User operations 
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUserRole(userId: string, role: 'teacher' | 'student'): Promise<User>;
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateVerificationCode(userId: string, code: string, expiry: Date): Promise<void>;
  verifyUser(userId: string): Promise<void>;
  setUserConsent(userId: string): Promise<User>;
  setPushVerified(userId: string, status: boolean): Promise<User>;
  deleteUser(userId: string): Promise<void>;

  // Lesson operations
  getLessons(userId?: string): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: string): Promise<void>;
  // Lesson assignment operations
  getAssignmentsForStudent(studentId: string): Promise<LessonAssignment[]>;
  getAssignmentsForTeacher(teacherId: string): Promise<LessonAssignment[]>;
  getAssignmentById(id: string): Promise<LessonAssignment | undefined>;
  getSessionsForAssignment(assignmentId: string): Promise<TypingSession[]>;
  createAssignment(assignment: InsertLessonAssignment): Promise<LessonAssignment>;
  updateAssignment(id: string, assignment: Partial<InsertLessonAssignment>): Promise<LessonAssignment>;
  deleteAssignment(id: string): Promise<void>;
  getAssignmentsForClassroom(classroomId: string): Promise<LessonAssignment[]>;

  // Classroom operations
  getClassrooms(teacherId: string): Promise<Classroom[]>;
  getClassroomsForStudent(studentId: string): Promise<Classroom[]>;
  getClassroomById(id: string): Promise<Classroom | undefined>;
  getClassroomByInviteCode(inviteCode: string): Promise<Classroom | undefined>;
  createClassroom(classroom: InsertClassroom): Promise<Classroom>;
  regenerateClassroomCode(id: string): Promise<Classroom>;
  updateClassroom(id: string, classroom: Partial<InsertClassroom>): Promise<Classroom>;
  deleteClassroom(id: string): Promise<void>;
  getClassroomStudents(classroomId: string): Promise<User[]>;
  addStudentToClassroom(classroomId: string, studentId: string): Promise<void>;
  removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void>;
  getClassroomAnnouncements(classroomId: string): Promise<ClassroomAnnouncement[]>;
  createClassroomAnnouncement(announcement: InsertClassroomAnnouncement): Promise<ClassroomAnnouncement>;
  deleteClassroomAnnouncement(id: string): Promise<void>;
  getClassroomModules(classroomId: string): Promise<ClassroomModule[]>;
  createClassroomModule(module: InsertClassroomModule): Promise<ClassroomModule>;
  deleteClassroomModule(id: string): Promise<void>;
  getLessonsByClassroom(classroomId: string): Promise<Lesson[]>;
  getAssignmentsByClassroom(classroomId: string): Promise<LessonAssignment[]>;
  getClassroomActivityReports(classroomId: string): Promise<any[]>;
  getClassroomRankings(classroomId: string): Promise<any[]>;

  // Typing activity operations
  createTypingActivity(activity: InsertTypingActivity): Promise<TypingActivity>;
  getTypingActivitiesForStudent(studentId: string): Promise<TypingActivity[]>;

  // Typing session operations
  createTypingSession(session: InsertTypingSession): Promise<TypingSession>;
  updateTypingSession(id: string, session: Partial<InsertTypingSession>): Promise<TypingSession>;
  getSessionsForStudent(studentId: string): Promise<TypingSession[]>;
  getRecentSessionForStudent(studentId: string): Promise<TypingSession | undefined>;
  getSessionsForActivity(activityId: string): Promise<TypingSession[]>;

  // Keystroke analytics operations
  createKeystrokeAnalytics(analytics: InsertKeystrokeAnalytics): Promise<KeystrokeAnalytics>;
  getKeystrokeAnalyticsForSession(sessionId: string): Promise<KeystrokeAnalytics[]>;
  getKeystrokeAnalyticsForStudent(studentId: string): Promise<KeystrokeAnalytics[]>;

  // AI suggestions operations
  getAISuggestionsForStudent(studentId: string): Promise<AISuggestion[]>;
  createAISuggestion(suggestion: InsertAISuggestion): Promise<AISuggestion>;
  acknowledgeAISuggestion(id: string): Promise<void>;

  // Error pattern operations
  getErrorPatternsForStudent(studentId: string): Promise<ErrorPattern[]>;
  upsertErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern>;

  // Analytics operations
  getStudentStats(studentId: string | number): Promise<{
    avgWpm: number;
    avgAccuracy: number;
    totalSessions: number;
    totalTimeMinutes: number;
    improvement: number;
  }>;

  getWeeklyProgress(studentId: string | number): Promise<Array<{
    date: string;
    wpm: number;
    accuracy: number;
    timeSpent: number;
  }>>;

  // Notification operations
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.username, username), eq(users.email, email)));
    return user;
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: 'teacher' | 'student'): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }
  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateVerificationCode(userId: string, code: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({ verificationCode: code, verificationExpiry: expiry })
      .where(eq(users.id, userId));
  }

  async verifyUser(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isVerified: true, verificationCode: null, verificationExpiry: null })
      .where(eq(users.id, userId));
  }
  
  async setUserConsent(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ hasConsent: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }
  
  async setPushVerified(userId: string, status: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isPushVerified: status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // Lesson operations
  async getLessons(userId?: string): Promise<Lesson[]> {
    if (!userId) {
      return await db.select().from(lessons).orderBy(desc(lessons.createdAt));
    }

    const user = await this.getUser(userId);
    if (!user || user.role === 'teacher') {
      return await db
        .select()
        .from(lessons)
        .where(eq(lessons.createdBy, userId || ""))
        .orderBy(desc(lessons.createdAt));
    }

    // For students, filter by their joined classrooms
    const roster = await db
      .select()
      .from(classroomStudents)
      .where(eq(classroomStudents.studentId, userId));
    
    const joinedClassroomIds = roster.map((r: any) => r.classroomId);

    if (joinedClassroomIds.length === 0) {
      // If student hasn't joined any rooms, only show global lessons
      return await db
        .select()
        .from(lessons)
        .where(sql`${lessons.classroomId} IS NULL`)
        .orderBy(desc(lessons.createdAt));
    }

    return await db
      .select()
      .from(lessons)
      .where(
        or(
          sql`${lessons.classroomId} IS NULL`,
          inArray(lessons.classroomId, joinedClassroomIds)
        )
      )
      .orderBy(desc(lessons.createdAt));
  }

  async getLessonById(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [newLesson] = await db.insert(lessons).values(lesson).returning();
    return newLesson;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson> {
    const [updatedLesson] = await db
      .update(lessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return updatedLesson;
  }

  async deleteLesson(id: string): Promise<void> {
    // 1. Handle assignments linked to this lesson
    const assignments = await db.select().from(lessonAssignments).where(eq(lessonAssignments.lessonId, id));
    const assignmentIds = assignments.map((a: any) => a.id);
    if (assignmentIds.length > 0) {
      await db.update(typingSessions)
        .set({ assignmentId: null })
        .where(inArray(typingSessions.assignmentId, assignmentIds));
      await db.delete(lessonAssignments).where(inArray(lessonAssignments.id, assignmentIds));
    }

    // 2. Handle activities linked to this lesson
    const activities = await db.select().from(typingActivities).where(eq(typingActivities.lessonId, id));
    const activityIds = activities.map((a: any) => a.id);
    if (activityIds.length > 0) {
      await db.update(typingSessions)
        .set({ activityId: null })
        .where(inArray(typingSessions.activityId, activityIds));
      await db.delete(typingActivities).where(inArray(typingActivities.id, activityIds));
    }

    // 3. Finally delete the lesson
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Lesson assignment operations
  async getAssignmentsForStudent(studentId: string): Promise<LessonAssignment[]> {
    const studentClassrooms = await this.getClassroomsForStudent(studentId);
    const classroomIds = studentClassrooms.map((c: any) => c.id);

    return await db
      .select()
      .from(lessonAssignments)
      .where(
        or(
          eq(lessonAssignments.studentId, studentId),
          classroomIds.length > 0 ? inArray(lessonAssignments.classroomId, classroomIds) : sql`false`
        )
      )
      .orderBy(desc(lessonAssignments.assignedAt));
  }

  async getAssignmentsForTeacher(teacherId: string): Promise<LessonAssignment[]> {
    return await db
      .select()
      .from(lessonAssignments)
      .where(eq(lessonAssignments.teacherId, teacherId))
      .orderBy(desc(lessonAssignments.assignedAt));
  }

  async getAssignmentById(id: string): Promise<LessonAssignment | undefined> {
    const [assignment] = await db.select().from(lessonAssignments).where(eq(lessonAssignments.id, id));
    return assignment;
  }

  async createAssignment(assignment: InsertLessonAssignment): Promise<LessonAssignment> {
    const [newAssignment] = await db
      .insert(lessonAssignments)
      .values(assignment)
      .returning();
    return newAssignment;
  }

  async updateAssignment(id: string, assignment: Partial<InsertLessonAssignment>): Promise<LessonAssignment> {
    const [updatedAssignment] = await db
      .update(lessonAssignments)
      .set(assignment)
      .where(eq(lessonAssignments.id, id))
      .returning();
    return updatedAssignment;
  }

  async deleteAssignment(id: string): Promise<void> {
    // Unlink sessions to preserve progress history but remove the assignment context
    await db.update(typingSessions)
      .set({ assignmentId: null })
      .where(eq(typingSessions.assignmentId, id));
      
    await db.delete(lessonAssignments).where(eq(lessonAssignments.id, id));
  }

  async getAssignmentsForClassroom(classroomId: string): Promise<LessonAssignment[]> {
    return await db
      .select()
      .from(lessonAssignments)
      .where(eq(lessonAssignments.classroomId, classroomId))
      .orderBy(desc(lessonAssignments.assignedAt));
  }

  // Classroom operations
  async getClassrooms(teacherId: string): Promise<Classroom[]> {
    return await db
      .select()
      .from(classrooms)
      .where(eq(classrooms.teacherId, teacherId))
      .orderBy(desc(classrooms.createdAt));
  }

  async getClassroomsForStudent(studentId: string): Promise<Classroom[]> {
    const links = await db
      .select()
      .from(classroomStudents)
      .where(eq(classroomStudents.studentId, studentId));
      
    if (links.length === 0) return [];
    
    const classroomIds = links.map((l: any) => l.classroomId);
    return await db
      .select()
      .from(classrooms)
      .where(inArray(classrooms.id, classroomIds))
      .orderBy(desc(classrooms.createdAt));
  }

  async getClassroomById(id: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
    return classroom;
  }

  async getClassroomByInviteCode(inviteCode: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.inviteCode, inviteCode));
    return classroom;
  }

  async createClassroom(classroom: InsertClassroom): Promise<Classroom> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [newClassroom] = await db.insert(classrooms).values({
      ...classroom,
      inviteCode: code,
    }).returning();
    return newClassroom;
  }

  async regenerateClassroomCode(id: string): Promise<Classroom> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [updatedClassroom] = await db
      .update(classrooms)
      .set({ inviteCode: code, updatedAt: new Date() })
      .where(eq(classrooms.id, id))
      .returning();
    if (!updatedClassroom) throw new Error("Classroom not found");
    return updatedClassroom;
  }

  async updateClassroom(id: string, classroom: Partial<InsertClassroom>): Promise<Classroom> {
    const [updatedClassroom] = await db
      .update(classrooms)
      .set({ ...classroom, updatedAt: new Date() })
      .where(eq(classrooms.id, id))
      .returning();
    return updatedClassroom;
  }

  async deleteClassroom(id: string): Promise<void> {
    // 1. Delete student links
    await db.delete(classroomStudents).where(eq(classroomStudents.classroomId, id));
    
    // 2. Delete announcements
    await db.delete(classroomAnnouncements).where(eq(classroomAnnouncements.classroomId, id));
    
    // 3. Delete modules
    await db.delete(classroomModules).where(eq(classroomModules.classroomId, id));
    
    // 4. Handle assignments
    const assignments = await db.select().from(lessonAssignments).where(eq(lessonAssignments.classroomId, id));
    const assignmentIds = assignments.map((a: any) => a.id);
    if (assignmentIds.length > 0) {
      // Unlink typing sessions from these assignments to preserve session history
      await db.update(typingSessions)
        .set({ assignmentId: null })
        .where(inArray(typingSessions.assignmentId, assignmentIds));
      
      // Delete the assignments
      await db.delete(lessonAssignments).where(inArray(lessonAssignments.id, assignmentIds));
    }

    // 5. Delete notifications
    await db.delete(notifications).where(eq(notifications.classroomId, id));

    // 6. Finally delete the classroom
    await db.delete(classrooms).where(eq(classrooms.id, id));
  }

  async getClassroomStudents(classroomId: string): Promise<User[]> {
    const links = await db
      .select()
      .from(classroomStudents)
      .where(eq(classroomStudents.classroomId, classroomId));

    if (links.length === 0) return [];

    const studentIds = links.map((l: any) => l.studentId);
    return await db
      .select()
      .from(users)
      .where(inArray(users.id, studentIds));
  }

  async addStudentToClassroom(classroomId: string, studentId: string): Promise<void> {
    await db.insert(classroomStudents).values({ classroomId, studentId });
  }

  async removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void> {
    await db
      .delete(classroomStudents)
      .where(and(
        eq(classroomStudents.classroomId, classroomId),
        eq(classroomStudents.studentId, studentId)
      ));
  }

  async getSessionsForAssignment(assignmentId: string): Promise<TypingSession[]> {
    const assignment = await db
      .select()
      .from(lessonAssignments)
      .where(eq(lessonAssignments.id, assignmentId))
      .limit(1);

    if (assignment.length === 0) {
      return [];
    }

    // Try to find sessions directly by assignmentId first
    const directSessions = await db
      .select()
      .from(typingSessions)
      .where(eq(typingSessions.assignmentId, assignmentId))
      .orderBy(desc(typingSessions.startedAt));

    if (directSessions.length > 0) {
      return directSessions;
    }

    // Fallback for older data or sessions that didn't have assignmentId set
    const { lessonId, studentId, classroomId } = assignment[0];

    let targetStudentIds: string[] = [];
    if (studentId) {
      targetStudentIds = [studentId];
    } else if (classroomId) {
      const students = await this.getClassroomStudents(classroomId);
      targetStudentIds = students.map((s: any) => s.id);
    }

    if (targetStudentIds.length === 0) return [];

    const activities = await db
      .select()
      .from(typingActivities)
      .where(and(
        eq(typingActivities.lessonId, lessonId),
        inArray(typingActivities.studentId, targetStudentIds)
      ));

    if (activities.length === 0) {
      return [];
    }

    const activityIds = activities.map((a: any) => a.id);

    return await db
      .select()
      .from(typingSessions)
      .where(inArray(typingSessions.activityId, activityIds))
      .orderBy(desc(typingSessions.startedAt));
  }

  async createTypingActivity(activity: InsertTypingActivity): Promise<TypingActivity> {
    const [newActivity] = await db.insert(typingActivities).values(activity).returning();
    return newActivity;
  }

  async getSessionsForActivity(activityId: string): Promise<TypingSession[]> {
    return await db
      .select()
      .from(typingSessions)
      .where(eq(typingSessions.activityId, activityId))
      .orderBy(desc(typingSessions.startedAt));
  }

  // Typing activity operations

  async getTypingActivitiesForStudent(studentId: string): Promise<TypingActivity[]> {
    return await db
      .select()
      .from(typingActivities)
      .where(eq(typingActivities.studentId, studentId))
      .orderBy(desc(typingActivities.createdAt));
  }

  // Typing session operations
  async createTypingSession(session: InsertTypingSession): Promise<TypingSession> {
    const [newSession] = await db.insert(typingSessions).values(session).returning();
    return newSession;
  }

  async updateTypingSession(id: string, session: Partial<InsertTypingSession>): Promise<TypingSession> {
    const [updatedSession] = await db
      .update(typingSessions)
      .set(session)
      .where(eq(typingSessions.id, id))
      .returning();
    return updatedSession;
  }

  async getSessionsForStudent(studentId: string): Promise<TypingSession[]> {
    return await db
      .select()
      .from(typingSessions)
      .where(eq(typingSessions.studentId, studentId))
      .orderBy(desc(typingSessions.startedAt));
  }

  async getRecentSessionForStudent(studentId: string): Promise<TypingSession | undefined> {
    const [session] = await db
      .select()
      .from(typingSessions)
      .where(and(eq(typingSessions.studentId, studentId), eq(typingSessions.completed, false)))
      .orderBy(desc(typingSessions.startedAt))
      .limit(1);
    return session;
  }

  async getAllSessions(): Promise<TypingSession[]> {
    return await db
      .select()
      .from(typingSessions)
      .orderBy(desc(typingSessions.startedAt));
  }

  async getActiveSessions(): Promise<TypingSession[]> {
    return await db
      .select()
      .from(typingSessions)
      .where(eq(typingSessions.completed, false))
      .orderBy(desc(typingSessions.startedAt));
  }

  // Keystroke analytics operations
  async createKeystrokeAnalytics(analytics: InsertKeystrokeAnalytics): Promise<KeystrokeAnalytics> {
    const [newAnalytics] = await db
      .insert(keystrokeAnalytics)
      .values(analytics)
      .returning();
    return newAnalytics;
  }

  async getKeystrokeAnalyticsForSession(sessionId: string): Promise<KeystrokeAnalytics[]> {
    return await db
      .select()
      .from(keystrokeAnalytics)
      .where(eq(keystrokeAnalytics.sessionId, sessionId));
  }

  async getKeystrokeAnalyticsForStudent(studentId: string): Promise<KeystrokeAnalytics[]> {
    return await db
      .select()
      .from(keystrokeAnalytics)
      .where(eq(keystrokeAnalytics.studentId, studentId))
      .orderBy(desc(keystrokeAnalytics.createdAt));
  }

  // AI suggestions operations
  async getAISuggestionsForStudent(studentId: string): Promise<AISuggestion[]> {
    return await db
      .select()
      .from(aiSuggestions)
      .where(and(eq(aiSuggestions.studentId, studentId), eq(aiSuggestions.acknowledged, false)))
      .orderBy(desc(aiSuggestions.createdAt));
  }

  async createAISuggestion(suggestion: InsertAISuggestion): Promise<AISuggestion> {
    const [newSuggestion] = await db
      .insert(aiSuggestions)
      .values(suggestion)
      .returning();
    return newSuggestion;
  }

  async acknowledgeAISuggestion(id: string): Promise<void> {
    await db
      .update(aiSuggestions)
      .set({ acknowledged: true })
      .where(eq(aiSuggestions.id, id));
  }

  // Error pattern operations
  async getErrorPatternsForStudent(studentId: string): Promise<ErrorPattern[]> {
    return await db
      .select()
      .from(errorPatterns)
      .where(eq(errorPatterns.studentId, studentId))
      .orderBy(desc(errorPatterns.frequency));
  }

  async upsertErrorPattern(pattern: InsertErrorPattern): Promise<ErrorPattern> {
    const [existingPattern] = await db
      .select()
      .from(errorPatterns)
      .where(
        and(
          eq(errorPatterns.studentId, pattern.studentId),
          eq(errorPatterns.pattern, pattern.pattern)
        )
      );

    if (existingPattern) {
      const [updatedPattern] = await db
        .update(errorPatterns)
        .set({
          frequency: (existingPattern.frequency || 0) + 1,
          lastOccurrence: new Date(),
        })
        .where(eq(errorPatterns.id, existingPattern.id))
        .returning();
      return updatedPattern;
    } else {
      const [newPattern] = await db
        .insert(errorPatterns)
        .values(pattern)
        .returning();
      return newPattern;
    }
  }

  // Analytics operations
  async getStudentStats(studentId: string | number): Promise<{
    avgWpm: number;
    avgAccuracy: number;
    totalSessions: number;
    totalTimeMinutes: number;
    improvement: number;
  }> {
    const sId = String(studentId);
    const stats = await db
      .select({
        avgWpm: sql<number>`AVG(${typingSessions.wpm})::numeric`,
        avgAccuracy: sql<number>`AVG(${typingSessions.accuracy})::numeric`,
        totalSessions: sql<number>`COUNT(*)::numeric`,
        totalTime: sql<number>`SUM(${typingSessions.timeSpent})::numeric`,
      })
      .from(typingSessions)
      .where(and(
        eq(typingSessions.studentId, sId), 
        eq(typingSessions.completed, true),
        gt(typingSessions.timeSpent, 0)
      ));

    const recentStats = await db
      .select({
        avgWpm: sql<number>`AVG(${typingSessions.wpm})::numeric`,
      })
      .from(typingSessions)
      .where(
        and(
          eq(typingSessions.studentId, sId),
          eq(typingSessions.completed, true),
          sql`${typingSessions.completedAt} >= NOW() - INTERVAL '7 days'`
        )
      );

    const oldStats = await db
      .select({
        avgWpm: sql<number>`AVG(${typingSessions.wpm})::numeric`,
      })
      .from(typingSessions)
      .where(
        and(
          eq(typingSessions.studentId, sId),
          eq(typingSessions.completed, true),
          sql`${typingSessions.completedAt} >= NOW() - INTERVAL '14 days' AND ${typingSessions.completedAt} < NOW() - INTERVAL '7 days'`
        )
      );

    const current = stats[0];
    const recent = recentStats[0]?.avgWpm || 0;
    const old = oldStats[0]?.avgWpm || recent;
    const improvement = old > 0 ? ((recent - old) / old) * 100 : 0;

    return {
      avgWpm: Number(current?.avgWpm || 0),
      avgAccuracy: Number(current?.avgAccuracy || 0),
      totalSessions: Number(current?.totalSessions || 0),
      totalTimeMinutes: Math.round(Number(current?.totalTime || 0) / 60),
      improvement: Number(improvement.toFixed(1)),
    };
  }

  async getWeeklyProgress(studentId: string | number): Promise<Array<{
    date: string;
    wpm: number;
    accuracy: number;
    timeSpent: number;
  }>> {
    const progress = await db
      .select({
        date: sql<string>`DATE(${typingSessions.completedAt})`,
        wpm: sql<number>`AVG(${typingSessions.wpm})::numeric`,
        accuracy: sql<number>`AVG(${typingSessions.accuracy})::numeric`,
        timeSpent: sql<number>`SUM(${typingSessions.timeSpent})::numeric`,
      })
      .from(typingSessions)
      .where(
        and(
          eq(typingSessions.studentId, String(studentId)),
          eq(typingSessions.completed, true),
          gt(typingSessions.timeSpent, 0),
          sql`${typingSessions.completedAt} >= NOW() - INTERVAL '7 days'`
        )
      )
      .groupBy(sql`DATE(${typingSessions.completedAt})`)
      .orderBy(sql`DATE(${typingSessions.completedAt})`);

    return progress.map((p: any) => ({
      date: p.date,
      wpm: Number(p.wpm || 0),
      accuracy: Number(p.accuracy || 0),
      timeSpent: Number(p.timeSpent || 0),
    }));
  }
  // Classroom Resource Operations
  async getClassroomAnnouncements(classroomId: string): Promise<ClassroomAnnouncement[]> {
    return await db
      .select()
      .from(classroomAnnouncements)
      .where(eq(classroomAnnouncements.classroomId, classroomId))
      .orderBy(desc(classroomAnnouncements.createdAt));
  }

  async createClassroomAnnouncement(announcement: InsertClassroomAnnouncement): Promise<ClassroomAnnouncement> {
    const [newAnnouncement] = await db
      .insert(classroomAnnouncements)
      .values({ ...announcement, createdAt: new Date() })
      .returning();
    return newAnnouncement;
  }

  async deleteClassroomAnnouncement(id: string): Promise<void> {
    await db.delete(classroomAnnouncements).where(eq(classroomAnnouncements.id, id));
  }

  async getClassroomModules(classroomId: string): Promise<ClassroomModule[]> {
    return await db
      .select()
      .from(classroomModules)
      .where(eq(classroomModules.classroomId, classroomId))
      .orderBy(desc(classroomModules.createdAt));
  }

  async createClassroomModule(module: InsertClassroomModule): Promise<ClassroomModule> {
    const [newModule] = await db
      .insert(classroomModules)
      .values({ ...module, createdAt: new Date() })
      .returning();
    return newModule;
  }

  async deleteClassroomModule(id: string): Promise<void> {
    await db.delete(classroomModules).where(eq(classroomModules.id, id));
  }

  async getLessonsByClassroom(classroomId: string): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.classroomId, classroomId))
      .orderBy(desc(lessons.createdAt));
  }

  async getAssignmentsByClassroom(classroomId: string): Promise<LessonAssignment[]> {
    return await db
      .select()
      .from(lessonAssignments)
      .where(eq(lessonAssignments.classroomId, classroomId))
      .orderBy(desc(lessonAssignments.assignedAt));
  }

  async getClassroomActivityReports(classroomId: string): Promise<any[]> {
    // This joins sessions, users, activities (if any), lessons and assignments to get a full picture
    return await db
      .select({
        id: typingSessions.id,
        studentId: users.id,
        studentName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.username})`,
        username: users.username,
        lessonTitle: lessons.title,
        assignmentId: typingSessions.assignmentId,
        wpm: typingSessions.wpm,
        accuracy: typingSessions.accuracy,
        errors: typingSessions.errors,
        time: typingSessions.timeSpent,
        date: typingSessions.completedAt
      })
      .from(typingSessions)
      .innerJoin(users, eq(typingSessions.studentId, users.id))
      .innerJoin(classroomStudents, eq(users.id, classroomStudents.studentId))
      // Use left join for activities as standalone assignments might not have them initially
      .leftJoin(typingActivities, eq(typingSessions.activityId, typingActivities.id))
      .leftJoin(lessons, eq(typingActivities.lessonId, lessons.id))
      .where(and(
        eq(classroomStudents.classroomId, classroomId),
        eq(typingSessions.completed, true),
        gt(typingSessions.timeSpent, 0)
      ))
      .orderBy(desc(typingSessions.completedAt));
  }

  async getClassroomRankings(classroomId: string): Promise<any[]> {
    const students = await this.getClassroomStudents(classroomId);
    if (students.length === 0) return [];

    const reports = await this.getClassroomActivityReports(classroomId);
    
    // Group reports by student and calculate averages
    const studentStats = new Map<string, any>();
    
    students.forEach(s => {
      studentStats.set(s.id, {
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username,
        username: s.username,
        avgWpm: 0,
        avgAccuracy: 0,
        totalSessions: 0,
        bestWpm: 0
      });
    });

    reports.forEach(r => {
      const stats = studentStats.get(r.studentId);
      if (stats) {
        stats.totalSessions++;
        stats.avgWpm += Number(r.wpm);
        stats.avgAccuracy += Number(r.accuracy);
        stats.bestWpm = Math.max(stats.bestWpm, Number(r.wpm));
      }
    });

    return Array.from(studentStats.values())
      .map(s => ({
        ...s,
        avgWpm: s.totalSessions > 0 ? Math.round(s.avgWpm / s.totalSessions) : 0,
        avgAccuracy: s.totalSessions > 0 ? Math.round(s.avgAccuracy / s.totalSessions) : 0,
      }))
      .sort((a, b) => b.avgWpm - a.avgWpm);
  }

  // Notification operations
  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({ ...notification, createdAt: new Date() })
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}


export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private lessons: Map<string, Lesson> = new Map();
  private assignments: Map<string, LessonAssignment> = new Map();
  private classrooms: Map<string, Classroom> = new Map();
  private studentLinks: Map<string, ClassroomStudent[]> = new Map();
  private announcements: Map<string, ClassroomAnnouncement[]> = new Map();
  private modules: Map<string, ClassroomModule[]> = new Map();
  private sessions: Map<string, TypingSession[]> = new Map();
  private activities: Map<string, TypingActivity[]> = new Map();
  private keystrokes: Map<string, KeystrokeAnalytics[]> = new Map();
  private suggestions: Map<string, AISuggestion[]> = new Map();
  private errorPatterns: Map<string, ErrorPattern[]> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private uId = 1;

  constructor() {
    this.seed();
  }

  private seed() {
    // Basic seeds if needed
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async getUserByUsernameOrEmail(username: string, email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username || u.email === email);
  }
  async createUser(insertUser: InsertUser & { password: string }): Promise<User> {
    const id = String(this.uId++);
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      profileImageUrl: null, 
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      role: insertUser.role || null,
      isVerified: false,
      verificationCode: null,
      verificationExpiry: null,
      hasConsent: insertUser.hasConsent || false,
      isPushVerified: insertUser.isPushVerified || false
    };
    this.users.set(id, user);
    return user;
  }
  async updateVerificationCode(userId: string, code: string, expiry: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.verificationCode = code;
      user.verificationExpiry = expiry;
    }
  }
  async verifyUser(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isVerified = true;
      user.verificationCode = null;
      user.verificationExpiry = null;
    }
  }
  async setUserConsent(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("not found");
    user.hasConsent = true;
    user.updatedAt = new Date();
    return user;
  }
  async setPushVerified(userId: string, status: boolean): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("not found");
    user.isPushVerified = status;
    user.updatedAt = new Date();
    return user;
  }
  async updateUserRole(id: string, role: 'teacher' | 'student'): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, role, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }
  async deleteUser(id: string | number): Promise<void> {
    const sId = String(id);
    this.users.delete(sId);
    
    // Cascade delete lessons
    for (const [lessonId, lesson] of Array.from(this.lessons.entries())) {
      if (String(lesson.createdBy) === sId) {
        this.lessons.delete(lessonId);
      }
    }

    // Cascade delete classrooms (if teacher)
    for (const [classroomId, classroom] of Array.from(this.classrooms.entries())) {
      if (String((classroom as any).teacherId) === sId) {
        this.classrooms.delete(classroomId);
        this.studentLinks.delete(classroomId);
        this.announcements.delete(classroomId);
        this.modules.delete(classroomId);
      }
    }

    // Cascade delete student links (if student)
    for (const [classroomId, links] of Array.from(this.studentLinks.entries())) {
      this.studentLinks.set(classroomId, links.filter((l: any) => String(l.studentId) !== sId));
    }

    // Cascade delete assignments
    for (const [assignmentId, assignment] of Array.from(this.assignments.entries())) {
      if (String(assignment.studentId) === sId || String(assignment.teacherId) === sId) {
        this.assignments.delete(assignmentId);
      }
    }

    // Cascade delete sessions and analytics
    this.sessions.delete(sId);
    this.activities.delete(sId);
    this.keystrokes.delete(`student_${sId}`);
    this.suggestions.delete(sId);
    this.notifications.delete(sId);
  }
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  async upsertUser(data: UpsertUser): Promise<User> {
    const existing = await this.getUserByUsernameOrEmail(data.username, data.email);
    if (existing) return this.updateUser(existing.id, data);
    return this.createUser({ ...data, password: "temp_password" });
  }

  async getLessons(userId?: string): Promise<Lesson[]> {
    const all = Array.from(this.lessons.values());
    if (!userId) return all;
    
    const user = this.users.get(String(userId));
    if (user?.role === 'teacher') {
      return all.filter(l => String(l.createdBy) === String(userId));
    }
    
    // For students, show global lessons and lessons in their classrooms
    const userRooms = new Set();
    for (const [roomId, links] of Array.from(this.studentLinks.entries())) {
      if (links.some((l: any) => String(l.studentId) === String(userId))) {
        userRooms.add(String(roomId));
      }
    }
    
    return all.filter(l => {
      const cId = l.classroomId;
      return !cId || cId === "" || userRooms.has(String(cId));
    });
  }
  async getLessonById(id: string): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }
  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const id = String(this.uId++);
    const newLesson: Lesson = { 
      ...lesson, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      isStandalone: lesson.isStandalone || false, 
      description: lesson.description || null, 
      estimatedTime: lesson.estimatedTime || 10, 
      content: lesson.content || "", 
      classroomId: lesson.classroomId || null,
      createdBy: lesson.createdBy,
      difficulty: lesson.difficulty || "beginner",
      allowBackspace: lesson.allowBackspace || true,
      maxAttempts: lesson.maxAttempts || 0,
      isPublic: lesson.isPublic || false,
      timeLimit: lesson.timeLimit || null
    };
    this.lessons.set(id, newLesson);
    return newLesson;
  }
  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson> {
    const existing = this.lessons.get(id);
    if (!existing) throw new Error("Lesson not found");
    const updated = { ...existing, ...lesson };
    this.lessons.set(id, updated as Lesson);
    return updated as Lesson;
  }
  async deleteLesson(id: string): Promise<void> {
    this.lessons.delete(id);
  }

  async getAssignmentsForStudent(studentId: string): Promise<LessonAssignment[]> {
    return Array.from(this.assignments.values()).filter(a => a.studentId === studentId);
  }
  async getAssignmentsForTeacher(teacherId: string): Promise<LessonAssignment[]> {
    return Array.from(this.assignments.values()).filter(a => a.teacherId === teacherId);
  }
  async getAssignmentById(id: string): Promise<LessonAssignment | undefined> {
    return this.assignments.get(id);
  }
  async getSessionsForAssignment(assignmentId: string): Promise<TypingSession[]> {
    return Array.from(this.sessions.values())
      .flat()
      .filter(s => s.assignmentId === assignmentId);
  }
  async createAssignment(a: InsertLessonAssignment): Promise<LessonAssignment> {
    const id = String(this.uId++);
    const assignment: LessonAssignment = { 
      ...a, 
      status: a.status || "pending",
      id, 
      assignedAt: new Date(), 
      completedAt: null, 
      progress: "0", 
      feedback: null, 
      classroomId: a.classroomId || null, 
      teacherId: a.teacherId || "1", 
      maxAttempts: a.maxAttempts || 0, 
      timeLimit: a.timeLimit || null, 
      allowBackspace: a.allowBackspace || true,
      studentId: a.studentId || null
    };
    this.assignments.set(id, assignment);
    return assignment;
  }
  async updateAssignment(id: string, a: Partial<InsertLessonAssignment>): Promise<LessonAssignment> {
    const existing = this.assignments.get(id);
    if (!existing) throw new Error("Assignment not found");
    const updated = { ...existing, ...a };
    this.assignments.set(id, updated as LessonAssignment);
    return updated as LessonAssignment;
  }
  async deleteAssignment(id: string): Promise<void> {
    this.assignments.delete(id);
  }
  async getAssignmentsForClassroom(classroomId: string): Promise<LessonAssignment[]> {
    return Array.from(this.assignments.values()).filter(a => a.classroomId === classroomId);
  }

  async getClassrooms(teacherId: string): Promise<Classroom[]> {
    return Array.from(this.classrooms.values()).filter(c => c.teacherId === teacherId);
  }
  async getClassroomsForStudent(studentId: string): Promise<Classroom[]> {
    const links = Array.from(this.studentLinks.values()).flat();
    const classroomIds = links.filter(l => l.studentId === studentId).map(l => l.classroomId);
    return Array.from(this.classrooms.values()).filter(c => classroomIds.includes(c.id));
  }
  async getClassroomById(id: string): Promise<Classroom | undefined> {
    return this.classrooms.get(id);
  }
  async getClassroomByInviteCode(code: string): Promise<Classroom | undefined> {
    return Array.from(this.classrooms.values()).find(c => c.inviteCode === code);
  }
  async createClassroom(c: InsertClassroom): Promise<Classroom> {
    const id = String(this.uId++);
    const classroom: Classroom = { 
      ...c, 
      id, 
      createdAt: new Date(), 
      updatedAt: new Date(),
      description: c.description || null, 
      section: c.section || null,
      inviteCode: c.inviteCode || Math.random().toString(36).substring(7).toUpperCase() 
    };
    this.classrooms.set(id, classroom);
    return classroom;
  }
  async regenerateClassroomCode(id: string): Promise<Classroom> {
    const c = this.classrooms.get(id);
    if (!c) throw new Error("not found");
    c.inviteCode = Math.random().toString(36).substring(7).toUpperCase();
    return c;
  }
  async updateClassroom(id: string, c: Partial<InsertClassroom>): Promise<Classroom> {
    const ex = this.classrooms.get(id);
    if (!ex) throw new Error("not found");
    const up = { ...ex, ...c };
    this.classrooms.set(id, up);
    return up;
  }
  async deleteClassroom(id: string): Promise<void> {
    this.classrooms.delete(id);
  }
  async getClassroomStudents(classroomId: string | number): Promise<User[]> {
    const cId = String(classroomId);
    const studentIds = (this.studentLinks.get(cId) || []).map(l => String(l.studentId));
    return Array.from(this.users.values()).filter(u => studentIds.includes(String(u.id)));
  }
  async addStudentToClassroom(classroomId: string | number, studentId: string | number): Promise<void> {
    const cId = String(classroomId);
    const sId = String(studentId);
    const links = this.studentLinks.get(cId) || [];
    links.push({ id: String(this.uId++), classroomId: cId, studentId: sId, joinedAt: new Date() });
    this.studentLinks.set(cId, links);
  }
  async removeStudentFromClassroom(classroomId: string | number, studentId: string | number): Promise<void> {
    const cId = String(classroomId);
    const sId = String(studentId);
    const links = this.studentLinks.get(cId) || [];
    this.studentLinks.set(cId, links.filter((l: any) => String(l.studentId) !== sId));
  }
  async getClassroomAnnouncements(classroomId: string): Promise<ClassroomAnnouncement[]> {
    return this.announcements.get(classroomId) || [];
  }
  async createClassroomAnnouncement(a: InsertClassroomAnnouncement): Promise<ClassroomAnnouncement> {
    const items = this.announcements.get(a.classroomId) || [];
    const item: ClassroomAnnouncement = { 
      ...a, 
      id: String(this.uId++), 
      createdAt: new Date()
    };
    items.push(item);
    this.announcements.set(a.classroomId, items);
    return item;
  }
  async deleteClassroomAnnouncement(id: string): Promise<void> {
    for (const [classroomId, items] of Array.from(this.announcements.entries())) {
      const filtered = items.filter((a: any) => a.id !== id);
      if (filtered.length !== items.length) {
        this.announcements.set(classroomId, filtered);
        return;
      }
    }
  }
  async getClassroomModules(classroomId: string): Promise<ClassroomModule[]> {
    return this.modules.get(classroomId) || [];
  }
  async createClassroomModule(m: InsertClassroomModule): Promise<ClassroomModule> {
    const items = this.modules.get(m.classroomId) || [];
    const item = { ...m, id: String(this.uId++), createdAt: new Date(), description: m.description || null, type: m.type || "file" };
    items.push(item);
    this.modules.set(m.classroomId, items);
    return item;
  }
  async deleteClassroomModule(id: string): Promise<void> {
    for (const [classroomId, items] of Array.from(this.modules.entries())) {
      const filtered = items.filter((m: any) => m.id !== id);
      if (filtered.length !== items.length) {
        this.modules.set(classroomId, filtered);
        return;
      }
    }
  }
  async getLessonsByClassroom(classroomId: string): Promise<Lesson[]> {
    return Array.from(this.lessons.values()).filter(l => l.classroomId === classroomId);
  }
  async getAssignmentsByClassroom(classroomId: string): Promise<LessonAssignment[]> {
     return Array.from(this.assignments.values()).filter(a => a.classroomId === classroomId);
  }
  async getClassroomActivityReports(classroomId: string | number): Promise<any[]> {
    const cId = String(classroomId);
    const studentIds = (this.studentLinks.get(cId) || []).map(l => String(l.studentId));
    const reports: any[] = [];

    for (const sId of studentIds) {
      const student = this.users.get(sId);
      if (!student) continue;

      const sessions = (this.sessions.get(sId) || []).filter(s => s.completed && (s.timeSpent || 0) > 0);
      for (const session of sessions) {
        // Find lesson title if available
        let lessonTitle = "Neural Assignment";
        if (session.activityId) {
          const studentActivities = this.activities.get(sId) || [];
          const activity = studentActivities.find(a => String(a.id) === String(session.activityId));
          if (activity && activity.lessonId) {
            const lesson = this.lessons.get(String(activity.lessonId));
            if (lesson) lessonTitle = lesson.title;
          }
        } else if (session.assignmentId) {
          const assignment = this.assignments.get(String(session.assignmentId));
          if (assignment) {
            const lesson = this.lessons.get(String(assignment.lessonId));
            if (lesson) lessonTitle = lesson.title;
          }
        }

        reports.push({
          id: session.id,
          studentId: sId,
          studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.username,
          username: student.username,
          lessonTitle,
          assignmentId: session.assignmentId,
          wpm: session.wpm,
          accuracy: session.accuracy,
          errors: session.errors,
          time: session.timeSpent,
          date: session.completedAt || session.startedAt || new Date()
        });
      }
    }

    return reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createTypingActivity(a: InsertTypingActivity): Promise<TypingActivity> {
    const id = String(this.uId++);
    const item: TypingActivity = { 
      ...a, 
      id, 
      createdAt: new Date(), 
      minWpm: a.minWpm || 60, 
      timeLimit: a.timeLimit || 0, 
      lessonId: a.lessonId || null,
      minAccuracy: a.minAccuracy || "85.00"
    };
    const items = this.activities.get(a.studentId) || [];
    items.push(item);
    this.activities.set(a.studentId, items);
    return item;
  }
  async getTypingActivitiesForStudent(studentId: string): Promise<TypingActivity[]> {
    return this.activities.get(studentId) || [];
  }

  async createTypingSession(s: InsertTypingSession): Promise<TypingSession> {
    const id = String(this.uId++);
    const item: TypingSession = { 
      ...s, 
      id, 
      startedAt: new Date(), 
      completedAt: s.completedAt || null, 
      passed: s.passed || false, 
      completed: s.completed || false, 
      assignmentId: s.assignmentId || null, 
      activityId: s.activityId || null, 
      text: s.text || null,
      wpm: s.wpm || "0",
      accuracy: s.accuracy || "0",
      errors: s.errors || 0,
      timeSpent: s.timeSpent || 0,
      keystrokeData: s.keystrokeData || null,
      postureScore: s.postureScore || 100
    };
    const items = this.sessions.get(String(s.studentId)) || [];
    items.push(item as TypingSession);
    this.sessions.set(String(s.studentId), items);
    return item as TypingSession;
  }
  async getSessionsForStudent(studentId: string | number): Promise<TypingSession[]> {
    const sId = String(studentId);
    return (this.sessions.get(sId) || []).sort((a, b) => 
      new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
    );
  }
  async getRecentSessionForStudent(studentId: string): Promise<TypingSession | undefined> {
    const items = this.sessions.get(studentId) || [];
    return items.filter(s => !s.completed).sort((a,b) => (b.startedAt?.getTime() || 0) - (a.startedAt?.getTime() || 0))[0];
  }
  async getSessionById(id: string): Promise<TypingSession | undefined> {
    return Array.from(this.sessions.values()).flat().find(s => s.id === id);
  }
  async getSessionsForActivity(activityId: string): Promise<TypingSession[]> {
    return Array.from(this.sessions.values())
      .flat()
      .filter(s => s.activityId === activityId)
      .sort((a, b) => new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime());
  }
  async updateTypingSession(id: string | number, s: Partial<InsertTypingSession>): Promise<TypingSession> {
    const sId = String(id);
    const all = Array.from(this.sessions.values()).flat();
    const item = all.find(x => String(x.id) === sId);
    if (!item) throw new Error("not found");
    Object.assign(item, s);
    return item as TypingSession;
  }

  async createKeystrokeAnalytics(a: InsertKeystrokeAnalytics): Promise<KeystrokeAnalytics> {
    const items = this.keystrokes.get(a.sessionId) || [];
    const item = { ...a, id: String(this.uId++), createdAt: new Date(), timingMs: a.timingMs || 0, wasError: a.wasError ?? false, fingerUsed: a.fingerUsed ?? null };
    items.push(item);
    this.keystrokes.set(a.sessionId, items);
    
    // Also store by student for global analysis
    const studentItems = this.keystrokes.get(`student_${a.studentId}`) || [];
    studentItems.push(item);
    this.keystrokes.set(`student_${a.studentId}`, studentItems);
    
    return item;
  }
  async getKeystrokeAnalyticsForSession(sessionId: string): Promise<KeystrokeAnalytics[]> {
    return this.keystrokes.get(sessionId) || [];
  }
  async getKeystrokeAnalyticsForStudent(studentId: string): Promise<KeystrokeAnalytics[]> {
    return this.keystrokes.get(`student_${studentId}`) || [];
  }
  async createAISuggestion(s: InsertAISuggestion): Promise<AISuggestion> {
    const items = this.suggestions.get(s.studentId) || [];
    const item = { ...s, id: String(this.uId++), createdAt: new Date(), acknowledged: false, studentId: s.studentId, type: s.type, content: s.content, priority: s.priority || "medium" };
    items.push(item);
    this.suggestions.set(s.studentId, items);
    return item;
  }
  async getAISuggestionsForStudent(studentId: string): Promise<AISuggestion[]> {
    return this.suggestions.get(studentId) || [];
  }
  async acknowledgeAISuggestion(id: string): Promise<void> {
    const all = Array.from(this.suggestions.values()).flat();
    const item = all.find(x => x.id === id);
    if (item) item.acknowledged = true;
  }
  async getErrorPatternsForStudent(studentId: string): Promise<ErrorPattern[]> {
    return this.errorPatterns.get(studentId) || [];
  }
  async upsertErrorPattern(p: InsertErrorPattern): Promise<ErrorPattern> {
    const items = this.errorPatterns.get(p.studentId) || [];
    const existing = items.find(x => x.pattern === p.pattern);
    
    if (existing) {
      existing.frequency = (existing.frequency || 1) + 1;
      existing.lastOccurrence = new Date();
      return existing;
    } else {
      const item = { ...p, id: String(this.uId++), lastOccurrence: new Date(), frequency: p.frequency ?? 1, studentId: p.studentId, pattern: p.pattern, errorType: p.errorType };
      items.push(item);
      this.errorPatterns.set(p.studentId, items);
      return item;
    }
  }
  async getStudentStats(studentId: string | number): Promise<{
    avgWpm: number;
    avgAccuracy: number;
    totalSessions: number;
    totalTimeMinutes: number;
    improvement: number;
  }> {
    const sId = String(studentId);
    const sessions = (this.sessions.get(sId) || []).filter(s => s.completed && (s.timeSpent || 0) > 0);
    if (sessions.length === 0) {
      return { avgWpm: 0, avgAccuracy: 0, totalSessions: 0, totalTimeMinutes: 0, improvement: 0 };
    }

    const avgWpm = sessions.reduce((acc, s) => acc + (Number(s.wpm) || 0), 0) / sessions.length;
    const avgAccuracy = sessions.reduce((acc, s) => acc + (Number(s.accuracy) || 0), 0) / sessions.length;
    const totalTime = sessions.reduce((acc, s) => acc + (s.timeSpent || 0), 0);

    // Simple improvement: Compare first session with last
    // Since sessions are DESC (newest first), lastSession is sessions[0], firstSession is sessions[sessions.length-1]
    const newestSession = sessions[0];
    const oldestSession = sessions[sessions.length - 1];
    const improvement = (Number(newestSession.wpm) || 0) - (Number(oldestSession.wpm) || 0);

    return {
      avgWpm: Math.round(avgWpm),
      avgAccuracy: Math.round(avgAccuracy),
      totalSessions: sessions.length,
      totalTimeMinutes: Math.round(totalTime / 60),
      improvement: Math.round(improvement)
    };
  }

  async getWeeklyProgress(studentId: string | number): Promise<Array<{
    date: string;
    wpm: number;
    accuracy: number;
    timeSpent: number;
  }>> {
    const sId = String(studentId);
    const sessions = (this.sessions.get(sId) || []).filter(s => s.completed && (s.timeSpent || 0) > 0);
    const dailyData = new Map<string, { wpm: number[], accuracy: number[], time: number }>();

    sessions.forEach(s => {
      const date = new Date(s.completedAt || s.startedAt || new Date()).toISOString().split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, { wpm: [], accuracy: [], time: 0 });
      }
      const data = dailyData.get(date)!;
      data.wpm.push(Number(s.wpm) || 0);
      data.accuracy.push(Number(s.accuracy) || 0);
      data.time += (s.timeSpent || 0);
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      wpm: data.wpm.length > 0 ? data.wpm.reduce((a, b) => a + b) / data.wpm.length : 0,
      accuracy: data.accuracy.length > 0 ? data.accuracy.reduce((a, b) => a + b) / data.accuracy.length : 0,
      timeSpent: data.time
    })).sort((a,b) => a.date.localeCompare(b.date));
  }
  async getClassroomRankings(classroomId: string): Promise<any[]> {
    const students = await this.getClassroomStudents(classroomId);
    if (students.length === 0) return [];

    const reports = await this.getClassroomActivityReports(classroomId);
    
    // Group reports by student and calculate averages
    const studentStats = new Map<string, any>();
    
    students.forEach(s => {
      studentStats.set(s.id, {
        id: s.id,
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.username,
        username: s.username,
        avgWpm: 0,
        avgAccuracy: 0,
        totalSessions: 0,
        bestWpm: 0
      });
    });

    reports.forEach(r => {
      const stats = studentStats.get(r.studentId);
      if (stats) {
        stats.totalSessions++;
        stats.avgWpm += Number(r.wpm);
        stats.avgAccuracy += Number(r.accuracy);
        stats.bestWpm = Math.max(stats.bestWpm, Number(r.wpm));
      }
    });

    return Array.from(studentStats.values())
      .map(s => ({
        ...s,
        avgWpm: s.totalSessions > 0 ? Math.round(s.avgWpm / s.totalSessions * 100) / 100 : 0,
        avgAccuracy: s.totalSessions > 0 ? Math.round(s.avgAccuracy / s.totalSessions * 100) / 100 : 0,
      }))
      .sort((a, b) => b.avgWpm - a.avgWpm);
  }
  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return this.notifications.get(userId) || [];
  }
  async createNotification(n: InsertNotification): Promise<Notification> {
    const items = this.notifications.get(n.userId) || [];
    const item = { ...n, id: String(this.uId++), createdAt: new Date(), isRead: false, relatedId: n.relatedId || null, classroomId: n.classroomId || null };
    items.push(item);
    this.notifications.set(n.userId, items);
    return item;
  }
  async markNotificationAsRead(id: string): Promise<Notification> {
    const all = Array.from(this.notifications.values()).flat();
    const item = all.find(x => x.id === id);
    if (!item) throw new Error("not found");
    item.isRead = true;
    return item;
  }
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    (this.notifications.get(userId) || []).forEach(n => n.isRead = true);
  }
}

let _storage: IStorage | null = null;

export const storage = new Proxy({}, {
  get: (target, prop) => {
    if (!_storage) {
      _storage = process.env.USE_MEMORY_STORAGE === "true" 
        ? new MemStorage() 
        : new DatabaseStorage();
    }
    return (_storage as any)[prop];
  }
}) as IStorage;

