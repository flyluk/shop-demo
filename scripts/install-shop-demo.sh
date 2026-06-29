#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHOP_DEMO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
NAMESPACE="shop-demo"
RELEASE="shop-demo-postgres"
API_IMAGE="shop-demo-api:latest"
WEB_IMAGE="shop-demo-web:latest"

echo "=========================================="
echo "Installing Shop Demo App"
echo "=========================================="

if ! kubectl get storageclass nfs-storage &>/dev/null; then
  echo "ERROR: StorageClass 'nfs-storage' not found."
  echo "Run ./setup-nfs-storage.sh first."
  exit 1
fi

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 32)}"

echo ""
echo "Step 1/6: Creating namespace..."
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/namespace.yaml"

echo ""
echo "Step 2/6: Deploying PostgreSQL..."
helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
helm repo update

INIT_VALUES="${SCRIPT_DIR}/.shop-demo-postgres-init.generated.yaml"
python3 - <<PY
from pathlib import Path

init_sql = Path("${SHOP_DEMO_DIR}/db/init.sql").read_text()
indented = "\n".join("        " + line for line in init_sql.splitlines())
content = f"""primary:
  initdb:
    scripts:
      init.sql: |
{indented}
"""
Path("${INIT_VALUES}").write_text(content)
PY

helm upgrade --install "${RELEASE}" bitnami/postgresql \
  -n "${NAMESPACE}" \
  -f "${SCRIPT_DIR}/shop-demo-postgres-values.yaml" \
  -f "${INIT_VALUES}" \
  --set auth.password="${POSTGRES_PASSWORD}"

echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance="${RELEASE}" \
  -n "${NAMESPACE}" \
  --timeout=300s

POSTGRES_HOST="${RELEASE}-postgresql.${NAMESPACE}.svc.cluster.local"
DATABASE_URL="postgresql://shopuser:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/shopdb"

echo ""
echo "Step 3/6: Creating secrets and config..."
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/configmap.yaml"
kubectl create secret generic shop-demo-secrets \
  -n "${NAMESPACE}" \
  --from-literal=POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
  --from-literal=JWT_SECRET="${JWT_SECRET}" \
  --from-literal=DATABASE_URL="${DATABASE_URL}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "Step 4/6: Building container images..."
docker build -t "${API_IMAGE}" "${SHOP_DEMO_DIR}/backend"
docker build -t "${WEB_IMAGE}" "${SHOP_DEMO_DIR}/frontend"

echo "Importing images into MicroK8s nodes..."
if command -v microk8s &>/dev/null; then
  docker save "${API_IMAGE}" | microk8s ctr image import - 2>/dev/null || true
  docker save "${WEB_IMAGE}" | microk8s ctr image import - 2>/dev/null || true
else
  for host in microk8s-vm{1..6}.test.local; do
    echo "  -> ${host}"
    docker save "${API_IMAGE}" | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${host}" 'microk8s ctr image import -' 2>/dev/null || true
    docker save "${WEB_IMAGE}" | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 "${host}" 'microk8s ctr image import -' 2>/dev/null || true
  done
fi

echo ""
echo "Step 5/6: Deploying API and web..."
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/api-deployment.yaml"
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/web-deployment.yaml"

echo "Waiting for API pods..."
kubectl rollout status deployment/api -n "${NAMESPACE}" --timeout=180s
kubectl rollout status deployment/web -n "${NAMESPACE}" --timeout=180s

echo ""
echo "Step 6/6: Exposing web via LoadBalancer..."
kubectl patch svc web -n "${NAMESPACE}" -p '{"spec":{"type":"LoadBalancer"}}'

echo "Waiting for LoadBalancer IP..."
sleep 15
WEB_IP=$(kubectl get svc web -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
if [ -z "${WEB_IP}" ]; then
  WEB_IP=$(kubectl get svc web -n "${NAMESPACE}" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
fi

echo ""
echo "=========================================="
echo "Shop Demo installed!"
echo "=========================================="
echo ""
echo "Namespace: ${NAMESPACE}"
echo "Web URL:   http://${WEB_IP:-<pending>}"
echo "API (in-cluster): http://api.${NAMESPACE}.svc.cluster.local:8000"
echo ""
echo "Demo credentials:"
echo "  Email:    demo@shop.local"
echo "  Password: demo1234"
echo ""
echo "Secrets stored in: shop-demo-secrets (${NAMESPACE})"
