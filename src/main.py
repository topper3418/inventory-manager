from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from src.api.routes import api_router, mcp_router
from src.bootstrap import bootstrap_database
from src.core.settings import settings
from src.db.session import engine

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
def health(response: Response) -> dict[str, str]:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        response.status_code = 503
        return {"status": "unhealthy"}
    return {"status": "ok"}
