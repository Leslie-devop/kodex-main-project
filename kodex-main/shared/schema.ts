import { sql } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  integer, 
  decimal, 
  boolean, 
  jsonb,
  index,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["teacher", "student"]);

// Users table for local auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role"), // Nullable initially to force onboarding
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verificationCode: varchar("verification_code"),
  verificationExpiry: timestamp("verification_expiry"),
  isVerified: boolean("is_verified").default(false),
  hasConsent: boolean("has_consent").default(false),
  isPushVerified: boolean("is_push_verified").default(false),
});

// Lessons table
export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  difficulty: varchar("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced
  estimatedTime: integer("estimated_time"), // in minutes
  maxAttempts: integer("max_attempts").notNull().default(0), // 0 for unlimited
  timeLimit: integer("time_limit"), // in seconds
  createdBy: varchar("created_by").notNull().references(() => users.id),
  classroomId: varchar("classroom_id").references(() => classrooms.id), // Nullable for general lessons
  isPublic: boolean("is_public").default(false),
  isStandalone: boolean("is_standalone").default(false),
  allowBackspace: boolean("allow_backspace").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classrooms table
export const classrooms = pgTable("classrooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  section: varchar("section"),
  inviteCode: varchar("invite_code").unique().notNull().default(sql`substring(md5(random()::text) from 1 for 6)`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Classroom students (roster)
export const classroomStudents = pgTable("classroom_students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: varchar("classroom_id").notNull().references(() => classrooms.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Classroom announcements
export const classroomAnnouncements = pgTable("classroom_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: varchar("classroom_id").notNull().references(() => classrooms.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classroom modules (files/links)
export const classroomModules = pgTable("classroom_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  classroomId: varchar("classroom_id").notNull().references(() => classrooms.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull().default("file"), // file, link
  url: text("url").notNull(), // Change to text as it may contain base64 payload
  createdAt: timestamp("created_at").defaultNow(),
});

// Lesson assignments table
export const lessonAssignments = pgTable("lesson_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id),
  studentId: varchar("student_id").references(() => users.id), // Nullable if assigned to classroom
  classroomId: varchar("classroom_id").references(() => classrooms.id), // Nullable if assigned to student
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  dueDate: timestamp("due_date"),
  allowBackspace: boolean("allow_backspace").default(true),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, completed, overdue
  progress: decimal("progress", { precision: 5, scale: 2 }).notNull().default("0.00"), // 0-100%
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  feedback: text("feedback"),
  maxAttempts: integer("max_attempts").notNull().default(0), // 0 for unlimited, overrides lesson.maxAttempts
  timeLimit: integer("time_limit"), // overrides lesson.timeLimit if set
});

// Typing activities table
export const typingActivities = pgTable("typing_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  timeLimit: integer("time_limit"), // in seconds
  minAccuracy: decimal("min_accuracy", { precision: 5, scale: 2 }).default("85.00"), // minimum accuracy required
  minWpm: integer("min_wpm").default(60), // minimum WPM required
  createdAt: timestamp("created_at").defaultNow(),
});

// Typing sessions table
export const typingSessions = pgTable("typing_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  activityId: varchar("activity_id").references(() => typingActivities.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  text: text("text"),
  wpm: decimal("wpm", { precision: 5, scale: 2 }),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  errors: integer("errors").default(0),
  timeSpent: integer("time_spent"), // in seconds
  completed: boolean("completed").default(false),
  assignmentId: varchar("assignment_id").references(() => lessonAssignments.id),
  passed: boolean("passed").default(false), // met requirements
  keystrokeData: jsonb("keystroke_data"), // detailed keystroke analysis
  postureScore: integer("posture_score").default(100), // 0-100 AI alignment score
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Keystroke analytics table
export const keystrokeAnalytics = pgTable("keystroke_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => typingSessions.id),
  studentId: varchar("student_id").notNull().references(() => users.id),
  keyPressed: varchar("key_pressed").notNull(),
  timingMs: integer("timing_ms"), // time to press key in ms
  wasError: boolean("was_error").default(false),
  fingerUsed: varchar("finger_used"), // thumb, index, middle, ring, pinky
  createdAt: timestamp("created_at").defaultNow(),
});

// AI suggestions table
export const aiSuggestions = pgTable("ai_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // posture, technique, practice
  content: text("content").notNull(),
  priority: varchar("priority").default("medium"), // low, medium, high
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Error patterns table
export const errorPatterns = pgTable("error_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  pattern: varchar("pattern").notNull(), // e.g., "th → teh"
  errorType: varchar("error_type").notNull(), // swap, missing, extra
  frequency: integer("frequency").default(1),
  lastOccurrence: timestamp("last_occurrence").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // assignment_created, assignment_completed, lesson_created, module_uploaded
  message: text("message").notNull(),
  relatedId: varchar("related_id"), // assignmentId, lessonId, moduleId
  classroomId: varchar("classroom_id").references(() => classrooms.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  createdLessons: many(lessons),
  lessonAssignments: many(lessonAssignments),
  typingSessions: many(typingSessions),
  aiSuggestions: many(aiSuggestions),
  errorPatterns: many(errorPatterns),
  classrooms: many(classrooms),
  notifications: many(notifications),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  teacher: one(users, {
    fields: [classrooms.teacherId],
    references: [users.id],
  }),
  students: many(classroomStudents),
  assignments: many(lessonAssignments),
}));

export const classroomStudentsRelations = relations(classroomStudents, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomStudents.classroomId],
    references: [classrooms.id],
  }),
  student: one(users, {
    fields: [classroomStudents.studentId],
    references: [users.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  creator: one(users, {
    fields: [lessons.createdBy],
    references: [users.id],
  }),
  assignments: many(lessonAssignments),
  activities: many(typingActivities),
}));

