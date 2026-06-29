#!/bin/bash
# Wrapper — canonical script is ../scripts/redeploy-shop-demo.sh
exec "$(cd "$(dirname "${BASH_SOURCE[0]}")/../scripts" && pwd)/redeploy-shop-demo.sh" "$@"
