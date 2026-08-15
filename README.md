# SpineGuard — IVDD Risk Assessment

A full-stack app that estimates a dog's risk of **Intervertebral Disc Disease (IVDD)**
from clinical, imaging and genetic inputs, with a built-in AI assistant.

- **Frontend** — Next.js 16 / React 19 (in `frontend/`)
- **Backend** — Flask REST API (in `backend/`)
- **ML** — scikit-learn `RandomForestClassifier` loaded from `ivdd_best_model.pkl`
- **Chatbot** — GroqCloud (OpenAI-compatible) with a keyword fallback
- **DB** — Postgres (Neon.tech) in production, SQLite locally by default

---

## Architecture

```
Next.js frontend  ──HTTP/JSON──▶  Flask API  ──▶  RandomForest (pickle)  ── risk %
   (port 3000)                    (port 5001)  ──▶  Groq API (chatbot)
                                               ──▶  Postgres / SQLite (users + history)
```

### Endpoints

| Method | Path                | Auth | Purpose                                  |
|--------|---------------------|------|------------------------------------------|
| GET    | `/api/health`       | –    | Status, model mode, Groq config          |
| POST   | `/api/auth/signup`  | –    | Create account → JWT                      |
| POST   | `/api/auth/signin`  | –    | Sign in → JWT (auto-creates in demo mode) |
| POST   | `/api/predict`      | JWT  | Run a risk assessment, save to history    |
| GET    | `/api/history`      | JWT  | This user's past assessments              |
| POST   | `/api/chat`         | –    | Ask the SpineGuard assistant (Groq)       |

---

## Quick start (local, no Docker)

**1. Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # optional — sensible defaults work as-is
python app.py               # serves on http://localhost:5001
```

**2. Frontend** (in a second terminal)

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points at http://localhost:5001
npm run dev                         # serves on http://localhost:3000
```

Open <http://localhost:3000>, sign in with any email/password (an account is
created on first sign-in), fill in the form, and click **Predict risk**.

---

## Run the backend with Docker

The `backend/Dockerfile` is **self-contained** — its build context is the
`backend/` directory (the model is bundled there as `ivdd_best_model.pkl`), so it
needs nothing from the repo root.

```bash
# Build + run via compose (recommended)
docker compose up --build          # API on http://localhost:5001

# …or build/run manually from the backend dir
cd backend
docker build -t spineguard-api .
docker run -p 5001:5001 --env-file .env spineguard-api
```

It binds to `$PORT` if set (defaults to 5001), so it works on any PaaS that
injects a port.

The frontend still runs with `npm run dev` (or deploy it to Vercel and point
`NEXT_PUBLIC_API_URL` at your API).

## Deploy the backend to Northflank

1. **New Service → Deployment**, source your Git repo.
2. Build settings:
   - **Build type:** Dockerfile
   - **Build context / working directory:** `backend`
   - **Dockerfile path:** `backend/Dockerfile`
3. **Port:** add one exposing container port `8080` (public, HTTP). Northflank
   injects `PORT`, which the container binds to automatically.
4. **Environment variables / secrets** (Service → Variables):
   - `SECRET_KEY` — a strong random string
   - `DATABASE_URL` — your Neon Postgres URL (`…?sslmode=require`)
   - `GROQ_API_KEY` — for the live chatbot
   - `CORS_ORIGINS` — your deployed frontend origin, e.g. `https://your-frontend.vercel.app`
5. Deploy. Check `https://<your-service>.code.run/api/health`.

Then set `NEXT_PUBLIC_API_URL` on the frontend to the Northflank service URL.

---

## Configuration (`backend/.env`)

Everything has a safe default; nothing is required to boot.

| Variable         | Default                     | Notes                                            |
|------------------|-----------------------------|--------------------------------------------------|
| `SECRET_KEY`     | `dev-secret-change-me`      | JWT signing key — **set a strong one in prod**   |
| `DATABASE_URL`   | local SQLite                | Neon Postgres URL (`postgresql://…?sslmode=require`) |
| `MODEL_PATH`     | repo-root pkl               | Path to the trained model                        |
| `GROQ_API_KEY`   | *(empty)*                   | From <https://console.groq.com/keys>             |
| `GROQ_MODEL`     | `llama-3.3-70b-versatile`   | Any Groq chat model                              |
| `CORS_ORIGINS`   | `localhost:3000`            | Comma-separated allowed frontend origins         |
| `AUTO_SIGNUP`    | `1`                         | Create account on first sign-in (demo)           |

### Using Neon.tech Postgres

1. Create a project at <https://neon.tech> and copy the connection string.
2. Put it in `backend/.env`:
   ```
   DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   (`postgres://` is accepted too — it's rewritten to `postgresql://`.)
3. Run the migration to create the tables:
   ```bash
   cd backend && source .venv/bin/activate
   python migrate.py
   ```
   This uses SQLAlchemy `create_all` — it only adds missing tables (`users`,
   `predictions`) and is safe to re-run. `python migrate.py --reset` drops and
   recreates them (destructive). The backend also runs `create_all` on startup,
   so a fresh deploy self-migrates on first boot; `migrate.py` is for running it
   explicitly (e.g. a one-off Northflank job before rollout).

### Enabling the Groq chatbot

Without a key, the assistant answers using built-in canned replies. Add
`GROQ_API_KEY=...` to `backend/.env` to switch to live LLM responses. The
frontend needs no change.

---

## The prediction model

`predictor.py` loads `ivdd_best_model.pkl` and calls `predict_proba`. The model
is a `RandomForestClassifier` that predicts a **risk tier (High / Medium / Low)**
from 10 raw biomarker + demographic features (see `FEATURE_ORDER`). The file is
looked up via `MODEL_PATH`, defaulting to `backend/ivdd_best_model.pkl` (bundled
into the Docker image), then the repo-root copy for local dev.

The class probabilities are turned into the UI's 0–100 gauge using the dataset's
per-tier risk centres, and `Medium` maps to the frontend's "Moderate".

If the pickle is **missing, unreadable, or its feature count doesn't match** the
vector, the API transparently falls back to a deterministic clinical heuristic
(ported from the frontend `risk.ts`) so predictions never fail. The `source`
field in the response (`"model"` or `"heuristic"`) tells you which ran, and
`/api/health` reports `model_mode`.

### Retraining

The model is trained by `backend/train_model.py` from `backend/disc_scored.csv`:

```bash
cd backend
source .venv/bin/activate
pip install pandas          # training-only dependency
python train_model.py        # writes ivdd_best_model.pkl here and at the repo root
```

It targets `risk_tier` and **deliberately excludes leakage columns** — the target
is a fixed linear binning of `genetic_risk_score`, `mechanism_risk_score` and
`imaging_risk_score`, so those composites (and `overall_risk`,
`disc_severity_latent`, the `risk_*` transforms) are dropped. Training uses only
raw, independently observed inputs: the 5 imaging measurements, 2 genetic inputs,
and age / weight / sex. Current performance: **~95% 5-fold CV accuracy**. If you
change the feature set, keep `FEATURE_ORDER` in sync between `train_model.py` and
`predictor.py`, then rebuild the Docker image.

---

## Notes

- **MRI upload is UI-only** by design — the image is previewed and thumbnailed in
  the browser but never sent to the backend or used in the prediction.
- Passwords are hashed (Werkzeug PBKDF2); auth uses stateless JWTs.
- Prediction history is per-user and persisted in the database.
