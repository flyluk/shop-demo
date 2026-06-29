#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHOP_DEMO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
NAMESPACE="shop-demo"
TEST_TYPE="${1:-load}"

case "${TEST_TYPE}" in
  smoke)
    TESTRUN_FILE="${SHOP_DEMO_DIR}/k6/testrun-smoke.yaml"
    TESTRUN_NAME="shop-smoke-test"
    ;;
  load)
    TESTRUN_FILE="${SHOP_DEMO_DIR}/k6/testrun-login-cart.yaml"
    TESTRUN_NAME="shop-login-cart"
    ;;
  *)
    echo "Usage: $0 [smoke|load]"
    exit 1
    ;;
esac

echo "=========================================="
echo "Running k6 ${TEST_TYPE} test"
echo "=========================================="

if ! kubectl get namespace "${NAMESPACE}" &>/dev/null; then
  echo "ERROR: namespace ${NAMESPACE} not found. Run ./install-shop-demo.sh first."
  exit 1
fi

kubectl delete testrun "${TESTRUN_NAME}" -n "${NAMESPACE}" --ignore-not-found=true
sleep 2

kubectl create configmap k6-shop-scripts \
  -n "${NAMESPACE}" \
  --from-file="${SHOP_DEMO_DIR}/k6/smoke-test.js" \
  --from-file="${SHOP_DEMO_DIR}/k6/login-cart-test.js" \
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f "${TESTRUN_FILE}"

echo ""
echo "Watching TestRun (Ctrl+C to stop watching — test continues)..."
kubectl get testrun "${TESTRUN_NAME}" -n "${NAMESPACE}" -w &
WATCH_PID=$!

for i in $(seq 1 120); do
  STAGE=$(kubectl get testrun "${TESTRUN_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.stage}' 2>/dev/null || echo "")
  if [ "${STAGE}" = "finished" ] || [ "${STAGE}" = "error" ]; then
    break
  fi
  sleep 5
done

kill "${WATCH_PID}" 2>/dev/null || true

echo ""
kubectl get testrun "${TESTRUN_NAME}" -n "${NAMESPACE}" -o wide
echo ""

GRAFANA_IP=$(kubectl get svc -n monitoring kube-prometheus-grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
if [ -z "${GRAFANA_IP}" ]; then
  GRAFANA_IP=$(kubectl get svc -n monitoring kube-prometheus-grafana -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
fi

echo "=========================================="
echo "k6 test submitted"
echo "=========================================="
echo ""
echo "View metrics in Grafana:"
echo "  URL: http://${GRAFANA_IP:-localhost:3000} (port-forward if no LB IP)"
echo ""
echo "Import k6 dashboards (if not already):"
echo "  Dashboard ID 19665 — k6 Prometheus"
echo "  Dashboard ID 18030 — k6 Prometheus (Native Histograms)"
echo ""
echo "Useful PromQL queries:"
echo "  rate(k6_http_reqs[1m])"
echo "  k6_http_req_duration{quantile=\"0.95\"}"
