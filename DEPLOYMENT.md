# Pothole App Production Deployment Docs

This deployment runs the pothole detection app as one monorepo on a VPS using Docker Compose.

- Public entrypoint: Nginx on `http://<your-vps-ip>`
- Frontend: React/Vite static app at `/`
- Backend: Flask/Gunicorn API behind Nginx at `/api`
- Database: PostgreSQL on the internal Docker network only

HTTPS is intentionally left for later so the app can run first on the VPS IP and port `80`.

## Repository Layout

The VPS app directory should be a clone of this monorepo:

```sh
/home/daffa/apps/pothole-app
├── docker-compose.yml
├── .env
├── nginx/conf.d/default.conf
├── backend
└── frontend
```

The model artifacts are committed because they are required for production image builds:

```text
backend/models/pothole_scaler.pkl
backend/models/pothole_svm_model.pkl
```

Uploaded videos and annotated output videos are stored in Docker named volumes, not in Git.

## VPS Preparation

Install Docker, Docker Compose, Git, and allow HTTP:

```sh
sudo apt update
sudo apt install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc >/dev/null
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker daffa
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

Log out and back in after adding `daffa` to the Docker group.

Clone the monorepo:

```sh
mkdir -p /home/daffa/apps
cd /home/daffa/apps
git clone <monorepo-url> pothole-app
cd pothole-app
```

## Required `.env`

Create `/home/daffa/apps/pothole-app/.env` from `.env.example`:

```sh
cp .env.example .env
nano .env
```

Required values:

```sh
POSTGRES_USER=pothole_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=pothole_db

DATABASE_URL=postgresql+psycopg://pothole_user:<strong-password>@postgres:5432/pothole_db
SECRET_KEY=<long-random-secret>
PORT=5000
FLASK_ENV=production
PYTHONUNBUFFERED=1

MODEL_PATH=/app/models/pothole_svm_model.pkl
SCALER_PATH=/app/models/pothole_scaler.pkl
UPLOAD_FOLDER=/app/uploads
OUTPUT_FOLDER=/app/outputs
MAX_CONTENT_LENGTH=104857600

FRONTEND_ORIGIN=http://<your-vps-ip>
VITE_API_URL=/api
```

Docker Compose constructs the backend container `DATABASE_URL` from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`. Keep `DATABASE_URL` in `.env` for commands run outside Docker.

Do not commit the real `.env`.

## Required GitHub Secrets

Add these repository secrets in the GitHub repository:

```text
VPS_HOST=<your-vps-ip>
VPS_USER=daffa
VPS_SSH_KEY=<private ssh key>
VPS_PORT=22
APP_DIR=/home/daffa/apps/pothole-app
```

The matching public key must be in `/home/daffa/.ssh/authorized_keys` on the VPS.

## First-Time Deployment

From the VPS:

```sh
cd /home/daffa/apps/pothole-app
docker compose up -d --build
docker compose ps
```

Open:

```text
http://<your-vps-ip>
http://<your-vps-ip>/api/health
```

The backend creates the SQLAlchemy tables automatically on startup.

## Local Docker Test

This repo includes `docker-compose.override.yml` for local testing. It maps the app to host port `8080` so it does not clash with another app, such as Retentio, already using port `80`.

From your local machine:

```sh
cd /home/erzeltra/daffa/college/Archive/pothole-app
cp .env.example .env
nano .env
docker compose up -d --build
docker compose ps
```

Open and test:

```text
http://localhost:8080
http://localhost:8080/api/health
```

For production on the VPS, do not copy `docker-compose.override.yml` unless you also want the VPS app to use port `8080`. The base `docker-compose.yml` still maps Nginx to port `80`.

## CI/CD

GitHub Actions deploys on pushes to `master`.

The workflow SSHes into the VPS and runs:

```sh
cd /home/daffa/apps/pothole-app
git fetch origin master
git reset --hard origin/master
docker compose up -d --build
docker image prune -f
docker compose ps
```

## Manual Operations

Deploy manually:

```sh
cd /home/daffa/apps/pothole-app
git fetch origin master
git reset --hard origin/master
docker compose up -d --build
docker image prune -f
docker compose ps
```

Check logs:

```sh
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
docker compose logs -f postgres
```

Restart services:

```sh
docker compose restart backend
docker compose restart frontend
docker compose restart nginx
```

Update environment variables:

```sh
cd /home/daffa/apps/pothole-app
nano .env
docker compose up -d --build
```

Rollback manually:

```sh
cd /home/daffa/apps/pothole-app
git log --oneline -5
git reset --hard <commit-sha>
docker compose up -d --build
```

## Domain and HTTPS Later

After a domain points to the VPS:

1. Update `.env`:
   ```sh
   FRONTEND_ORIGIN=https://your-domain.com
   ```
2. Change `server_name _;` in `nginx/conf.d/default.conf` to your domain.
3. Install Certbot on the VPS and issue a certificate for the domain.
4. Add an HTTPS server block and redirect HTTP to HTTPS.
5. Run:
   ```sh
   docker compose up -d
   ```

## Safety Notes

- Only `nginx` publishes a host port: `80:80`.
- `frontend`, `backend`, and `postgres` only expose internal Docker ports.
- Nginx routes `/` to the frontend and `/api` to Flask.
- The Vite frontend uses relative `/api` requests, so production does not call `localhost`.
- PostgreSQL data is stored in the named Docker volume `pothole-app_postgres_data`.
- Uploaded videos are stored in `pothole-app_backend_uploads`.
- Annotated output videos are stored in `pothole-app_backend_outputs`.
