import { db } from "./server/db";
import { classrooms } from "./shared/schema";

async function main() {
  const allClassrooms = await db.select().from(classrooms);
  console.log(allClassrooms);
  process.exit(0);
}

main().catch(console.error);
