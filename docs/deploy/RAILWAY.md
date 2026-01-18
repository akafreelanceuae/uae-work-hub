# Railway Deployment Guide (API)

This guide explains how to deploy the API service to Railway using either source builds or pinned container images from GHCR.

## Prerequisites
- Railway account and a project with a service named `api`
- GitHub Container Registry (GHCR) images built by CI
  - API images: `ghcr.io/<IMAGE_OWNER>/uae-work-hub-api:<sha>`
- GitHub Actions secrets set (see docs/deploy/SECRETS.md)

## Option A: Source builds (simple)
If your Railway service is configured for source builds (default):
1. Ensure repo is linked to the Railway project/service `api`.
2. Trigger deploy via workflow:
   - GitHub Actions → `cd-railway-api` (runs on push to `apps/api/**` or manually)
   - The workflow will sync environment variables and run `railway up --service api`.
3. Verify:
   - Railway dashboard → Logs
   - Open the assigned domain → `GET /health`

## Option B: Image-based deploys (recommended for pinned builds)
This deploys the exact image built by CI with tag `<sha>`.

### 1) Switch service to image mode (UI)
1. In Railway, open your project → service `api`.
2. Go to Settings → Deployment method → select "Container Image".
3. Set Image Reference to `ghcr.io/<IMAGE_OWNER>/uae-work-hub-api:<sha>` (for a first manual test, you can use `:latest`).
4. Set Start Command (optional): `node dist/index.js` if needed. The image already defines CMD.
5. Save.

### 2) Configure registry access (GHCR)
If your GHCR repo is private, authorize Railway to pull images:
- Preferred: Connect GitHub/registry in Railway (Settings → Integrations/Registries) and allow access to GHCR packages for your org/user.
- Or set registry credentials in Railway (user + PAT with `read:packages`).

### 3) CI/CD workflow
- Set GitHub Secrets:
  - `IMAGE_OWNER` (GHCR namespace)
  - `RAILWAY_TOKEN` (account/project token)
  - `RAILWAY_USE_IMAGE` = `true` to enable image deploy path
- The workflow `.github/workflows/cd-railway-api.yml` will:
  - Compute `<sha>`
  - Sync app variables to Railway (if present as GitHub Secrets)
  - Deploy image: `ghcr.io/${IMAGE_OWNER}/uae-work-hub-api:<sha>` using `railway deploy --service api --image ...`
  - Fallback to source if `RAILWAY_USE_IMAGE` != `true`

### 4) App environment variables
- You can set variables in Railway UI (Variables tab) or let the workflow set them from GitHub Secrets.
- Required keys (see `docs/deploy/SECRETS.md`):
  - `MONGODB_URI`, `REDIS_URL`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EMAIL_SECRET`, `JWT_RESET_SECRET`
  - `FRONTEND_URL`, `ALLOWED_ORIGINS`
  - Optional: `AI_URL`

### 5) Verify & rollback
- Verify logs: Railway → service `api` → Logs.
- Health: `GET /health` on the service domain.
- Rollback: use Railway Deployments history to redeploy a previous image or commit.

## CLI quick reference
```bash
# Login & link (from apps/api)
railway login
railway link

# Set variables
railway variables set MONGODB_URI="mongodb://..." --service api
# (repeat for other keys)

# Deploy specific image
railway deploy --service api --image ghcr.io/<IMAGE_OWNER>/uae-work-hub-api:<sha> --yes
```

## Troubleshooting
- Image pull errors: Ensure Railway has registry access to GHCR (private images require credentials).
- Service name mismatch: The workflows assume the service is named `api`. Rename in Railway or adjust workflows.
- Missing env vars: Check Railway Variables tab; ensure workflow Secrets are set in GitHub.
- Port mismatch: API listens on `PORT` (default 5000). Railway exposes the container port automatically.
- CORS/Origins: Ensure `ALLOWED_ORIGINS` includes the Railway frontend domain if applicable.
