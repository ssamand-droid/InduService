# Local development on Ubuntu / WSL

This is the first local environment: Django development settings, SQLite, and
the Vite development server. Keep the repository in the WSL Linux filesystem
(for example `~/projects/InduService`) for better file watching and I/O.

## Install Ubuntu on Windows (one time)

From an elevated PowerShell window, install WSL and Ubuntu, then restart
Windows if prompted:

```powershell
wsl --install -d Ubuntu
```

Launch Ubuntu from the Start menu and create its Linux username and password.
The remaining commands in this guide run inside the Ubuntu terminal.

If you already have a Windows checkout, copy its current Git working tree into
Linux storage once so uncommitted work is preserved and Linux-native
dependencies are rebuilt there:

```bash
mkdir -p ~/projects/InduService
rsync -a \
  --exclude='backend/.venv/' \
  --exclude='frontend/node_modules/' \
  --exclude='backend/.env' \
  --exclude='backend/.env.local-prod' \
  --exclude='backend/media/' \
  --exclude='backend/staticfiles/' \
  --exclude='backend/db.sqlite3*' \
  --exclude='frontend/dist/' \
  /mnt/c/Users/hp/Desktop/Server/InduService/ \
  ~/projects/InduService/
```

After this copy, work from `~/projects/InduService` in Ubuntu; the Windows
checkout does not automatically sync with it.

## One-time setup

Install Python, Node.js (LTS), and npm in Ubuntu. From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
python manage.py check --settings=InduService.settings.development
python manage.py migrate --settings=InduService.settings.development
```

In another terminal, from the repository root:

```bash
cd frontend
npm ci
npm run dev
```

## Start the development environment

Terminal 1 (backend):

```bash
cd ~/projects/InduService/backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000 --settings=InduService.settings.development
```

Terminal 2 (frontend):

```bash
cd ~/projects/InduService/frontend
npm run dev -- --host 0.0.0.0
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.
The Vite proxy forwards `/api` and `/media` to Django at port 8000, so browser
API requests stay on the local environment. Django uses `backend/.env`; do not
commit that file. SQLite data stays in `backend/db.sqlite3`, which is ignored by
Git.

Use `Ctrl+C` in each terminal to stop its server. The separate production-like
local environment will be documented independently so it can use its own
database and ports without sharing development data.

## Production-like local test

This test instance keeps `DEBUG=False`, uses PostgreSQL, and runs the built
frontend. It uses HTTP only on localhost because it has no local TLS proxy.
It uses a different database and ports from development.

Install PostgreSQL in Ubuntu if it is not installed, then create a dedicated
role and database (replace the sample password with your own local-only value):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
sudo -u postgres psql
```

At the `psql` prompt:

```sql
CREATE ROLE induservice_local_prod LOGIN PASSWORD 'replace-with-a-local-only-password';
CREATE DATABASE induservice_local_prod OWNER induservice_local_prod;
\q
```

Create independent environment values and apply migrations:

```bash
cd ~/projects/InduService/backend
cp .env.local-prod.example .env.local-prod
# Edit .env.local-prod and set unique local-only secrets/passwords.
set -a
source .env.local-prod
set +a
source .venv/bin/activate
export DJANGO_SETTINGS_MODULE=InduService.settings.local_production
python manage.py check --deploy
python manage.py migrate
python manage.py collectstatic --noinput
```

Terminal 1 (production WSGI server):

```bash
cd ~/projects/InduService/backend
set -a; source .env.local-prod; set +a
source .venv/bin/activate
export DJANGO_SETTINGS_MODULE=InduService.settings.local_production
gunicorn InduService.wsgi:application --bind 0.0.0.0:8001 --workers 2
```

Terminal 2 (build and serve the frontend):

```bash
cd ~/projects/InduService/frontend
VITE_API_BASE_URL=http://localhost:8001 npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Open `http://localhost:4173`. The backend is available at
`http://localhost:8001`; its PostgreSQL database is separate from the dev
SQLite database. Do not use production credentials or production data here.
The `.env.local-prod` file is ignored by Git.
