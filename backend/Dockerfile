# syntax=docker/dockerfile:1
#
# Self-contained backend image. Build context is THIS directory (backend/):
#   docker build -t spineguard-api .
#
# On Northflank: set the service's build context / working directory to
# `backend` and Dockerfile path to `backend/Dockerfile`. No repo-root files are
# needed — the model is bundled here as ivdd_best_model.pkl.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install Python dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source + bundled model (.dockerignore trims dev cruft).
COPY . .

ENV MODEL_PATH=/app/ivdd_best_model.pkl \
    PORT=5001

EXPOSE 5001

# Gunicorn serves the WSGI `app` from app.py. `exec` + sh -c expands ${PORT}
# (Northflank and most PaaS inject the bind port via $PORT) while keeping
# gunicorn as PID 1 so it receives SIGTERM for graceful shutdowns.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 2 --timeout 120 app:app"]
