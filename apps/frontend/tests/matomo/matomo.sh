#!/usr/bin/env bash
# Local Matomo for the public frontend's web analytics. See README.md.
set -euo pipefail
cd "$(dirname "$0")"
export MSYS_NO_PATHCONV=1 # Git Bash: keep container paths as they are

MATOMO_PORT="${MATOMO_PORT:-8090}"
WEB_PORT="${WEB_PORT:-4329}"
compose() { docker compose -f compose.yml "$@"; }
reset_visits() {
  compose exec -T matomo-db mariadb -umatomo -pmatomo matomo -e \
    'TRUNCATE matomo_log_visit; TRUNCATE matomo_log_link_visit_action;'
  # Reports already built for these days are rebuilt from the emptied log.
  compose exec -T matomo php /var/www/html/console core:invalidate-report-data \
    --sites=1 --dates="$(date -u -d '-7 days' +%F),$(date -u +%F)" > /dev/null
}

case "${1:-}" in
  up)
    compose up -d matomo-db matomo web
    compose up -d --wait matomo
    echo 'Installing Matomo (skipped if already installed) ...'
    compose run --rm playwright install.spec.ts
    # Local only: Matomo is reached as localhost:<port> and as http://matomo.
    compose exec -T matomo php /var/www/html/console config:set \
      --section=General --key=enable_trusted_host_check --value=0 > /dev/null
    # Required for the DEZ tracker: a visit is the tab session sent as _id.
    # By default Matomo merges everyone with the same IP and browser into one visit.
    compose exec -T matomo php /var/www/html/console config:set \
      --section=Tracker --key=trust_visitors_cookies --value=1 > /dev/null
    echo 'Applying the privacy configuration (configure.spec.ts) ...'
    compose run --rm playwright configure.spec.ts
    echo 'Building and starting the frontend (first run takes a few minutes) ...'
    compose up -d --wait --wait-timeout 1200 web
    cat << EOF

Frontend with web analytics:  http://localhost:${WEB_PORT}/de/
Matomo:                       http://localhost:${MATOMO_PORT}/  (admin / admin-Passw0rd!)
Visits appear under Visitors > Visits Log; run ./matomo.sh test for the automated check.
EOF
    ;;
  test)
    reset_visits
    compose run --rm playwright funnel.spec.ts "${@:2}"
    ;;
  seed)
    # Adds visits from simulated users; does not delete existing data.
    compose run --rm -e SEED_USERS="${2:-20}" playwright seed.spec.ts "${@:3}"
    ;;
  reset)
    reset_visits
    echo 'All visits deleted.'
    ;;
  rebuild)
    compose up -d --force-recreate --wait --wait-timeout 1200 web
    ;;
  logs)
    compose logs -f "${@:2}"
    ;;
  down)
    compose --profile tools down -v
    ;;
  *)
    echo "Usage: $0 up | test | seed [users] | reset | rebuild | logs [service] | down" >&2
    exit 1
    ;;
esac
