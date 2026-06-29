# Shop Demo — Login + Shopping Cart

A demo e-commerce app for Kubernetes load testing with Grafana k6. FastAPI backend, React frontend, PostgreSQL database.

**Local repo:** `C:\Users\flyluk\Projects\shop-demo`  
**Cluster copy:** `/home/flyluk/development/shop-demo` on `dev-vm1.test.local`  
**k6 load tests:** [`shopperf`](../shopperf) (`k6/run.ps1` on Windows)

## Architecture

```
shop-demo namespace (MicroK8s)
├── PostgreSQL (Bitnami Helm)
├── api (FastAPI) — auth, products, cart
└── web (nginx + React)

monitoring namespace
├── Prometheus ← k6 remote write
└── Grafana ← k6 dashboards
```

## Features

- User registration and JWT login
- Product catalog (10 seeded items)
- Shopping cart (add, update quantity, remove)
- Health endpoint for probes and smoke tests

## Local Development (debug here first)

```powershell
cd C:\Users\flyluk\Projects\shop-demo
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:8080 |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

**Demo credentials:** `demo@shop.local` / `demo1234`

## Sync with dev-vm1

Pull the latest cluster source to your machine:

```powershell
cd C:\Users\flyluk\Projects\shop-demo\scripts
.\sync-from-dev-vm1.ps1
```

Push local edits back to dev-vm1:

```powershell
.\sync-to-dev-vm1.ps1
```

## Deploy to MicroK8s

From Windows (sync + deploy in one step):

```powershell
cd C:\Users\flyluk\Projects\shop-demo\scripts
.\deploy-remote.ps1
```

Skip sync if you only changed manifests and images are already on the cluster:

```powershell
.\deploy-remote.ps1 -SkipSync
```

On dev-vm1 directly:

```bash
bash /home/flyluk/development/shop-demo/scripts/redeploy-shop-demo.sh
```

Web UI is exposed via LoadBalancer (currently http://192.168.1.53).

## Reset DB between load tests

Clears orphaned cart rows and restores product stock (run on dev-vm1):

```bash
bash /home/flyluk/development/shop-demo/scripts/reset-shop-demo-db.sh
```

## k6 Performance Testing

Primary load test runner lives in **shopperf** (Docker k6 on Windows):

```powershell
cd C:\Users\flyluk\Projects\shopperf\k6
.\run.ps1 -TestId "my-run-1"
```

See `shopperf/scripts/APP-TUNING.md` for performance tuning notes.

In-cluster k6 (optional, via k6 Operator):

```bash
cd scripts
./install-shop-demo.sh    # first-time cluster setup
./run-k6-shop-test.sh smoke
./run-k6-shop-test.sh load
```

## API Endpoints

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
| DELETE | `/api/cart/items/{id}` | Yes | Remove item |

## Teardown

```bash
cd scripts
./uninstall-shop-demo.sh
```

## Project Structure

```
shop-demo/
├── backend/              FastAPI application
├── frontend/             React (Vite) + nginx
├── db/init.sql           Schema and seed data
├── k6/                   In-cluster k6 TestRun manifests
├── k8s/                  Kubernetes manifests
├── scripts/
│   ├── sync-from-dev-vm1.ps1
│   ├── sync-to-dev-vm1.ps1
│   ├── deploy-remote.ps1
│   ├── redeploy-shop-demo.sh
│   ├── reset-shop-demo-db.sh
│   ├── install-shop-demo.sh
│   └── shop-demo-postgres-values.yaml
└── docker-compose.yml
```
