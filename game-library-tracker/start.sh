#!/usr/bin/env bash
# 게임 라이브러리 트래커 실행 스크립트

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "=== 게임 라이브러리 트래커 ==="

# Backend venv
if [ ! -d "$BACKEND/.venv" ]; then
  echo "[백엔드] 가상환경 생성 중..."
  python3 -m venv "$BACKEND/.venv"
fi

echo "[백엔드] 패키지 설치 중..."
"$BACKEND/.venv/bin/pip" install -q -r "$BACKEND/requirements.txt"

# .env 없으면 .env.example 복사
if [ ! -f "$BACKEND/.env" ]; then
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo "[백엔드] .env 파일 생성됨 (기본값: Excel 저장)"
fi

# Frontend 의존성
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "[프론트엔드] 패키지 설치 중..."
  cd "$FRONTEND" && npm install
fi

echo ""
echo "[백엔드] http://localhost:8000 에서 시작 중..."
cd "$BACKEND"
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[프론트엔드] http://localhost:5173 에서 시작 중..."
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "브라우저에서 http://localhost:5173 을 여세요."
echo "모바일: 같은 와이파이에서 http://<PC_IP>:5173"
echo "종료: Ctrl+C"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
