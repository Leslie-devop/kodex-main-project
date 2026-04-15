import { db } from './server/db.ts';
import { lessonAssignments, users, lessons } from './shared/schema.ts';

async function test() {
    const defaultUser = await db.select().from(users);
    const defaultLesson = await db.select().from(lessons);
    
    if(!defaultUser.length || !defaultLesson.length) return process.exit(1);

    const [assignment] = await db.insert(lessonAssignments).values({
        lessonId: defaultLesson[0].id,
        studentId: defaultUser[0].id,
        teacherId: defaultUser[0].id,
        status: 'pending'
    }).returning();
    
    console.log('Inserted Assignment:', assignment);
    process.exit(0);
}
test().catch(console.error);
