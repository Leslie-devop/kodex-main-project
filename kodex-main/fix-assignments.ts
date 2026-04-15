import { db } from './server/db.ts';
import { lessons, users, lessonAssignments } from './shared/schema.ts';
import { eq, ilike } from 'drizzle-orm';

async function verify() {
    const defaultUser = await db.select().from(users).where(eq(users.role, 'teacher'));
    if(!defaultUser.length) { console.log('no teacher'); return process.exit(1); }
    
    // Create actual assignments for the standalone lessons we fixed!
    const standaloneLessons = await db.select().from(lessons).where(ilike(lessons.title, 'Assignment%'));
    
    let assignedCount = 0;
    for (const lesson of standaloneLessons) {
        // Find if assignment already exists
        const existing = await db.select().from(lessonAssignments).where(eq(lessonAssignments.lessonId, lesson.id));
        if (existing.length === 0) {
            // Assign to the teacher's classroom students or just a default assignment
            await db.insert(lessonAssignments).values({
                lessonId: lesson.id,
                teacherId: defaultUser[0].id,
                status: 'pending'
            });
            assignedCount++;
        }
    }
    
    console.log('Created missing assignments:', assignedCount);
    process.exit(0);
}
verify().catch(console.error);
