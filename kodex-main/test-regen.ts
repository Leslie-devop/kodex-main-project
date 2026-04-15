import { storage } from "./server/storage";
import { db } from "./server/db";
import { classrooms } from "./shared/schema";

async function main() {
  const c = await db.select().from(classrooms);
  if (c.length > 0) {
    try {
      const result = await storage.regenerateClassroomCode(c[0].id);
      console.log("Success:", result);
    } catch (e) {
      console.error("Error regenerating:", e);
    }
  }
  process.exit(0);
}
main();
