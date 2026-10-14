#!/usr/bin/env bash
# Throwaway Matomo and Keycloak for testing the Keycloak login. See README.md.
set -euo pipefail
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1 # Git Bash: keep container paths as they are

MATOMO=http://localhost:8093
ADMIN_PASSWORD='admin-Passw0rd!'
compose() { docker compose -f compose.yml "$@"; }
api() {
  curl -fsS "$MATOMO/index.php" --data module=API --data format=json "$@"
}

case "${1:-}" in
  up)
    compose up -d --build --wait keycloak matomo
    echo 'Installing Matomo (skipped if already installed) ...'
    compose run --rm playwright install.spec.ts
    echo 'Restarting Matomo so the entrypoint activates LoginOIDC ...'
    compose restart matomo
    compose up -d --wait matomo
    compose logs matomo | grep -i loginoidc || true

    echo "Creating the Matomo user anna (Keycloak user ben stays without one) ..."
    token=$(api --data method=UsersManager.createAppSpecificTokenAuth \
      --data userLogin=admin --data-urlencode "passwordConfirmation=$ADMIN_PASSWORD" \
      --data description=sso-test | sed -E 's/.*"value":"([^"]+)".*/\1/')
    if api --data method=UsersManager.userExists --data userLogin=anna \
      --data "token_auth=$token" | grep -q true; then
      echo 'anna already exists'
    else
      api --data method=UsersManager.addUser --data userLogin=anna \
        --data-urlencode 'password=anna-Passw0rd!' --data email=anna@example.invalid \
        --data initialIdSite=1 --data-urlencode "passwordConfirmation=$ADMIN_PASSWORD" \
        --data "token_auth=$token"
      echo
    fi
    cat << EOF

Matomo:    $MATOMO/  (break-glass superuser admin / $ADMIN_PASSWORD)
Keycloak:  http://keycloak:8092/admin/  (admin / admin, realm dez)
Keycloak users (password = username): anna (has a Matomo user), ben (has none),
admin (same name as the Matomo superuser).
Needs "127.0.0.1 keycloak" in the hosts file of the machine running the browser.
EOF
    ;;
  logs) compose logs -f matomo keycloak ;;
  down) compose --profile tools down -v ;;
  *)
    echo "usage: $0 up|logs|down" >&2
    exit 1
    ;;
esac
