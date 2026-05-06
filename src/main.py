from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import api_router, mcp_router
from src.bootstrap import bootstrap_database
from src.core.settings import settings

bootstrap_database()

app = FastAPI(title=settings.app.name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
app.include_router(mcp_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
