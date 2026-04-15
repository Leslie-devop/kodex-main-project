const { db } = require('./server/db');
const { lessons, lessonAssignments } = require('./shared/schema');

async function test() {
    const allLessons = await db.select().from(lessons);
    console.log('Lessons count:', allLessons.length);
    console.dir(allLessons.slice(0, 5), { depth: null });
    
    const allAssignments = await db.select().from(lessonAssignments);
    console.log('Assignments count:', allAssignments.length);
    console.dir(allAssignments.slice(0, 5), { depth: null });
    process.exit(0);
}
test().catch(console.error);
