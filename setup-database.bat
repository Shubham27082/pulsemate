@echo off
echo ========================================
echo   PulseMate - Database Setup
echo ========================================
echo.
echo STEP 1: Make sure PostgreSQL is running
echo STEP 2: Update DATABASE_URL in backend\.env
echo.
cd backend
echo Generating Prisma client...
call npx prisma generate
echo Running committed database migrations...
call npx prisma migrate deploy
echo.
echo Seeding sample data...
call node prisma/seed.js
echo.
echo ========================================
echo   Database ready!
echo ========================================
echo.
echo Test credentials (Password: Password@123):
echo   Super Admin  : +919000000001
echo   Clinic Owner : +919000000002
echo   Doctor 1     : +919000000003
echo   Doctor 2     : +919000000004
echo   Receptionist : +919000000005
echo   Patient 1    : +919000000006 (OTP login)
echo   Patient 2    : +919000000007 (OTP login)
echo   Patient 3    : +919000000008 (OTP login)
echo.
pause
