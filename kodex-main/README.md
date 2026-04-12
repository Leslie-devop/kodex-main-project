# Kodex - Typing Practice & Analytics Platform

A comprehensive typing skills learning management system with real-time analytics, AI-powered suggestions, and multi-role access control.

## Features

- **Multi-Role System**: Admin, Teacher, and Student dashboards
- **Real-Time Analytics**: WPM, accuracy, error tracking, keystroke analysis
- **AI-Powered Suggestions**: Personalized improvement recommendations using OpenAI GPT-4
- **Posture Detection**: Live camera-based posture monitoring during typing sessions
- **Lesson Management**: Create, edit, and assign typing lessons
- **Progress Tracking**: Detailed student progress reports and analytics
- **Assignment System**: Teachers can assign lessons to students with deadlines

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query
- **Authentication**: Session-based with role management
- **AI Integration**: OpenAI GPT-4o for typing suggestions

## Local Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- VS Code (recommended)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd kodex-typing-app
npm install
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE kodex_db;
CREATE USER kodex_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kodex_db TO kodex_user;
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://kodex_user:your_password@localhost:5432/kodex_db
PGUSER=kodex_user
PGPASSWORD=your_password
PGDATABASE=kodex_db
PGHOST=localhost
PGPORT=5432

# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY=sk-your-actual-openai-api-key

# Session Secret (generate a random 32+ character string)
SESSION_SECRET=your-very-long-random-session-secret-here

# Development Environment
NODE_ENV=development
```

### 4. Database Migration

Run the database migrations:

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5000
- Backend API: http://localhost:5000/api

### 6. Default Admin Account

After first run, you can create an admin account by registering and then manually updating the role in the database:

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

Or use the existing admin account:

- Username: `admin`
- Password: `admin123`

## Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio for database management

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components (admin, teacher, student)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configuration
│   │   └── types/         # TypeScript type definitions
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   └── services/         # Business logic services
├── shared/               # Shared types and schemas
└── database/            # Database migrations and seeds
```

## API Endpoints

### Authentication

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/auth/user` - Get current user

### Lessons

- `GET /api/lessons` - Get all lessons
- `POST /api/lessons` - Create lesson (admin/teacher)
- `PUT /api/lessons/:id` - Update lesson (admin/teacher)
- `DELETE /api/lessons/:id` - Delete lesson (admin/teacher)

### Assignments

- `GET /api/assignments/student` - Get student assignments
- `GET /api/assignments/teacher` - Get teacher assignments
- `POST /api/assignments` - Create assignment (admin/teacher)

### Analytics

- `POST /api/activities` - Record typing activity
- `GET /api/activities/student` - Get student activities
- `GET /api/teacher/progress` - Get student progress (teacher)
- `GET /api/admin/stats` - Get platform stats (admin)

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists and user has permissions

### OpenAI API Issues

- Verify API key is valid and has credits
- Check API key format starts with `sk-`

### Port Conflicts

- Default port is 5000, change in `server/index.ts` if needed
- Ensure no other applications are using the same port

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

# Test commit from my PC

### Update Log

- README updated using Cursor terminal commit (Sept 23, 2025)
