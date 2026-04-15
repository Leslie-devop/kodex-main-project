import { db } from './server/db.ts';
import { lessons } from './shared/schema.ts';
import { ilike } from 'drizzle-orm';

async function fix() {
    const updated = await db
        .update(lessons)
        .set({ isStandalone: true })
        .where(ilike(lessons.title, 'Assignment%'))
        .returning();
    
    console.log('Fixed lessons:', updated.length);
    process.exit(0);
}
fix().catch(console.error);
