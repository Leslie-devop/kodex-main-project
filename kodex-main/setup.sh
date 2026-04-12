#!/bin/bash

echo "🚀 Setting up Kodex Typing Practice Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual database credentials and API keys!"
    echo "   - Set your PostgreSQL database URL"
    echo "   - Add your OpenAI API key"
    echo "   - Generate a random session secret"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your credentials:"
echo "   - DATABASE_URL: Your PostgreSQL connection string"
echo "   - OPENAI_API_KEY: Your OpenAI API key (get from https://platform.openai.com/)"
echo "   - SESSION_SECRET: A long random string for session security"
echo ""
echo "2. Create the database:"
echo "   createdb kodex_db"
echo ""
echo "3. Run database migrations:"
echo "   npm run db:push"
echo ""
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "5. Open http://localhost:5000 in your browser"
echo ""
echo "📚 For more information, see README.md"
echo "✨ Happy coding!"