export const lessonAssignmentsRelations = relations(lessonAssignments, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonAssignments.lessonId],
    references: [lessons.id],
  }),
  student: one(users, {
    fields: [lessonAssignments.studentId],
    references: [users.id],
  }),
  teacher: one(users, {
    fields: [lessonAssignments.teacherId],
    references: [users.id],
  }),
  classroom: one(classrooms, {
    fields: [lessonAssignments.classroomId],
    references: [classrooms.id],
  }),
}));

export const typingSessionsRelations = relations(typingSessions, ({ one, many }) => ({
  activity: one(typingActivities, {
    fields: [typingSessions.activityId],
    references: [typingActivities.id],
  }),
  student: one(users, {
    fields: [typingSessions.studentId],
    references: [users.id],
  }),
  keystrokeAnalytics: many(keystrokeAnalytics),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  classroom: one(classrooms, {
    fields: [notifications.classroomId],
    references: [classrooms.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = insertUserSchema.pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const loginUserSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassroomAnnouncementSchema = createInsertSchema(classroomAnnouncements).omit({ 
  id: true,
  createdAt: true
});

export type InsertClassroomAnnouncement = z.infer<typeof insertClassroomAnnouncementSchema>;
export type ClassroomAnnouncement = typeof classroomAnnouncements.$inferSelect;

export const insertClassroomModuleSchema = createInsertSchema(classroomModules).omit({ 
  id: true,
  createdAt: true
});

export type InsertClassroomModule = z.infer<typeof insertClassroomModuleSchema>;
export type ClassroomModule = typeof classroomModules.$inferSelect;

export const insertLessonAssignmentSchema = createInsertSchema(lessonAssignments).extend({
  dueDate: z.any().transform(v => {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }),
}).omit({
  id: true,
  assignedAt: true,
});

export const insertTypingActivitySchema = createInsertSchema(typingActivities).omit({
  id: true,
  createdAt: true,
});

export const insertTypingSessionSchema = createInsertSchema(typingSessions).omit({
  id: true,
  startedAt: true,
});

export const insertKeystrokeAnalyticsSchema = createInsertSchema(keystrokeAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertAISuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  createdAt: true,
});

export const insertErrorPatternSchema = createInsertSchema(errorPatterns).omit({
  id: true,
  lastOccurrence: true,
});

export const insertClassroomSchema = createInsertSchema(classrooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClassroomStudentSchema = createInsertSchema(classroomStudents).omit({
  id: true,
  joinedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

export type LessonAssignment = typeof lessonAssignments.$inferSelect;
export type InsertLessonAssignment = z.infer<typeof insertLessonAssignmentSchema>;

export type TypingActivity = typeof typingActivities.$inferSelect;
export type InsertTypingActivity = z.infer<typeof insertTypingActivitySchema>;

export type TypingSession = typeof typingSessions.$inferSelect;
export type InsertTypingSession = z.infer<typeof insertTypingSessionSchema>;

export type KeystrokeAnalytics = typeof keystrokeAnalytics.$inferSelect;
export type InsertKeystrokeAnalytics = z.infer<typeof insertKeystrokeAnalyticsSchema>;

export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAISuggestion = z.infer<typeof insertAISuggestionSchema>;

export type ErrorPattern = typeof errorPatterns.$inferSelect;
export type InsertErrorPattern = z.infer<typeof insertErrorPatternSchema>;

export type Classroom = typeof classrooms.$inferSelect;
export type InsertClassroom = z.infer<typeof insertClassroomSchema>;

export type ClassroomStudent = typeof classroomStudents.$inferSelect;
export type InsertClassroomStudent = z.infer<typeof insertClassroomStudentSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

