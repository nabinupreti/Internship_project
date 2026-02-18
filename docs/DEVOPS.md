# DevOps Guide (Internship Report)

This guide shows how to run and present the Job & Internship Portal as a DevOps project using Docker, Redis, Nginx, Varnish, backups, and CI/CD.

## 1) Services overview
- **Postgres**: primary database
- **Redis**: cache for `GET /api/jobs`
- **Backend**: Express API
- **Frontend**: Vite build served by Nginx
- **Nginx**: reverse proxy (`/` -> frontend, `/api` -> backend)
- **Varnish**: HTTP cache in front of Nginx

## 2) Local development (no DevOps layers)
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## 3) Docker (dev stack)
```bash
docker compose up --build
```

Then run migrations/seed once:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

## 4) Production Docker with Nginx + Varnish
Create a root `.env` file with secrets:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=job_portal
JWT_SECRET=replace_with_strong_secret
CLIENT_ORIGIN=http://<server-ip>
ADMIN_EMAIL=admin@portal.com
CONTACT_TO=admin@portal.com
RESEND_API_KEY=your_key
RESEND_FROM=Job Portal <no-reply@yourdomain.com>
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret
S3_SIGNED_URL_EXPIRES=600
```

Start the production stack:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Access:
- Varnish (public): `http://<server-ip>/`
- Nginx direct (bypass cache): `http://<server-ip>:8080/`

## 5) Redis cache demo
The jobs list is cached for 60 seconds.
- Endpoint: `GET /api/jobs`
- Check backend logs for `CACHE_HIT` / `CACHE_MISS`.

## 6) Varnish cache demo
```bash
curl -I http://<server-ip>/api/jobs
```
Look for `X-Cache: HIT` or `X-Cache: MISS` headers.

Varnish statistics:
```bash
docker exec -it <varnish_container> varnishstat
```

## 7) Database backup and restore
Create a backup (writes to `backups/`):
```bash
./scripts/db-backup.sh
```

Restore from a backup file:
```bash
./scripts/db-restore.sh backups/job_portal_YYYYMMDD_HHMMSS.sql.gz
```

For production compose:
```bash
COMPOSE_FILE=./docker-compose.prod.yml ./scripts/db-backup.sh
COMPOSE_FILE=./docker-compose.prod.yml ./scripts/db-restore.sh backups/your-file.sql.gz
```

Optional cron (daily backup at 2 AM):
```
0 2 * * * /home/ubuntu/job-portal/scripts/db-backup.sh
```

## 8) CI/CD (GitHub Actions)
Workflow file: `.github/workflows/deploy.yml`

Required GitHub Secrets:
- `HOST`: EC2 public IP or DNS
- `USER`: SSH user (e.g., ubuntu)
- `SSH_KEY`: private key for EC2
- `DEPLOY_PATH`: repo path on server (e.g., /home/ubuntu/job-portal)
- `REGISTRY_USER`: GHCR username
- `REGISTRY_TOKEN`: GHCR PAT with `read:packages`

On each push to `main`, the workflow:
1. Builds and pushes backend + frontend images to GHCR
2. SSHes into EC2, pulls latest images
3. Restarts Docker compose

## 9) AWS EC2 deployment (simple)
1. Launch **Ubuntu 22.04** EC2
2. Open ports: 22, 80
3. Install Docker + Compose:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
```
Log out/in once.

4. Clone repo and create `.env`
```bash
git clone <your-repo-url>
cd job-portal
nano .env
```

5. Start production stack:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 10) Presentation checklist
- Show CI/CD pipeline success (GitHub Actions)
- Show containers: `docker ps`
- Show Redis cache hits in backend logs
- Show Varnish `X-Cache` header + `varnishstat`
- Show backup script output

