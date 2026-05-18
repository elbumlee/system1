from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import games, ocr, storage, export
from deps import get_storage

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
