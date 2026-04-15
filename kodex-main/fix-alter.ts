import { db } from './server/db.ts';
import { sql } from 'drizzle-orm';
async function run() {
    await db.execute(sqlALTER TABLE lesson_assignments ADD COLUMN feedback text;);
    console.log("added feedback column");
    process.exit(0);
}
run().catch(console.error);
