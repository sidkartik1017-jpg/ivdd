"""Central configuration, loaded from environment variables.

Copy `.env.example` to `.env` and fill in values, or export them in your shell /
docker environment. Nothing here is required to boot: sensible local defaults let
the app run out of the box (SQLite + heuristic chatbot fallback).
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Load a .env file sitting next to this file, if present.
load_dotenv(BASE_DIR / ".env")


def _normalize_db_url(url: str) -> str:
    # SQLAlchemy expects the `postgresql://` scheme, but Neon/Heroku hand out
    # `postgres://`. Rewrite it so both work.
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Config:
    # --- Security ---
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", "72"))

    # --- Database ---
    # Point DATABASE_URL at your Neon.tech Postgres connection string in prod.
    # Example: postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
    # Falls back to a local SQLite file so the app runs with zero setup.
    SQLALCHEMY_DATABASE_URI = _normalize_db_url(
        os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'spineguard.db'}")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Connection-pool hardening. Neon (and most serverless Postgres) drop idle
    # connections, which otherwise surface as "SSL connection has been closed
    # unexpectedly" on the next request that reuses a dead pooled connection.
    #   - pool_pre_ping: test a connection with a lightweight ping before use and
    #     transparently replace it if it's dead.
    #   - pool_recycle:  proactively recycle connections older than 280s (under
    #     Neon's ~5 min idle cutoff).
    # connect_args (Postgres only) enable TCP keepalives to hold the link open.
    _engine_options = {"pool_pre_ping": True, "pool_recycle": 280}
    if SQLALCHEMY_DATABASE_URI.startswith("postgresql"):
        _engine_options["connect_args"] = {
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    SQLALCHEMY_ENGINE_OPTIONS = _engine_options

    # --- ML model ---
    # Prefer an explicit MODEL_PATH; otherwise use the model bundled next to the
    # backend (deploy layout), falling back to the repo-root copy (local dev).
    MODEL_PATH = os.getenv("MODEL_PATH") or next(
        (
            str(p)
            for p in (BASE_DIR / "ivdd_best_model.pkl", PROJECT_ROOT / "ivdd_best_model.pkl")
            if p.exists()
        ),
        str(BASE_DIR / "ivdd_best_model.pkl"),
    )

    # --- Groq (chatbot) ---
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

    # --- CORS ---
    # Comma-separated list of allowed origins for the frontend.
    CORS_ORIGINS = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
