@echo off
chcp 65001 >nul
echo === 게임 라이브러리 트래커 ===

set ROOT=%~dp0
set BACKEND=%ROOT%backend
set FRONTEND=%ROOT%frontend

REM --- Python 확인 ---
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 설치되어 있지 않습니다.
    echo https://www.python.org/downloads/ 에서 설치 후 다시 실행하세요.
    pause
    exit /b 1
)

REM --- Node.js 확인 ---
node --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org/ 에서 LTS 버전 설치 후 다시 실행하세요.
    pause
    exit /b 1
)

REM --- 백엔드 가상환경 ---
if not exist "%BACKEND%\.venv" (
    echo [백엔드] 가상환경 생성 중...
    python -m venv "%BACKEND%\.venv"
)

echo [백엔드] 패키지 설치 중...
"%BACKEND%\.venv\Scripts\pip" install -q -r "%BACKEND%\requirements.txt"

REM --- .env 파일 ---
if not exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    echo [백엔드] .env 파일 생성됨 (기본값: Excel 저장)
)

REM --- 프론트엔드 의존성 ---
if not exist "%FRONTEND%\node_modules" (
    echo [프론트엔드] 패키지 설치 중...
    cd /d "%FRONTEND%"
    npm install
)

echo.
echo [백엔드]    http://localhost:8000 시작 중...
start "게임라이브러리-백엔드" cmd /k "cd /d %BACKEND% && .venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

timeout /t 2 >nul

echo [프론트엔드] http://localhost:5173 시작 중...
start "게임라이브러리-프론트엔드" cmd /k "cd /d %FRONTEND% && npm run dev"

echo.
echo 브라우저에서 http://localhost:5173 을 여세요.
echo 모바일: 같은 와이파이에서 http://[PC_IP]:5173
echo.
echo 창을 닫으면 서버가 종료됩니다.
pause
