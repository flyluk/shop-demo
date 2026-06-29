# Shop Demo — Login + Shopping Cart

A demo e-commerce app for Kubernetes load testing with Grafana k6. FastAPI backend, React frontend, PostgreSQL on MicroK8s.

| | Path |
|---|------|
| **Local repo (WSL)** | `/mnt/c/Users/flyluk/Projects/shop-demo` |
| **Cluster copy** | `/home/flyluk/development/shop-demo` on `dev-vm1.test.local` |
| **Load tests** | [`shopperf`](../shopperf) — `k6/run.sh` |
| **Tuning guide** | [`shopperf/scripts/APP-TUNING.md`](../shopperf/scripts/APP-TUNING.md) |

All scripts are bash — run from **WSL**.

---

## Architecture

```
shop-demo namespace (MicroK8s)
├── PostgreSQL (Bitnami Helm, max_connections=400)
├── api × 4 pods (FastAPI, 4 uvicorn workers each)
│     └── SQLAlchemy pool 5+8 per worker (208 max DB conns)
└── web × 2 (nginx + React, upstream keepalive to API)

monitoring namespace
├── Prometheus ← k6 remote write (from shopperf)
└── Grafana    ← dashboard 19665 (k6 Prometheus)
```

**Web UI:** LoadBalancer at `http://192.168.1.53` (shop-demo `web` service).

---

## Features

- User registration and JWT login
- Product catalog (10 seeded items, stock 20000 for load tests)
- Shopping cart (add, update quantity, remove — delete restores stock)
- Health endpoint for probes and smoke tests
- JWT-only auth on cart routes (no DB lookup per request)

---

## Prerequisites

- WSL2 with Docker (for local dev and shopperf k6 runs)
- `ssh` access to `dev-vm1.test.local`
- On dev-vm1: MicroK8s, `kubectl`, `helm`, `docker`

---

## Local development

Debug locally before deploying to the cluster:

```bash
cd /mnt/c/Users/flyluk/Projects/shop-demo
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:8080 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

**Demo credentials:** `demo@shop.local` / `demo1234`

---

## First-time cluster install

Run **on dev-vm1** (requires NFS storage class):

```bash
cd /home/flyluk/development/shop-demo/scripts
./install-shop-demo.sh
```

This deploys Postgres (with `db/init.sql` seed), builds images, applies K8s manifests, and exposes the web LoadBalancer.

---

## Day-to-day workflow (from WSL)

### Sync local ↔ dev-vm1

```bash
cd /mnt/c/Users/flyluk/Projects/shop-demo/scripts

# Push local edits to dev-vm1
./sync-to-dev-vm1.sh

# Pull cluster copy to local machine
./sync-from-dev-vm1.sh
```

Override host: `REMOTE_HOST=myhost ./sync-to-dev-vm1.sh`

### Deploy (sync + build + rollout)

```bash
./deploy-remote.sh              # sync then redeploy
./deploy-remote.sh --skip-sync  # redeploy only (manifests/images already on cluster)
```

On dev-vm1 directly:

```bash
bash /home/flyluk/development/shop-demo/scripts/redeploy-shop-demo.sh
```

`redeploy-shop-demo.sh` rebuilds images, rolls out API/web, and (if Helm is available) upgrades Postgres then runs **`init-shop-demo-db.sh`**.

### Verify after deploy

```bash
ssh dev-vm1.test.local "kubectl get pods -n shop-demo"
curl -s http://192.168.1.53/health
curl -s http://192.168.1.53/api/products | head -c 200
```

---

## Database scripts

Postgres persistence is **disabled** — a helm upgrade can wipe the database.

| Script | Where | Purpose |
|--------|-------|---------|
| `init-shop-demo-db.sh` | dev-vm1 | Create tables + seed 10 products (stock 20000) if empty |
| `reset-shop-demo-db.sh` | dev-vm1 | **Between k6 runs** — clear carts, restore stock to 20000 |

```bash
# on dev-vm1
bash /home/flyluk/development/shop-demo/scripts/init-shop-demo-db.sh
bash /home/flyluk/development/shop-demo/scripts/reset-shop-demo-db.sh
```

If `/api/products` returns **500** with `relation "products" does not exist`, run `init-shop-demo-db.sh` before load testing.

The API also seeds products on startup when the table is empty (`backend/app/main.py`).

---

## k6 performance testing

Primary load tests run from **shopperf** (Docker k6 in WSL):

```bash
# One-time: expose Prometheus remote write
cd /mnt/c/Users/flyluk/Projects/shopperf
./scripts/expose-prometheus.sh

