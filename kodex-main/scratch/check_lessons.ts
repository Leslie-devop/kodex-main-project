import { storage } from "./server/storage";

async function checkLessons() {
  const lessons = await storage.getLessonsByClassroom("none"); // or any id
  console.log("All Lessons:", lessons.map(l => ({ id: l.id, title: l.title, isStandalone: l.isStandalone, classroomId: l.classroomId })));
}

// Since I can't easily run it with the DB connection here, I'll just trust the logic update.
