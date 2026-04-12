import { db } from "./server/db";
import { users, typingSessions, typingActivities, lessonAssignments, aiSuggestions, errorPatterns, keystrokeAnalytics, lessons } from "@shared/schema";

async function clearUsers() {
  console.log("Clearing data to reset Google Auth flow for testing...");
  try {
    // Delete depending records first
    await db.delete(keystrokeAnalytics);
    await db.delete(typingSessions);
    await db.delete(typingActivities);
    await db.delete(lessonAssignments);
    await db.delete(errorPatterns);
    await db.delete(aiSuggestions);
    await db.delete(lessons);
    
    // Delete users
    await db.delete(users);
    console.log("Success! Database cleared.");
  } catch (e) {
    console.error(e);
  }
}

clearUsers().then(() => process.exit(0));