# Configure k6/.env (BASE_URL, PROMETHEUS_RW_URL), then:
cd k6
cp .env.example .env   # first time only
./run.sh --test-id my-run-1
```

Recommended `k6/.env` settings:

- `K6_CART_MODE=add_remove` — add + delete each iteration (restores stock)
- `K6_NO_CONNECTION_REUSE=false` — reuse TCP from Docker
- `K6_CART_RETRIES=1` — retry on HTTP timeout

Between benchmark runs, reset stock on the cluster:

```bash
ssh dev-vm1.test.local "bash /home/flyluk/development/shop-demo/scripts/reset-shop-demo-db.sh"
```

See [`shopperf/scripts/APP-TUNING.md`](../shopperf/scripts/APP-TUNING.md) for pool sizing, failure diagnosis, and troubleshooting.

### In-cluster k6 (optional)

Uses k6 Operator — hits API directly inside the cluster:

```bash
cd scripts
./run-k6-shop-test.sh smoke
./run-k6-shop-test.sh load
```

---

## Performance tuning (summary)

Tuned for 20–50 VUs, add+delete cart flow. Full details in APP-TUNING.md.

| Component | Setting |
|-----------|---------|
| API replicas | 4 |
| Uvicorn workers / pod | 4 |
| DB pool / worker | 5 + 8 overflow |
| DB pool timeout | 5s |
| Postgres `max_connections` | 400 |
| nginx | upstream keepalive 64, `proxy_read_timeout 30s` |

**Pool budget:** `4 × 4 × (5+8) = 208` connections — must stay below Postgres `max_connections`.

---

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/products` | No | List products |
| GET | `/api/products/{id}` | No | Product detail |
| GET | `/api/cart` | Yes | View cart |
| POST | `/api/cart/items` | Yes | Add to cart |
| PATCH | `/api/cart/items/{id}` | Yes | Update quantity |
| DELETE | `/api/cart/items/{id}` | Yes | Remove item (restores stock) |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `/api/products` 500, missing `products` table | `init-shop-demo-db.sh` on dev-vm1 |
| k6 `checks` threshold failed | See APP-TUNING.md — check failure breakdown in summary |
| k6 `add_400_stock` | `reset-shop-demo-db.sh`; use `K6_CART_MODE=add_remove` |
| k6 timeouts at 10s | Verify ConfigMap pool settings deployed; see APP-TUNING.md |
| Deploy image not updating | `./deploy-remote.sh` (not just `kubectl apply`) — rebuilds images |

---

## Teardown

```bash
cd scripts
./uninstall-shop-demo.sh
```

---

## Project structure

```
shop-demo/
├── backend/                    FastAPI (auth, products, cart)
├── frontend/                   React (Vite) + nginx reverse proxy
├── db/init.sql                 Schema + seed (10 products, stock 20000)
├── k6/                         In-cluster k6 TestRun manifests
├── k8s/
│   ├── configmap.yaml          Pool + worker settings
│   ├── api-deployment.yaml     4 replicas
│   └── web-deployment.yaml     2 replicas
├── scripts/
│   ├── install-shop-demo.sh    First-time cluster setup
│   ├── deploy-remote.sh        Sync (WSL) + redeploy on dev-vm1
│   ├── sync-to-dev-vm1.sh      Push local → dev-vm1
│   ├── sync-from-dev-vm1.sh    Pull dev-vm1 → local
│   ├── redeploy-shop-demo.sh   Build + rollout (on dev-vm1)
│   ├── init-shop-demo-db.sh    Schema + seed after Postgres wipe
│   ├── reset-shop-demo-db.sh   Clear carts between k6 runs
│   ├── shop-demo-postgres-values.yaml
│   ├── run-k6-shop-test.sh     In-cluster k6 smoke/load
│   └── uninstall-shop-demo.sh
└── docker-compose.yml          Local dev stack
```
