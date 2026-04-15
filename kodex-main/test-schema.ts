import { insertLessonSchema } from './shared/schema.ts';
const payload = {
    title: 'Test',
    content: 'Content',
    isStandalone: true,
    createdBy: 'test'
};
try {
    const parsed = insertLessonSchema.parse(payload);
    console.log('Parsed:', parsed);
} catch (e) {
    console.log('Error:', e.errors);
}
