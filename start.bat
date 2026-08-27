@echo off
chcp 65001 > nul
title NeuroSpeed - Local AI TPS & Tool Benchmark
cd /d "%~dp0"

echo ================================================================
echo    ⚡ NEUROSPEED - LOCAL AI BENCHMARK (TPS & TOOLS)
echo ================================================================
echo.

:: Check node_modules
if not exist "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
    echo.
)

:: Check build output
if not exist "dist\" (
    echo [INFO] Building renderer and backend assets...
    call npm run build
    echo.
)

if not exist "dist-electron\electron\main.js" (
    echo [INFO] Compiling electron main process...
    call npm run build:electron
    echo.
)

echo [READY] Launching Desktop Application...
echo.
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Application encountered an issue during runtime.
    pause
)
