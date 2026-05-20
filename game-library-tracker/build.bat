@echo off
chcp 65001 >nul
echo === GameLibrary 빌드 시작 ===

REM 1. 프론트엔드 빌드
echo [1/3] 프론트엔드 빌드 중...
cd frontend
call npm run build
if errorlevel 1 (
    echo [오류] 프론트엔드 빌드 실패
    pause
    exit /b 1
)
cd ..

REM 2. PyInstaller 실행
echo [2/3] 백엔드 패키징 중...
cd backend
pip install pyinstaller
pyinstaller GameLibrary.spec --clean --noconfirm
if errorlevel 1 (
    echo [오류] PyInstaller 패키징 실패
    pause
    exit /b 1
)
cd ..

REM 3. 결과물 정리
echo [3/3] 결과물 정리 중...
if not exist dist mkdir dist
xcopy /E /I /Y backend\dist\GameLibrary dist\GameLibrary

REM .env.example 을 .env 로 복사 (이미 있으면 덮어쓰지 않음)
if not exist dist\GameLibrary\.env (
    copy backend\.env.example dist\GameLibrary\.env
)

echo.
echo === 빌드 완료 ===
echo dist\GameLibrary\ 폴더를 USB나 원하는 위치에 복사하세요.
echo GameLibrary.exe 를 더블클릭하면 실행됩니다.
pause
