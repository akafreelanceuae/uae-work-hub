"""
UAE Work Hub AI Service - FastAPI application with Arabic NLP and transcription
Focus: GCC compliance, cultural intelligence, and Arabic dialect processing
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog
import uvicorn
from prometheus_client import make_asgi_app

from .routers import transcription, cultural, nlp
from .services.health import get_health_status

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="ISO"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    logger.info("Starting UAE Work Hub AI Service")
    
    # Initialize AI models and services here
    try:
        logger.info("Loading Arabic NLP models...")
        # TODO: Load pre-trained models for Arabic transcription
        # TODO: Initialize UAE cultural calendar data
        # TODO: Setup Redis connection for caching
        logger.info("AI service initialization complete")
        yield
    except Exception as e:
        logger.error("Failed to initialize AI service", error=str(e))
        raise
    finally:
        logger.info("Shutting down UAE Work Hub AI Service")

# Create FastAPI app with UAE-specific metadata
app = FastAPI(
    title="UAE Work Hub AI Service",
    description="""
    GCC-compliant AI service providing:
    - Arabic transcription with UAE dialect support
    - Cultural calendar intelligence (Ramadan, UAE holidays)
    - NLP for Gulf Arabic processing
    - Integration with Dubai 2040 Plan APIs
    """,
    version="0.1.0",
    contact={
        "name": "UAE Work Hub AI Team",
        "email": "ai@uaeworkhub.ae",
    },
    license_info={
        "name": "Proprietary - UAE Work Hub",
    },
    lifespan=lifespan
)

# CORS middleware for cross-origin requests from UAE Work Hub frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "http://localhost:5173",  # Vite dev server
        "https://uaeworkhub.ae",  # Production domain
        "https://*.uaeworkhub.ae",  # UAE subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compression middleware for Arabic text responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(transcription.router, prefix="/api/v1/transcription", tags=["transcription"])
app.include_router(cultural.router, prefix="/api/v1/cultural", tags=["cultural-intelligence"])
app.include_router(nlp.router, prefix="/api/v1/nlp", tags=["arabic-nlp"])

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/health")
async def health_check():
    """Health check endpoint for UAE cloud deployment"""
    try:
        health_status = await get_health_status()
        return {
            "status": "healthy",
            "service": "uae-work-hub-ai",
            "version": "0.1.0",
            "timestamp": health_status["timestamp"],
            "checks": health_status
        }
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/")
async def root():
    """Root endpoint with Arabic greeting"""
    return {
        "message": "مرحباً بكم في خدمة الذكاء الاصطناعي لمركز العمل الإماراتي",
        "message_en": "Welcome to UAE Work Hub AI Service",
        "service": "uae-work-hub-ai",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_config={
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "()": "uvicorn.logging.DefaultFormatter",
                    "fmt": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "formatter": "default",
                    "class": "logging.StreamHandler",
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {
                "level": "INFO",
                "handlers": ["default"],
            },
        }
    )
