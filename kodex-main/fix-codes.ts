import { db } from "./server/db";
import { classrooms } from "./shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const allClassrooms = await db.select().from(classrooms);
  console.log(`Found ${allClassrooms.length} classrooms`);
  
  for (const c of allClassrooms) {
    if (!c.inviteCode || c.inviteCode === "N/A" || c.inviteCode === "") {
      console.log(`Fixing classroom ${c.id}`);
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await db.update(classrooms).set({ inviteCode: newCode }).where(eq(classrooms.id, c.id));
    }
  }
  console.log("Done");
  process.exit(0);
}

main().catch(console.error);
