import { db } from "./server/db";
import { classrooms } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const c = await db.select().from(classrooms);
  console.log("FROM DB", c[0]);
  process.exit(0);
}
main();
