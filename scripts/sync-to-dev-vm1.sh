#!/usr/bin/env bash
# Push local shop-demo source to dev-vm1.
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-dev-vm1.test.local}"
REMOTE_PATH="${REMOTE_PATH:-/home/flyluk/development/shop-demo}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"

DIRS=(backend frontend db k8s k6 scripts)
FILES=(docker-compose.yml README.md .gitignore .gitattributes)

echo "Pushing ${LOCAL_PATH} -> ${REMOTE_HOST}:${REMOTE_PATH}"

for dir in "${DIRS[@]}"; do
  scp -r "${LOCAL_PATH}/${dir}" "${REMOTE_HOST}:${REMOTE_PATH}/"
done

for file in "${FILES[@]}"; do
  scp "${LOCAL_PATH}/${file}" "${REMOTE_HOST}:${REMOTE_PATH}/"
done

ssh "$REMOTE_HOST" "sed -i 's/\r$//' ${REMOTE_PATH}/scripts/*.sh ${REMOTE_PATH}/k8s/*.sh 2>/dev/null; chmod +x ${REMOTE_PATH}/scripts/*.sh ${REMOTE_PATH}/k8s/*.sh 2>/dev/null; true"

echo "Done. Remote source updated at ${REMOTE_HOST}:${REMOTE_PATH}"
