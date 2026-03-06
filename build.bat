@echo off
echo Building frontend...
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
) else (
    echo Build succeeded!
    pause
)