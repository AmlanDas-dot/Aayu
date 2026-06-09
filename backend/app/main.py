from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.transcribe import router as transcribe_router

app = FastAPI(title="AAYU Backend")

# ---------------------------------------------------------------------------
# CORS — allow requests from the Vite dev server (port 5173) and any
# production origin you deploy to.  Adjust origins before deploying publicly.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev
        "http://localhost:3000",   # Alternative dev ports
        "http://localhost:4173",   # Vite preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcribe_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "service": "AAYU Backend",
    }