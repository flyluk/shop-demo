#!/usr/bin/env bash
# Sync local shop-demo to dev-vm1 and redeploy on MicroK8s.
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-dev-vm1.test.local}"
SKIP_SYNC=0

usage() {
  echo "Usage: $0 [--skip-sync] [--remote-host HOST]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-sync)
      SKIP_SYNC=1
      shift
      ;;
    --remote-host)
      [[ $# -ge 2 ]] || usage
      REMOTE_HOST="$2"
      shift 2
      ;;
    -h | --help)
      usage
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "$SKIP_SYNC" -eq 0 ]]; then
  REMOTE_HOST="$REMOTE_HOST" bash "${SCRIPT_DIR}/sync-to-dev-vm1.sh"
fi

echo "Deploying on ${REMOTE_HOST}..."
ssh "$REMOTE_HOST" "sed -i 's/\r$//' /home/flyluk/development/shop-demo/scripts/*.sh /home/flyluk/development/shop-demo/k8s/*.sh 2>/dev/null; bash /home/flyluk/development/shop-demo/scripts/redeploy-shop-demo.sh"
