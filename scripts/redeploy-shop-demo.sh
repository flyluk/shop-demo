#!/bin/bash
# Build and deploy shop-demo to MicroK8s (run on dev-vm1 or any host with docker+kubectl).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHOP_DEMO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

NS="${NAMESPACE:-shop-demo}"
API_IMAGE="${API_IMAGE:-shop-demo-api:latest}"
WEB_IMAGE="${WEB_IMAGE:-shop-demo-web:latest}"
NODES="${MICROK8S_NODES:-microk8s-vm{1..6}.test.local}"

echo "=========================================="
echo "Shop Demo deploy"
echo "=========================================="
echo "Source:    ${SHOP_DEMO_DIR}"
echo "Namespace: ${NS}"
echo ""

echo "Step 1/5: Building images..."
docker build -t "${API_IMAGE}" "${SHOP_DEMO_DIR}/backend"
docker build -t "${WEB_IMAGE}" "${SHOP_DEMO_DIR}/frontend"

echo ""
echo "Step 2/5: Importing images into MicroK8s nodes..."
for host in ${NODES}; do
  echo "  -> ${host}"
  docker save "${API_IMAGE}" | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${host}" "microk8s ctr image import -" 2>/dev/null || true
  docker save "${WEB_IMAGE}" | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${host}" "microk8s ctr image import -" 2>/dev/null || true
done

echo ""
echo "Step 3/5: Applying Kubernetes manifests..."
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/configmap.yaml"
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/api-deployment.yaml"
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/web-deployment.yaml"

echo ""
echo "Step 4/5: Rolling out..."
kubectl rollout restart deployment/api deployment/web -n "${NS}"
kubectl rollout status deployment/api -n "${NS}" --timeout=300s
kubectl rollout status deployment/web -n "${NS}" --timeout=300s

echo ""
echo "Step 5/5: Exposing web via LoadBalancer..."
kubectl patch svc web -n "${NS}" -p '{"spec":{"type":"LoadBalancer"}}' 2>/dev/null || true
sleep 5
WEB_IP="$(kubectl get svc web -n "${NS}" -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)"

if command -v helm >/dev/null 2>&1 && helm status shop-demo-postgres -n "${NS}" >/dev/null 2>&1; then
  echo ""
  echo "Optional: upgrading Postgres (max_connections, etc.)..."
  helm upgrade shop-demo-postgres bitnami/postgresql -n "${NS}" \
    -f "${SHOP_DEMO_DIR}/scripts/shop-demo-postgres-values.yaml" \
    --wait --timeout 5m 2>/dev/null || echo "  (Postgres helm upgrade skipped or failed — run manually if needed)"
  echo "Re-applying DB schema/seed after Postgres upgrade..."
  bash "${SHOP_DEMO_DIR}/scripts/init-shop-demo-db.sh" || echo "  (init-shop-demo-db.sh failed — run manually)"
fi

echo ""
echo "=========================================="
echo "Deploy complete"
echo "=========================================="
kubectl get pods -n "${NS}" -l 'app in (api,web)' -o wide
echo ""
kubectl get svc web -n "${NS}"
echo ""
echo "Web URL: http://${WEB_IP:-<pending>}"
