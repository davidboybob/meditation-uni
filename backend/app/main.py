from __future__ import annotations
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api.posts import router as posts_router
from app.api.fines import router as fines_router
from app.api.challenges import router as challenges_router
from app.api.admin import router as admin_router


def _get_cors_origins() -> list:
    origins_env = os.getenv("CORS_ORIGINS", "")
    if origins_env:
        return [o.strip() for o in origins_env.split(",") if o.strip()]
    return ["http://localhost:5173"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="묵상대학 API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Pydantic/FastAPI 입력 검증 오류(422)를 400으로 변환한다."""
    return JSONResponse(
        status_code=400,
        content={"detail": jsonable_encoder(exc.errors())},
    )


app.include_router(posts_router, prefix="/api")
app.include_router(fines_router, prefix="/api")
app.include_router(challenges_router, prefix="/api")
app.include_router(admin_router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
