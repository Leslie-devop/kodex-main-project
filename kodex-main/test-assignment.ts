import { insertLessonAssignmentSchema } from './shared/schema.ts';

const payload = {
    lessonId: '8c0df0f0-8970-4936-8082-7209aa8a137c',
    studentId: '4f1ca5f3-1a08-4f16-983e-fdff76a5c090',
    classroomId: null,
    dueDate: null,
    teacherId: '4f1ca5f3-1a08-4f16-983e-fdff76a5c090',
    status: "pending",
    maxAttempts: 0,
    allowBackspace: true
};

try {
    const parsed = insertLessonAssignmentSchema.parse(payload);
    console.log('Parsed:', parsed);
} catch (e) {
    console.log('Error:', JSON.stringify(e.errors, null, 2));
}
