@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:5173/index.html"
  py -m http.server 5173
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:5173/index.html"
  python -m http.server 5173
  exit /b
)
start "" "%~dp0index.html"
