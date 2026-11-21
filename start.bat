@echo off
title ZTTeam VIA Management System
echo ========================================================
echo   ZTTeam VIA Management Studio (ztteam.site)
echo   Khoi dong he thong Backend & Frontend...
echo ========================================================

start "ZTTeam Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 2 /nobreak >nul
start "ZTTeam Frontend React (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo He thong da khoi dong xong!
echo Giao dien React: http://localhost:3000
echo Backend API:     http://localhost:5000
echo ========================================================
pause
