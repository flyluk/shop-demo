#!/usr/bin/env bash
# Pull shop-demo source from dev-vm1 to local machine.
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-dev-vm1.test.local}"
REMOTE_PATH="${REMOTE_PATH:-/home/flyluk/development/shop-demo}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_PATH="$(cd "${SCRIPT_DIR}/.." && pwd)"

DIRS=(backend frontend db k8s k6 scripts)
FILES=(docker-compose.yml README.md .gitignore .gitattributes)

echo "Pulling ${REMOTE_HOST}:${REMOTE_PATH} -> ${LOCAL_PATH}"

for dir in "${DIRS[@]}"; do
  scp -r "${REMOTE_HOST}:${REMOTE_PATH}/${dir}" "${LOCAL_PATH}/"
done

for file in "${FILES[@]}"; do
  scp "${REMOTE_HOST}:${REMOTE_PATH}/${file}" "${LOCAL_PATH}/"
done

echo "Done. Local source updated at ${LOCAL_PATH}"
