@echo off
chcp 65001 > nul
title NeuroSpeed - Local AI Benchmark (Development Mode)
cd /d "%~dp0"

echo ================================================================
echo    ⚡ NEUROSPEED - DEVELOPMENT MODE (HOT RELOAD)
echo ================================================================
echo.

if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
    echo.
)

echo [START] Starting Vite Dev Server & Electron Watcher...
echo.
call npm run electron:dev
pause
