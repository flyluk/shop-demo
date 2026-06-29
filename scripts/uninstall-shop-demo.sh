#!/bin/bash
set -euo pipefail

NAMESPACE="shop-demo"
RELEASE="shop-demo-postgres"

echo "=========================================="
echo "Uninstalling Shop Demo App"
echo "=========================================="

kubectl delete testrun --all -n "${NAMESPACE}" --ignore-not-found=true
kubectl delete configmap k6-shop-scripts -n "${NAMESPACE}" --ignore-not-found=true

K8S_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../k8s" && pwd)"

kubectl delete -f "${K8S_DIR}/web-deployment.yaml" --ignore-not-found=true
kubectl delete -f "${K8S_DIR}/api-deployment.yaml" --ignore-not-found=true
kubectl delete -f "${K8S_DIR}/configmap.yaml" --ignore-not-found=true
kubectl delete secret shop-demo-secrets -n "${NAMESPACE}" --ignore-not-found=true

helm uninstall "${RELEASE}" -n "${NAMESPACE}" 2>/dev/null || true

kubectl delete namespace "${NAMESPACE}" --ignore-not-found=true

echo ""
echo "Shop Demo uninstalled."
