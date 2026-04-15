import { db } from './server/db.ts';
import { lessonAssignments } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
export async function test() {
    console.log("Checking DB...");
}
test().catch(console.error);
