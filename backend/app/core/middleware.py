from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from starlette.responses import JSONResponse

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # We allow * for CORS for local dev, so CSP needs to be a bit relaxed for API.
        # But generally, for API responses, CSP isn't strictly necessary if it's purely JSON.
        # For security completeness:
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response

class MaxUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int = 10 * 1024 * 1024): # 10 MB limit
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_upload_size:
            return JSONResponse(status_code=413, content={"detail": "Payload Too Large: Exceeds 10MB limit."})
        return await call_next(request)
