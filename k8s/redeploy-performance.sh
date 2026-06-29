#!/bin/bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NS=shop-demo
API_IMAGE=shop-demo-api:latest
WEB_IMAGE=shop-demo-web:latest

echo "Building images..."
docker build -t "$API_IMAGE" "$DIR/backend"
docker build -t "$WEB_IMAGE" "$DIR/frontend"

echo "Importing into MicroK8s..."
docker save "$API_IMAGE" | microk8s ctr image import -
docker save "$WEB_IMAGE" | microk8s ctr image import -

echo "Applying config..."
kubectl apply -f "$DIR/k8s/configmap.yaml"
kubectl apply -f "$DIR/k8s/api-deployment.yaml"
kubectl apply -f "$DIR/k8s/web-deployment.yaml"

echo "Rolling out..."
kubectl rollout restart deployment/api deployment/web -n "$NS"
kubectl rollout status deployment/api -n "$NS" --timeout=300s
kubectl rollout status deployment/web -n "$NS" --timeout=300s
kubectl get pods -n "$NS" -l app=api
