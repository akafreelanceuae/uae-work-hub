# UAE Work Hub API Helm Chart

This chart deploys the UAE Work Hub API to Kubernetes.

## Prerequisites
- Kubernetes cluster with kubectl access
- Helm v3
- Namespace (default used in examples: `uae-work-hub`)
- Container image available in a registry (GHCR recommended)

## Install/Upgrade

Install (or upgrade) the API using the SHA-tagged image built by CI:

```bash
helm upgrade --install api deploy/charts/api \
  --namespace uae-work-hub --create-namespace \
  --set image.repository=ghcr.io/<IMAGE_OWNER>/uae-work-hub-api \
  --set image.tag=<GIT_SHA7> \
  -f deploy/charts/api/values.example.yaml \
  --wait --timeout 180s
```

- Replace `<IMAGE_OWNER>` with your GHCR namespace (user/org)
- Replace `<GIT_SHA7>` with your 7-char commit SHA (the CI workflow computes this automatically)

## Configuration

See `values.yaml` for defaults and `values.example.yaml` for a starter override file.

Key values:
- `image.repository`: container repo (e.g., `ghcr.io/<owner>/uae-work-hub-api`)
- `image.tag`: image tag (use the short SHA from CI)
- `replicaCount`: number of replicas
- `service.port` / `service.targetPort`: Kubernetes service and container port
- `env.nodeEnv`: `production` or `development`
- `env.enableMetrics`: `true`/`false` to expose `/metrics`
- `env.requireRedisReady`: `true` requires Redis to be healthy for readiness; default `false` (prod enforces via NODE_ENV)
- `env.requireOriginInProd`: `true` blocks requests without an Origin header in production; default `true` in chart values
- `secrets.*`: secret creation and key/value pairs injected via `envFrom`

## Secrets

The chart can create a Secret if `secrets.create: true` is set, using the data under `secrets.data`. Example keys:
- `MONGODB_URI`
- `REDIS_URL`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EMAIL_SECRET`, `JWT_RESET_SECRET`
- `AI_URL`

Alternatively, set `secrets.create: false` and reference an existing Secret name with `secrets.name`.

## HPA

Horizontal Pod Autoscaler is enabled by default. Configure under `hpa.*` or disable with `hpa.enabled: false`.

## Uninstall

```bash
helm uninstall api -n uae-work-hub
```
