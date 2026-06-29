#!/bin/bash
# Apply schema + seed data (safe to re-run). Use after Postgres reinstall/helm upgrade.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NS="${NAMESPACE:-shop-demo}"
PG_POD="shop-demo-postgres-postgresql-0"
INIT_SQL="${SCRIPT_DIR}/../db/init.sql"

if [[ ! -f "$INIT_SQL" ]]; then
  echo "ERROR: init.sql not found at $INIT_SQL"
  exit 1
fi

PW="$(kubectl get secret shop-demo-secrets -n "$NS" -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)"

kubectl exec -i -n "$NS" "$PG_POD" -- env PGPASSWORD="$PW" psql -U shopuser -d shopdb -v ON_ERROR_STOP=1 <"$INIT_SQL"

echo "Applied init.sql (tables, index, seed products if empty)."
