#!/usr/bin/env bash
# Starts a built runtime image the way the deployment runs it and checks that it
# serves. For the backend, the add-on's migration init container command first
# applies the migrations to a throwaway PostgreSQL.
# Usage: image.sh <frontend|adminfrontend|backend> <image>
set -euo pipefail
component=$1
image=$2
network=smoke-$component

cleanup() {
  docker rm -f "$network-app" "$network-db" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT

retry() {
  for _ in $(seq 1 60); do
    if "$@" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  "$@"
}

docker network create "$network" >/dev/null
if [ "$component" = backend ]; then
  docker run -d --name "$network-db" --network "$network" -e POSTGRES_USER=det \
    -e POSTGRES_PASSWORD=smoke -e POSTGRES_DB=det "$("$(dirname "$0")/../scanners/image.sh" postgres)" >/dev/null
  # During initialisation PostgreSQL only listens on its socket.
  retry docker exec "$network-db" pg_isready -h 127.0.0.1 -U det -d det
  database=postgresql://det:smoke@$network-db:5432/det
  docker run --rm --network "$network" -e DATABASE_URL="$database" "$image" \
    /bin/sh -c 'exec node_modules/.bin/zenstack migrate deploy'
  docker run -d --name "$network-app" --network "$network" -p 127.0.0.1::5000 \
    -e DATABASE_URL="$database" -e TILES_URL=http://tiles.invalid -e TERRAIN_URL=http://terrain.invalid \
    -e ADDRESS_DATABASE_URL=http://addresses.invalid -e APP_BASE_URL=http://localhost:5000 \
    -e PUBLIC_CLIENT_BASE_URL=http://localhost:4321 -e ADMIN_CLIENT_BASE_URL=http://localhost:5173 \
    -e KEYCLOAK_ISSUER=https://keycloak.invalid/realms/smoke \
    -e KEYCLOAK_JWKS_URI=https://keycloak.invalid/realms/smoke/protocol/openid-connect/certs \
    -e AUTH_EXPECTED_AUDIENCE=smoke "$image" >/dev/null
  port=5000 path=/health user=1000
else
  docker run -d --name "$network-app" --network "$network" -p 127.0.0.1::8080 "$image" >/dev/null
  port=8080 path=/de/ user=101
fi

url="http://$(docker port "$network-app" "$port" | head -1)$path"
if ! retry curl -fsS "$url"; then
  docker logs "$network-app"
  exit 1
fi
test "$(docker exec "$network-app" id -u)" = "$user"
echo "$component serves $path as user $user"
