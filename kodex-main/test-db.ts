import dotenv from 'dotenv';
dotenv.config();

import { db } from './server/db.ts';
import { lessons, lessonAssignments } from './shared/schema.ts';

async function test() {
    const allLessons = await db.select().from(lessons);
    console.log('Lessons count:', allLessons.length);
    console.dir(allLessons.map(l => ({ id: l.id, title: l.title, isStandalone: l.isStandalone })).slice(-5), { depth: null });
    
    const allAssignments = await db.select().from(lessonAssignments);
    console.log('Assignments count:', allAssignments.length);
    console.dir(allAssignments.slice(-5), { depth: null });
    process.exit(0);
}
test().catch(console.error);
