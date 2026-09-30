#!/usr/bin/env bash

set -uo pipefail

APP_LABEL="app=digital-energy-twin-backend"
EXPECTED_IMAGE="ghcr.io/csi-foxbyte/regensburg_digitalerenergiezwilling_backend@sha256:3b4e09768fe57b1883907bb7c2d3813eeedea8863a1602fcf987b0c5cc4b5008"
DEFAULT_ADDON_ENV="/cc-dev/civitas-core/core_platform/addons/digital-energy-twin_addon/scripts/.env"
ADDON_ENV_FILE="${ADDON_ENV_FILE:-$DEFAULT_ADDON_ENV}"

section() {
  printf '\n== %s ==\n' "$1"
}

section "Expected backend image"
printf '%s\n' "$EXPECTED_IMAGE"

section "Deployment helper tag"
if [[ -f "$ADDON_ENV_FILE" ]]; then
  grep '^TAGS=' "$ADDON_ENV_FILE" || printf 'No TAGS entry found in %s\n' "$ADDON_ENV_FILE"
else
  printf 'Addon environment file not found at %s\n' "$ADDON_ENV_FILE"
  printf 'Set ADDON_ENV_FILE=/path/to/scripts/.env if it is elsewhere.\n'
fi

section "Kubernetes context"
kubectl config current-context

section "Backend Deployment"
kubectl get deployment -A -l "$APP_LABEL" \
  -o custom-columns='NS:.metadata.namespace,DEPLOYMENT:.metadata.name,SPEC_IMAGE:.spec.template.spec.containers[0].image,GENERATION:.metadata.generation,OBSERVED:.status.observedGeneration,READY:.status.readyReplicas,UPDATED:.status.updatedReplicas,AVAILABLE:.status.availableReplicas'

section "Backend pods"
kubectl get pods -A -l "$APP_LABEL" \
  -o custom-columns='NS:.metadata.namespace,POD:.metadata.name,CREATED:.metadata.creationTimestamp,PHASE:.status.phase,POD_IP:.status.podIP,SPEC_IMAGE:.spec.containers[0].image,IMAGE_ID:.status.containerStatuses[0].imageID,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount'

NS="$(kubectl get pods -A -l "$APP_LABEL" -o jsonpath='{.items[0].metadata.namespace}' 2>/dev/null || true)"
if [[ -z "$NS" ]]; then
  printf '\nNo backend pod was found. The addon deployment was probably skipped or failed before creating pods.\n'
  exit 1
fi

section "Backend ReplicaSets"
kubectl get replicasets -n "$NS" -l "$APP_LABEL" \
  -o custom-columns='REPLICASET:.metadata.name,CREATED:.metadata.creationTimestamp,DESIRED:.spec.replicas,CURRENT:.status.replicas,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image'

NEW_POD="$(kubectl get pods -n "$NS" -l "$APP_LABEL" \
  --sort-by=.metadata.creationTimestamp \
  -o jsonpath='{.items[-1].metadata.name}' 2>/dev/null || true)"

section "Newest pod"
printf '%s\n' "$NEW_POD"

section "Newest pod migration logs"
kubectl logs -n "$NS" "$NEW_POD" -c migrate --tail=200 || true

section "Newest pod events"
kubectl get events -n "$NS" \
  --field-selector "involvedObject.kind=Pod,involvedObject.name=$NEW_POD" \
  --sort-by=.lastTimestamp || true

section "Backend versions inside running pods"
while IFS= read -r pod; do
  [[ -z "$pod" ]] && continue
  printf '%s: ' "$pod"
  kubectl exec -n "$NS" "$pod" -c backend -- \
    node -p "require('/app/package.json').version" 2>&1 || true
done < <(kubectl get pods -n "$NS" -l "$APP_LABEL" \
  --field-selector=status.phase=Running \
  -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}')

section "Backend Services"
kubectl get services -n "$NS" -l "$APP_LABEL" -o wide

section "Backend EndpointSlices"
kubectl get endpointslices -n "$NS" \
  -l 'kubernetes.io/service-name' \
  -o custom-columns='NAME:.metadata.name,SERVICE:.metadata.labels.kubernetes\.io/service-name,ADDRESSES:.endpoints[*].addresses[*],READY:.endpoints[*].conditions.ready' |
  grep -E 'NAME|digital|det|backend' || true

printf '\nAll checks were read-only.\n'
