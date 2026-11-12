@echo off
chcp 65001 > nul
title 그린전자 Standard ERP Portal - Desktop PC SQLite 통합 서버 (Port 8080)
cd /d "%~dp0"

echo ============================================================================
echo  [그린전자 Standard ERP Portal] Desktop PC 기반 SQLite(WAL) 통합 서버 구동
echo ============================================================================
echo.

if not exist "erp-portal\dist\index.html" (
    echo [1/3] 프론트엔드 프로덕션 번들(dist) 빌드를 수행합니다...
    call npm --prefix erp-portal run build
) else (
    echo [1/3] 프론트엔드 빌드(erp-portal\dist)가 확인되었습니다.
)

if not exist "erp-portal\data\erp.db" (
    echo [2/3] 기준정보(MDM 12종) 및 초기 운영 데이터를 SQLite DB에 시딩합니다...
    call npm --prefix erp-portal run seed
) else (
    echo [2/3] SQLite DB(erp-portal\data\erp.db)가 확인되었습니다.
)

echo.
echo [3/3] 사내 접속용 IPv4 주소 안내 (30명 클라이언트 공유용):
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    echo    - 사내 접속 URL: http://%%a:8080
)
echo    - 로컬 접속 URL: http://localhost:8080
echo ============================================================================
echo.

set PORT=8080
set HOST=0.0.0.0
set ALLOWED_ORIGINS=*
node erp-portal\server\index.mjs
pause

