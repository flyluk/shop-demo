#!/bin/bash
# Build and deploy shop-demo to MicroK8s (run on dev-vm1 or any host with docker+kubectl).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHOP_DEMO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

NS="${NAMESPACE:-shop-demo}"
API_IMAGE="${API_IMAGE:-shop-demo-api:latest}"
WEB_IMAGE="${WEB_IMAGE:-shop-demo-web:latest}"
BUILD_TAG="${BUILD_TAG:-$(date -u +%Y%m%d%H%M%S)}"
if [[ -n "${MICROK8S_NODES:-}" ]]; then
  read -r -a NODE_LIST <<< "${MICROK8S_NODES}"
else
  NODE_LIST=(
    microk8s-vm1.test.local
    microk8s-vm2.test.local
    microk8s-vm3.test.local
    microk8s-vm4.test.local
    microk8s-vm5.test.local
    microk8s-vm6.test.local
  )
fi

echo "=========================================="
echo "Shop Demo deploy"
echo "=========================================="
echo "Source:    ${SHOP_DEMO_DIR}"
echo "Namespace: ${NS}"
echo ""

echo "Step 1/5: Building images (tag: ${BUILD_TAG})..."
docker build -t "${API_IMAGE}" "${SHOP_DEMO_DIR}/backend"
docker build -t "${WEB_IMAGE}" "${SHOP_DEMO_DIR}/frontend"
docker tag "${API_IMAGE}" "shop-demo-api:${BUILD_TAG}"
docker tag "${WEB_IMAGE}" "shop-demo-web:${BUILD_TAG}"

echo ""
echo "Step 2/5: Importing images into MicroK8s nodes..."
IMPORT_FAILED=0
for host in "${NODE_LIST[@]}"; do
  echo "  -> ${host}"
  if ! docker save "shop-demo-api:${BUILD_TAG}" "shop-demo-web:${BUILD_TAG}" \
    | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${host}" "microk8s ctr image import -"; then
    echo "  WARNING: image import failed on ${host}" >&2
    IMPORT_FAILED=1
  fi
done
if [[ "${IMPORT_FAILED}" -ne 0 ]]; then
  echo "ERROR: one or more node image imports failed" >&2
  exit 1
fi

echo ""
echo "Step 3/5: Applying Kubernetes manifests..."
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/configmap.yaml"
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/api-deployment.yaml"
kubectl apply -f "${SHOP_DEMO_DIR}/k8s/web-deployment.yaml"

echo ""
echo "Step 4/5: Rolling out..."
kubectl set image deployment/api api="shop-demo-api:${BUILD_TAG}" -n "${NS}"
kubectl set image deployment/web web="shop-demo-web:${BUILD_TAG}" -n "${NS}"
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
