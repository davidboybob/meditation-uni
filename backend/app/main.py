from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.posts import router as posts_router
from app.api.fines import router as fines_router

app = FastAPI(title="묵상대학 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(posts_router, prefix="/api")
app.include_router(fines_router, prefix="/api")

@app.get("/api/health")
async def health():
    return {"status": "ok"}
