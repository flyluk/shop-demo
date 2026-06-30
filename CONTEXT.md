# Context — shop-demo

Handoff for new chats / agents. Full docs: [README.md](README.md). Load-test tuning: [shopperf/scripts/APP-TUNING.md](../shopperf/scripts/APP-TUNING.md).

## What this repo is

Demo e-commerce app (FastAPI + React/nginx + Postgres) on MicroK8s, used as the **target** for k6 load tests from [shopperf](https://github.com/flyluk/shopperf).

## Sibling repo

| Repo | Role |
|------|------|
| shop-demo (this) | App under test |
| [shopperf](https://github.com/flyluk/shopperf) | k6 runner, Grafana/Prometheus integration |

## Paths

| | |
|---|---|
| Local (WSL) | `/mnt/c/Users/flyluk/Projects/shop-demo` |
| Cluster host | `dev-vm1.test.local` |
| Cluster copy | `/home/flyluk/development/shop-demo` |

## Cluster endpoints

| Service | URL / access |
|---------|----------------|
| Web UI (LoadBalancer) | `http://192.168.1.53` |
| Namespace | `shop-demo` |
| Postgres pod | `shop-demo-postgres-postgresql-0` |

## Deploy from WSL

```bash
cd /mnt/c/Users/flyluk/Projects/shop-demo/scripts
./deploy-remote.sh              # sync + build + rollout
./deploy-remote.sh --skip-sync  # rollout only
```

On dev-vm1 directly:

```bash
bash /home/flyluk/development/shop-demo/scripts/redeploy-shop-demo.sh
```

## Database (between k6 runs)

Postgres persistence is **off** — helm upgrade can wipe schema.

| Script | When |
|--------|------|
| `init-shop-demo-db.sh` | After Postgres install/reinstall; creates tables + seeds 10 products (stock 20000) |
| `reset-shop-demo-db.sh` | **Before each benchmark** — clears carts, restores stock to 20000 |

```bash
# on dev-vm1
bash /home/flyluk/development/shop-demo/scripts/reset-shop-demo-db.sh
```

If `/api/products` returns 500 (`relation "products" does not exist`) → run `init-shop-demo-db.sh`.

API also seeds products on startup when table is empty (`backend/app/main.py`).

## Tuned stack (current)

| Component | Setting |
|-----------|---------|
| API replicas | 4 |
| Uvicorn workers / pod | 4 |
| DB pool / worker | `DB_POOL_SIZE=5`, `DB_MAX_OVERFLOW=8` |
| DB pool timeout | 5s |
| Max API→Postgres conns | 4×4×13 = **208** |
| Postgres `max_connections` | 400 |
| nginx | upstream keepalive 64, `proxy_read_timeout 30s` |

Config: `k8s/configmap.yaml`, `scripts/shop-demo-postgres-values.yaml`.

## Local dev

```bash
cd /mnt/c/Users/flyluk/Projects/shop-demo
docker compose up --build
# Web http://localhost:8080  API http://localhost:8000
```

Demo login: `demo@shop.local` / `demo1234`

## Run load tests (shopperf)

```bash
cd /mnt/c/Users/flyluk/Projects/shopperf/k6
./run.sh --test-id <id>
```

Use `K6_CART_MODE=add_remove` in shopperf `k6/.env` so deletes restore stock.

## Key files

| File | Purpose |
|------|---------|
| `k8s/configmap.yaml` | Pool + worker env |
| `k8s/api-deployment.yaml` | API replicas, resources |
| `frontend/nginx.conf` | Reverse proxy + keepalive |
| `backend/app/main.py` | Startup seed, cart JWT auth |
| `db/init.sql` | Schema + seed SQL |
| `scripts/deploy-remote.sh` | WSL sync + deploy |

## Scripts are bash only

No `.ps1` files. Use WSL for sync/deploy from Windows.
