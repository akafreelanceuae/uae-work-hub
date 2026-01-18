# Secrets and Environment Configuration

This document lists all required secrets and environment variables for CI/CD (GitHub Actions), Railway, and Kubernetes. Use it as a checklist to configure your deployment.

## 1) GitHub Actions (CI/CD) Secrets
Set these under: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Required
- GHCR_USERNAME
  - Your GitHub username (or service account) that will push to GHCR.
- GHCR_TOKEN
  - GitHub Personal Access Token (classic) with scopes: packages:write (and optionally packages:read). Store as a secret.
- IMAGE_OWNER
  - The GHCR namespace (GitHub username or organization) where images will be published; e.g. `your-org`.
- RAILWAY_TOKEN
  - Railway account/project token that authorizes deployments.
- KUBE_CONFIG
  - Full kubeconfig YAML content for the target cluster (paste the entire YAML as the secret value). The CD workflow writes this to `kubeconfig.yaml` at runtime.

Optional (future expansions)
- GRAFANA_ADMIN_PASSWORD

### OpenTelemetry (optional)
Set these to enable distributed tracing from the API:
- ENABLE_TRACING: `true`/`false` (default `false`). When `true`, API boots the OpenTelemetry SDK.
- OTEL_EXPORTER_OTLP_ENDPOINT: e.g. `http://otel-collector.otel.svc.cluster.local:4318/v1/traces`
- OTEL_SERVICE_NAME: e.g. `uae-work-hub-api`
- OTEL_EXPORTER_OTLP_HEADERS: optional comma-separated headers, e.g. `x-otlp-token=...`

## 2) Application Secrets (used in API)
These can be defined:
- As GitHub Secrets of the same names (used by the Railway CD workflow to set Railway service variables), and/or
- As Kubernetes Secret data (see `deploy/k8s/backend/secret.example.yaml`).

Required for API
- MONGODB_URI
  - Example: `mongodb://mongo:27017/uae_work_hub` (dev) or Atlas URI in production.
- REDIS_URL
  - Example: `redis://redis:6379` (dev) or managed Redis URI in production.
- JWT_SECRET
  - Access token signing secret.
- JWT_REFRESH_SECRET
  - Refresh token signing secret.
- JWT_EMAIL_SECRET
  - Email verification token secret.
- JWT_RESET_SECRET
  - Password reset token secret.
- FRONTEND_URL
  - Base URL of your web client. Example: `http://localhost:3000`.
- ALLOWED_ORIGINS
  - CSV of allowed CORS origins. Example: `http://localhost:3000,http://localhost:5173`.
- AI_URL (optional for now)
  - Base URL of AI service (FastAPI). Example: `http://localhost:8000` or service name inside cluster.

Optional flags
- ENABLE_PROMETHEUS_METRICS
  - `true`/`false` to expose `/metrics` in API. Default `true` in development.
- AUDIT_TTL_DAYS
  - TTL for audit logs; default 30.

### Optional CSP (Content Security Policy)
Provide comma-separated sources to tighten CSP in production. Examples below; leave empty to rely on defaults.
- CSP_SCRIPT_SRC
- CSP_STYLE_SRC
- CSP_IMG_SRC
- CSP_CONNECT_SRC
- CSP_FONT_SRC
- CSP_MEDIA_SRC
- CSP_FRAME_SRC

## 3) Railway mapping
The Railway CD workflow will sync the following GitHub Secrets into your Railway service named `api` if present:
- MONGODB_URI, REDIS_URL
- JWT_SECRET, JWT_REFRESH_SECRET, JWT_EMAIL_SECRET, JWT_RESET_SECRET
- FRONTEND_URL, ALLOWED_ORIGINS, AI_URL

### 3a) Image-based Railway deploy (optional)
- Set the GitHub Secret `RAILWAY_USE_IMAGE` to `true` to enable image deployment.
- Ensure your Railway project/service `api` is configured to deploy from a container image (not source).
- The workflow will deploy image: `ghcr.io/${IMAGE_OWNER}/uae-work-hub-api:<sha>`
- If the image is private, configure the Railway project with registry credentials to pull from GHCR.
- If `RAILWAY_USE_IMAGE` is not `true`, the workflow falls back to source deploy (`railway up`).

Manual Railway CLI (optional)
```bash
# From apps/api
railway variables set MONGODB_URI=... --service api
railway variables set REDIS_URL=... --service api
railway variables set JWT_SECRET=... --service api
# etc.
```

## 4) Kubernetes mapping
Fill and apply `deploy/k8s/backend/secret.example.yaml` with your values:
- MONGODB_URI, REDIS_URL, FRONTEND_URL, ALLOWED_ORIGINS, JWT_SECRET, JWT_REFRESH_SECRET, JWT_EMAIL_SECRET, JWT_RESET_SECRET, AI_URL

Apply sequence (manually or via the CD workflow):
```bash
kubectl apply -f deploy/k8s/backend/namespace.yaml
kubectl apply -f deploy/k8s/backend/secret.example.yaml
kubectl apply -f deploy/k8s/backend/deployment.yaml
kubectl apply -f deploy/k8s/backend/service.yaml
kubectl apply -f deploy/k8s/backend/hpa.yaml
```

## 5) GHCR (image registry) quick start
- Create PAT (classic) with `packages:write`, store as GHCR_TOKEN.
- Set GHCR_USERNAME to your GitHub username and IMAGE_OWNER to your org/user.
- CI builds & pushes:
  - API: `ghcr.io/${IMAGE_OWNER}/uae-work-hub-api:<sha>`
  - Web: `ghcr.io/${IMAGE_OWNER}/uae-work-hub-web:<sha>`
  - AI: `ghcr.io/${IMAGE_OWNER}/uae-work-hub-ai:<sha>`

## 6) Checklist
- [ ] GHCR_USERNAME set
- [ ] GHCR_TOKEN set (packages:write)
- [ ] IMAGE_OWNER set
- [ ] RAILWAY_TOKEN set
- [ ] RAILWAY_USE_IMAGE set to 'true' (optional, only if using image-based deploy)
- [ ] KUBE_CONFIG set (full YAML pasted)
- [ ] MONGODB_URI
- [ ] REDIS_URL
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] JWT_EMAIL_SECRET
- [ ] JWT_RESET_SECRET
- [ ] FRONTEND_URL
- [ ] ALLOWED_ORIGINS
- [ ] AI_URL (optional)
- [ ] ENABLE_TRACING (optional)
- [ ] OTEL_EXPORTER_OTLP_ENDPOINT (optional)
- [ ] OTEL_SERVICE_NAME (optional)
- [ ] OTEL_EXPORTER_OTLP_HEADERS (optional)
- [ ] CSP_SCRIPT_SRC (optional)
- [ ] CSP_STYLE_SRC (optional)
- [ ] CSP_IMG_SRC (optional)
- [ ] CSP_CONNECT_SRC (optional)
- [ ] CSP_FONT_SRC (optional)
- [ ] CSP_MEDIA_SRC (optional)
- [ ] CSP_FRAME_SRC (optional)
- [ ] REQUIRE_ORIGIN_IN_PROD (optional; defaults to true in Helm chart)

Once all of the above are set, you can:
- Push to `main` to build & push images (ci.yml)
- Trigger `cd-railway-api` to deploy to Railway
- Trigger `cd-k8s-api` to deploy to Kubernetes with SHA-pinned image
