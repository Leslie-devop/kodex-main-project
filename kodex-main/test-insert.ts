import { db } from './server/db.ts';
import { lessons, users } from './shared/schema.ts';

async function test() {
    const allUsers = await db.select().from(users);
    if(allUsers.length === 0) return process.exit(1);

    const [lesson] = await db.insert(lessons).values({
        title: 'DB Test',
        content: 'Content',
        createdBy: allUsers[0].id,
        isStandalone: true
    }).returning();
    
    console.log('Inserted:', lesson);
    process.exit(0);
}
test().catch(console.error);
