#!/bin/bash

echo "🔧 Fixing and restarting my-store..."

# Kill processes on ports
echo "📌 Killing processes on ports 3001 and 4001..."
npx kill-port 3001 4001 2>/dev/null || true

# Clear Vite cache
echo "🗑️  Clearing Vite cache..."
rm -rf apps/web/node_modules/.vite 2>/dev/null || true

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Sync database
echo "💾 Syncing database..."
npm run db:push

# Start dev server
echo "🚀 Starting development server..."
echo ""
echo "Frontend: http://localhost:4001"
echo "Backend API: http://localhost:4001 (same port)"
echo ""
npm run dev
