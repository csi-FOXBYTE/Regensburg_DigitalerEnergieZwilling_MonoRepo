#!/usr/bin/env bash
# Runs the given specs from this directory with the browser on the same
# Docker network as Matomo. The build is served on localhost inside this
# container so the page keeps a secure context.
set -euo pipefail

mkdir -p /runner/tests
cp /harness/*.ts /runner/tests/
cp /harness/playwright.config.mjs /runner/
cd /runner
if [ ! -d node_modules/@playwright/test ]; then
  echo '{"name":"dez-matomo-runner","private":true}' > package.json
  npm install --silent --no-audit --no-fund @playwright/test@1.62.1
fi

DIST=/dist PORT=4321 node /harness/serve.mjs > /tmp/serve.log 2>&1 &
npx playwright test "$@"
