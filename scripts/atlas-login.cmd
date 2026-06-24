@echo off
title MongoDB Atlas Setup - Lohiya Suppliers
cd /d "%~dp0.."
echo.
echo ============================================================
echo  Lohiya Suppliers - MongoDB Atlas cloud database setup
echo ============================================================
echo.
echo  Removing old API keys so browser login works...
cmdkey /delete:LegacyGeneric:target=atlascli_default:public_api_key >nul 2>&1
cmdkey /delete:LegacyGeneric:target=atlascli_default:private_api_key >nul 2>&1
echo.
where atlas >nul 2>&1
if errorlevel 1 (
  echo Atlas CLI not found. Run: winget install MongoDB.MongoDBAtlasCLI
  pause
  exit /b 1
)
echo  STEP 1 - In this window:
echo    - Choose "UserAccount" and press Enter
echo    - Copy the activation code shown here
echo.
echo  STEP 2 - In the browser:
echo    - Sign in if asked
echo    - Paste the activation code and click Confirm Authorization
echo    - Wait until you see success, then return HERE
echo.
atlas auth login
if errorlevel 1 (
  echo Login failed.
  pause
  exit /b 1
)
echo.
echo Verifying Atlas API access...
atlas projects list >nul 2>&1
if errorlevel 1 (
  echo.
  echo  API access failed. The browser step may be incomplete.
  echo  Run this script again: npm run atlas:login
  pause
  exit /b 1
)
atlas auth whoami
echo.
echo Creating project, cluster, database user, and seeding data...
call npm run db:atlas
if errorlevel 1 (
  echo Setup failed. See errors above.
  pause
  exit /b 1
)
echo.
echo ============================================================
echo  Atlas database is ready.
echo  Start the site: npm run dev
echo ============================================================
pause
