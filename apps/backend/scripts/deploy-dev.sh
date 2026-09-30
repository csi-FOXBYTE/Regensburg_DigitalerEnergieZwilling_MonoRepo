
#!/usr/bin/env bash
set -euo pipefail

# Load .env if present next to this script
if [[ -f "$(dirname "$0")/.env" ]]; then
  source "$(dirname "$0")/.env"
fi

: "${SSH_HOST:?SSH_HOST is required}"
: "${SSH_USER:?SSH_USER is required}"

NAMESPACE="cc-loc-digitalenergytwin"

echo "Deploying :dev to ${NAMESPACE}..."

ssh -p "${SSH_PORT:-22}" "${SSH_USER}@${SSH_HOST}" bash <<EOF
  set -euo pipefail

  kubectl -n ${NAMESPACE} rollout restart deployment/digital-energy-twin-admin
  kubectl -n ${NAMESPACE} rollout status deployment/digital-energy-twin-admin

  kubectl -n ${NAMESPACE} rollout restart deployment/digital-energy-twin-public
  kubectl -n ${NAMESPACE} rollout status deployment/digital-energy-twin-public

  kubectl -n ${NAMESPACE} rollout restart deployment/digital-energy-twin-backend
  kubectl -n ${NAMESPACE} rollout status deployment/digital-energy-twin-backend
EOF

echo "Done."
