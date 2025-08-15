from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.cors import CORSMiddleware
from app.utils.logger import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip logging untuk health checks dan static files
        skip_paths = ["/health", "/docs", "/redoc", "/openapi.json"]
        if not any(request.url.path.startswith(path) for path in skip_paths):
            logger.info(f"Request: {request.method} {request.url.path}")

        response = await call_next(request)

        if not any(request.url.path.startswith(path) for path in skip_paths):
            logger.info(
                f"Response: {request.method} {request.url.path} - {response.status_code}")

        return response


def add_cors_middleware(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://www.taskforgealvin.fun",
                       "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
