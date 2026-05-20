import sys
import os
import threading
import webbrowser

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import games, ocr, storage, export
from deps import get_storage

# PyInstaller frozen 환경 감지 및 경로 설정
if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
    STATIC_DIR = os.path.join(sys._MEIPASS, 'static')
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    STATIC_DIR = os.path.join(BASE_DIR, '..', 'frontend', 'dist')

app = FastAPI(title="Game Library Tracker API", version="1.0.0")

# CORS – allow localhost on common dev ports AND any local-network address
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://192\.168\.\d+\.\d+(:\d+)?",  # local network
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(games.router)
app.include_router(ocr.router)
app.include_router(storage.router)
app.include_router(export.router)


@app.get("/api/health")
def health():
    """Return service health and current storage type."""
    from config import settings
    return {"status": "ok", "storage_type": settings.storage_type}


# 빌드된 프론트엔드 정적 파일 서빙 (API 라우터 등록 후 마지막에 마운트)
if os.path.exists(STATIC_DIR):
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")


def _open_browser():
    import time
    time.sleep(1.5)
    webbrowser.open("http://localhost:8000")


if __name__ == "__main__":
    import uvicorn
    threading.Thread(target=_open_browser, daemon=True).start()
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
