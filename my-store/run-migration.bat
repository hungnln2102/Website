@echo off
echo ========================================
echo Running Materialized View Migration
echo ========================================
echo.

REM Database connection details
set DB_HOST=110.172.28.206
set DB_PORT=5432
set DB_NAME=mydtbmav
set DB_USER=admin

REM Path to migration file
set MIGRATION_FILE=packages\db\prisma\migrations\create_variant_sold_count_view.sql

echo Connecting to PostgreSQL...
echo Host: %DB_HOST%
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.

REM Run migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f %MIGRATION_FILE%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Add this line to apps/server/src/index.ts:
    echo    import './jobs/refresh-variant-sold-count.job';
    echo.
    echo 2. Restart the server:
    echo    npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Connection details are correct
    echo 3. You have permission to create views
    echo.
)

pause
