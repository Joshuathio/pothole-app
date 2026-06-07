# VPS Docker Deployment Plan

This plan adapts the deployment workflow from the Retentio/churn AI project for this pothole detection monorepo.

## Goal

Deploy this repository as one monorepo on a VPS with Docker Compose:

- Frontend: React/Vite static app served by Nginx.
- Backend: Flask API running the pothole detector.
- Database: PostgreSQL running inside Docker.
- Public entrypoint: root Nginx reverse proxy on port `80`.
- CI/CD: GitHub Actions deploys to the VPS on pushes to `master`, using SSH and `docker compose up -d --build`.

## Current App Shape

The repo is already organized as two services:

```text
pothole-app/
├── backend/
│   ├── app.py
│   ├── detector.py
│   ├── models.py
│   ├── models/
│   │   ├── pothole_scaler.pkl
│   │   └── pothole_svm_model.pkl
│   └── requirements.txt
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
```

The frontend already calls the API through relative `/api` URLs, so production can use the same routing style as Retentio.

## Target Architecture

```text
Internet
   |
   v
VPS port 80
   |
   v
nginx container
   |-- /      -> frontend container, port 80
   |-- /api/* -> backend container, port 5000

Internal Docker network only:
   |-- backend -> postgres:5432
   |-- postgres volume for database data
   |-- backend upload/output volumes for video files
```

Only the root `nginx` service will publish a host port. The frontend, backend, and postgres services stay internal to the Docker network.

## Files I Plan To Add

```text
docker-compose.yml
.env.example
DEPLOYMENT.md
nginx/conf.d/default.conf
backend/Dockerfile
frontend/Dockerfile
frontend/nginx/default.conf
.github/workflows/deploy.yml
```

## Files I May Update

```text
.gitignore
backend/requirements.txt
```

Planned updates:

- Add `gunicorn` to `backend/requirements.txt` so Flask runs with a production WSGI server.
- Ensure generated upload/output video files remain ignored while Docker named volumes preserve them on the VPS.
- Keep model artifacts in `backend/models/` available for Docker image builds.

## Docker Compose Design

The root `docker-compose.yml` will follow the Retentio pattern:

- `nginx`
  - image: `nginx:1.27-alpine`
  - depends on `frontend` and `backend`
  - publishes `80:80`
  - mounts `./nginx/conf.d/default.conf`
- `frontend`
  - builds from `./frontend`
  - serves `dist/` with Nginx
  - exposes internal port `80`
- `backend`
  - builds from `./backend`
  - runs Gunicorn on `0.0.0.0:5000`
  - uses `.env`
  - connects to PostgreSQL through Docker DNS at `postgres:5432`
  - mounts named volumes for `/app/uploads` and `/app/outputs`
- `postgres`
  - image: `postgres:16-alpine`
  - uses env vars from `.env`
  - stores data in a named volume
  - includes a healthcheck

## Environment Variables

The root `.env.example` should include:

```sh
POSTGRES_USER=pothole_user
POSTGRES_PASSWORD=change-this-password
POSTGRES_DB=pothole_db

DATABASE_URL=postgresql+psycopg://pothole_user:change-this-password@postgres:5432/pothole_db
SECRET_KEY=change-this-to-a-long-random-secret
PORT=5000
FLASK_ENV=production
PYTHONUNBUFFERED=1

MODEL_PATH=/app/models/pothole_svm_model.pkl
SCALER_PATH=/app/models/pothole_scaler.pkl
UPLOAD_FOLDER=/app/uploads
OUTPUT_FOLDER=/app/outputs
MAX_CONTENT_LENGTH=104857600

FRONTEND_ORIGIN=http://your-vps-ip
VITE_API_URL=/api
```

## CI/CD Workflow

The `.github/workflows/deploy.yml` will mirror Retentio:

1. Trigger on push to `master`.
2. Checkout repository.
3. Configure SSH using GitHub secrets.
4. SSH into VPS.
5. Run:

```sh
cd "$APP_DIR"
git fetch origin master
git reset --hard origin/master
docker compose up -d --build
docker image prune -f
docker compose ps
```

Required GitHub repository secrets:

```text
VPS_HOST
VPS_USER
VPS_SSH_KEY
VPS_PORT
APP_DIR
```

## Deployment Documentation

The new `DEPLOYMENT.md` will include:

- VPS prerequisites: Docker, Docker Compose plugin, Git, firewall.
- Monorepo clone location.
- Required `.env` setup.
- First-time deployment commands.
- Manual deploy commands.
- Log and restart commands.
- Rollback commands.
- Notes for adding a domain and HTTPS later.

## Confirmed Implementation Choices

The following choices were confirmed before implementation:

1. The production branch is `master`.
2. The public app should run on HTTP port `80` first, with HTTPS/domain setup documented for later.
3. PostgreSQL should run in Docker, matching Retentio, instead of using an external database.
4. Uploads and annotated outputs should persist using Docker named volumes.
5. The VPS app directory should follow the same style as Retentio: `/home/daffa/apps/pothole-app`.
