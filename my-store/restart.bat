@echo off
echo 🔧 Fixing and restarting my-store...

REM Kill processes on ports
echo 📌 Killing processes on ports 3001 and 4001...
npx kill-port 3001 4001 2>nul

REM Clear Vite cache
echo 🗑️  Clearing Vite cache...
if exist apps\web\node_modules\.vite rmdir /s /q apps\web\node_modules\.vite 2>nul

REM Check if node_modules exists
if not exist node_modules (
  echo 📦 Installing dependencies...
  call npm install
)

REM Sync database
echo 💾 Syncing database...
call npm run db:push

REM Start dev server
echo 🚀 Starting development server...
echo.
echo Frontend: http://localhost:4001
echo Backend API: http://localhost:4001 (same port)
echo.
call npm run dev
