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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or } from "drizzle-orm";

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

  // Lesson operations
  getLessons(): Promise<Lesson[]>;
  getLessonById(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLessson(id: string): Promise<void>;

  // Lesson assignment operations
  getAssignmentsForStudent(studentId: string): Promise<LessonAssignment[]>;
  getAssignmentsForTeacher(teacherId: string): Promise<LessonAssignment[]>;
  getSessionsForAssignment(assignmentId: string): Promise<TypingSession[]>;
  createAssignment(assignment: InsertLessonAssignment): Promise<LessonAssignment>;
  updateAssignment(id: string, assignment: Partial<InsertLessonAssignment>): Promise<LessonAssignment>;
  deleteAssignment(id: string): Promise<void>;
  getAssignmentsForClassroom(classroomId: string): Promise<LessonAssignment[]>;

  // Classroom operations
  getClassrooms(teacherId: string): Promise<Classroom[]>;
  getClassroomById(id: string): Promise<Classroom | undefined>;
  createClassroom(classroom: InsertClassroom): Promise<Classroom>;
  updateClassroom(id: string, classroom: Partial<InsertClassroom>): Promise<Classroom>;
  deleteClassroom(id: string): Promise<void>;
  getClassroomStudents(classroomId: string): Promise<User[]>;
  addStudentToClassroom(classroomId: string, studentId: string): Promise<void>;
  removeStudentFromClassroom(classroomId: string, studentId: string): Promise<void>;

  // Typing activity operations
  createTypingActivity(activity: InsertTypingActivity): Promise<TypingActivity>;
  getTypingActivitiesForStudent(studentId: string): Promise<TypingActivity[]>;

  // Typing session operations
  createTypingSession(session: InsertTypingSession): Promise<TypingSession>;
  updateTypingSession(id: string, session: Partial<InsertTypingSession>): Promise<TypingSession>;
  getSessionsForStudent(studentId: string): Promise<TypingSession[]>;
  getRecentSessionForStudent(studentId: string): Promise<TypingSession | undefined>;

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
  getStudentStats(studentId: string): Promise<{
    avgWpm: number;
    avgAccuracy: number;
    totalSessions: number;
    totalTime: number;
    improvement: number;
  }>;

  getWeeklyProgress(studentId: string): Promise<Array<{
    date: string;
    wpm: number;
    accuracy: number;
    timeSpent: number;
  }>>;
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

  // Lesson operations
  async getLessons(): Promise<Lesson[]> {
    return await db.select().from(lessons).orderBy(desc(lessons.createdAt));
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

  async deleteLessson(id: string): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  // Lesson assignment operations
  async getAssignmentsForStudent(studentId: string): Promise<LessonAssignment[]> {
    return await db
      .select()
      .from(lessonAssignments)
      .where(eq(lessonAssignments.studentId, studentId))
      .orderBy(desc(lessonAssignments.assignedAt));
  }

  async getAssignmentsForTeacher(teacherId: string): Promise<LessonAssignment[]> {
    return await db
      .select()
      .from(lessonAssignments)
      .where(eq(lessonAssignments.teacherId, teacherId))
      .orderBy(desc(lessonAssignments.assignedAt));
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

  async getClassroomById(id: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
    return classroom;
  }

  async createClassroom(classroom: InsertClassroom): Promise<Classroom> {
    const [newClassroom] = await db.insert(classrooms).values(classroom).returning();
    return newClassroom;
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
    await db.delete(classroomStudents).where(eq(classroomStudents.classroomId, id));
    await db.delete(classrooms).where(eq(classrooms.id, id));
  }

  async getClassroomStudents(classroomId: string): Promise<User[]> {
    const links = await db
      .select()
      .from(classroomStudents)
      .where(eq(classroomStudents.classroomId, classroomId));

    if (links.length === 0) return [];

    const studentIds = links.map(l => l.studentId);
    return await db
      .select()
      .from(users)
      .where(sql`${users.id} = ANY(${studentIds})`);
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

    const { lessonId, studentId, classroomId } = assignment[0];

    let targetStudentIds: string[] = [];
    if (studentId) {
      targetStudentIds = [studentId];
    } else if (classroomId) {
      const students = await this.getClassroomStudents(classroomId);
      targetStudentIds = students.map(s => s.id);
    }

    if (targetStudentIds.length === 0) return [];

    const activities = await db
      .select()
      .from(typingActivities)
      .where(and(
        eq(typingActivities.lessonId, lessonId),
        sql`${typingActivities.studentId} = ANY(${targetStudentIds})`
      ));

    if (activities.length === 0) {
      return [];
    }

    const activityIds = activities.map(a => a.id);

    return await db
      .select()
      .from(typingSessions)
      .where(sql`${typingSessions.activityId} = ANY(${activityIds})`)
      .orderBy(desc(typingSessions.startedAt));
  }

  // Typing activity operations
  async createTypingActivity(activity: InsertTypingActivity): Promise<TypingActivity> {
    const [newActivity] = await db.insert(typingActivities).values(activity).returning();
    return newActivity;
  }

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
  async getStudentStats(studentId: string): Promise<{
    avgWpm: number;
    avgAccuracy: number;
    totalSessions: number;
    totalTime: number;
    improvement: number;
  }> {
    const stats = await db
      .select({
        avgWpm: sql<number>`AVG(${typingSessions.wpm})::numeric`,
        avgAccuracy: sql<number>`AVG(${typingSessions.accuracy})::numeric`,
        totalSessions: sql<number>`COUNT(*)::numeric`,
        totalTime: sql<number>`SUM(${typingSessions.timeSpent})::numeric`,
      })
      .from(typingSessions)
      .where(and(eq(typingSessions.studentId, studentId), eq(typingSessions.completed, true)));

    const recentStats = await db
      .select({
        avgWpm: sql<number>`AVG(${typingSessions.wpm})::numeric`,
      })
      .from(typingSessions)
      .where(
        and(
          eq(typingSessions.studentId, studentId),
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
          eq(typingSessions.studentId, studentId),
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
      totalTime: Number(current?.totalTime || 0),
      improvement: Number(improvement.toFixed(1)),
    };
  }

  async getWeeklyProgress(studentId: string): Promise<Array<{
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
          eq(typingSessions.studentId, studentId),
          eq(typingSessions.completed, true),
          sql`${typingSessions.completedAt} >= NOW() - INTERVAL '7 days'`
        )
      )
      .groupBy(sql`DATE(${typingSessions.completedAt})`)
      .orderBy(sql`DATE(${typingSessions.completedAt})`);

    return progress.map(p => ({
      date: p.date,
      wpm: Number(p.wpm || 0),
      accuracy: Number(p.accuracy || 0),
      timeSpent: Number(p.timeSpent || 0),
    }));
  }
}

export const storage = new DatabaseStorage();
