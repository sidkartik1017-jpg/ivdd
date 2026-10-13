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

# Memory hardening for small container plans. numpy/scikit-learn link against
# OpenMP/BLAS, which by default size their thread pools to the HOST's core count
# -- on a big Northflank node that is a per-process thread pool (and arena) far
# larger than this single-row inference workload ever needs. Pinning them to 1
# cuts resident memory substantially and costs nothing here: predict_proba on a
# 1x10 vector has no parallelism to exploit. MALLOC_ARENA_MAX caps glibc's
# per-thread arenas, which otherwise inflate RSS without being reclaimed.
ENV OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2

EXPOSE 5001

# Gunicorn serves the WSGI `app` from app.py. `exec` + sh -c expands ${PORT}
# (Northflank and most PaaS inject the bind port via $PORT) while keeping
# gunicorn as PID 1 so it receives SIGTERM for graceful shutdowns.
#
# One worker, four threads, preloaded:
#   --workers 1   two workers each imported sklearn/numpy separately, roughly
#                 doubling RSS for a service that is nowhere near CPU-bound.
#   --threads 4   keeps concurrency. Matters because the chatbot blocks on the
#                 Groq API; a single-threaded sync worker would serialise every
#                 request behind that call.
#   --preload     imports the app (and unpickles the model) once in the master
#                 before forking, so worker memory is copy-on-write shared
#                 rather than a fresh private copy per worker.
#   --max-requests  recycle periodically so any slow leak cannot creep back up
#                 to the memory ceiling; jitter avoids synchronised restarts.
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-5001} --workers 1 --threads 4 --preload --max-requests 400 --max-requests-jitter 50 --timeout 120 app:app"]
