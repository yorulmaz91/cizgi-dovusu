@echo off
chcp 65001 >nul
title CIZGI DOVUSU - telefondan test tuneli
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-tunnel.ps1"
echo.
pause
