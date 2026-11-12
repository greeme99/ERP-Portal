@echo off
chcp 65001 > nul
title 그린전자 Standard ERP Portal - SQLite DB 자동 백업
cd /d "%~dp0"

echo ============================================================================
echo  [그린전자 Standard ERP Portal] SQLite (WAL) 데이터베이스 온라인 핫백업
echo ============================================================================
node erp-portal\scripts\backup-sqlite.mjs
echo ============================================================================
if "%1"=="--silent" exit /b 0
pause

