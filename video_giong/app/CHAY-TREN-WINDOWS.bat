@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === PHAT THANH NOI BO ===
node --version >nul 2>&1
if errorlevel 1 (
  echo Chua cai Node.js. Tai ban LTS tai https://nodejs.org/ roi chay lai file nay.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Lan dau chay: dang cai thu vien...
  call npm install
)
python -c "import vieneu" >nul 2>&1
if errorlevel 1 (
  echo.
  echo [Tuy chon] Chua co giong doc offline VieNeu. App van dung duoc giong online.
  echo De co 25 giong offline: cai Python 3.10+ roi chay:  pip install vieneu
  echo.
)
start "" "http://localhost:4173"
node server.mjs
pause
