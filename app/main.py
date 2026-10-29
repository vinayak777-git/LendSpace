from contextlib import asynccontextmanager
import logging
from pathlib import Path
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.api.v1.router import api_v1_router
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.db.base import Base
from app.db.session import async_engine
from app.jobs.scheduler import start_scheduler, stop_scheduler

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: initialize database tables, seed demo data, start background scheduler."""
    db_desc = settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
    logger.info(f"Initializing LendSpace backend services with unified DB: {db_desc}")

    # Ensure uploads and local outbox directories exist
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.OUTBOX_DIR).mkdir(parents=True, exist_ok=True)

    # Initialize tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start APScheduler for background jobs
    scheduler = start_scheduler()

    yield

    # Shutdown
    logger.info("Shutting down LendSpace backend services...")
    stop_scheduler()
    await async_engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Production-grade backend for LendSpace: trusted platform for sharing underused spaces and equipment.",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware for React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Domain exception handlers
register_error_handlers(app)

# Mount primary API router
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Mount uploads static folder if directory exists
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/health", tags=["Health"])
async def health_liveness():
    """Liveness probe: verifies application process and database status."""
    db_status = "connected"
    http_status = status.HTTP_200_OK
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning(f"Database health check failed: {type(e).__name__}")
        db_status = "unavailable"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content={
            "status": "healthy" if db_status == "connected" else "degraded",
            "service": settings.PROJECT_NAME,
            "environment": settings.ENVIRONMENT,
            "database": db_status,
        },
    )


@app.get("/health/ready", tags=["Health"])
async def health_readiness():
    """Readiness probe: verifies database connectivity and schema readiness."""
    db_status = "connected"
    http_status = status.HTTP_200_OK
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.warning(f"Database readiness probe failed: {type(e).__name__}")
        db_status = "unavailable"
        http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=http_status,
        content={
            "status": "ready" if db_status == "connected" else "not_ready",
            "service": settings.PROJECT_NAME,
            "database": db_status,
        },
    )


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "documentation": f"{settings.API_V1_STR}/docs",
        "version": "1.0.0",
    }
