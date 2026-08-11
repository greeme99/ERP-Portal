@echo off
setlocal
title Standard ERP Portal - Dev Server
cd /d "%~dp0erp-portal"

echo ============================================
echo   Standard ERP Portal - Dev Server
echo ============================================
echo.
echo Working folder:
cd
echo.

where node >nul 2>nul
if errorlevel 1 goto NO_NODE
where npm >nul 2>nul
if errorlevel 1 goto NO_NPM
if not exist "package.json" goto NO_PKG

if exist "node_modules\.bin\vite.cmd" goto RUN

echo [1/2] Installing dependencies for the first time.
echo.
echo   *** IMPORTANT ***
echo   This downloads about 137 packages and can take 2 to 5 minutes
echo   on a corporate network. The spinning bar is NORMAL, not frozen.
echo   Please DO NOT press Ctrl+C. Just wait until it finishes.
echo.
call npm install --no-audit --no-fund

if not exist "node_modules\.bin\vite.cmd" goto INSTALL_FAIL
echo.
echo [OK] Dependencies installed.
echo.

:RUN
echo [2/2] Starting dev server - browser opens automatically.
echo       URL: http://localhost:5180
echo       Press Ctrl+C in this window to stop the server.
echo.
call npm run dev
echo.
echo Server stopped.
pause
exit /b 0

:NO_NODE
echo [ERROR] Node.js not found.
echo         Install Node.js LTS from https://nodejs.org then run again.
echo.
pause
exit /b 1

:NO_NPM
echo [ERROR] npm not found. Reinstall Node.js LTS.
echo.
pause
exit /b 1

:NO_PKG
echo [ERROR] package.json not found in this folder.
echo         Keep this .bat file next to the erp-portal folder.
echo.
pause
exit /b 1

:INSTALL_FAIL
echo.
echo [ERROR] Dependency install did not finish successfully.
echo         This is usually a corporate proxy or SSL problem.
echo.
echo         Step 1: run this command in this window:
echo             npm config set registry https://registry.npmjs.org/
echo         Step 2: run the install again:
echo             npm install --no-audit --no-fund
echo.
echo         If you get a certificate error such as
echo         UNABLE_TO_VERIFY_LEAF_SIGNATURE, ask IT for the proxy,
echo         or as a last resort:  npm config set strict-ssl false
echo.
echo         Then double-click this .bat again.
echo.
pause
exit /b 1
