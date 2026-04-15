import { db } from "./server/db";
import { typingSessions } from "./shared/schema";
import { desc } from "drizzle-orm";

async function check() {
  const sessions = await db.select().from(typingSessions).orderBy(desc(typingSessions.startedAt)).limit(5);
  console.log(JSON.stringify(sessions, null, 2));
}

check().catch(console.error);
