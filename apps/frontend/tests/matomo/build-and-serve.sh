#!/usr/bin/env bash
# Builds the public frontend from a copy of the (read-only) checkout, then serves it.
set -euo pipefail

echo 'Copying checkout ...'
rm -rf /w && mkdir /w
tar -C /src --exclude=node_modules --exclude=.astro --exclude=dist \
  --exclude=apps/frontend/tests/matomo/results -cf - . | tar -xf - -C /w

cd /w
corepack enable
echo 'Installing dependencies ...'
CI=true pnpm install --frozen-lockfile > /tmp/install.log 2>&1 || {
  tail -40 /tmp/install.log
  exit 1
}
echo 'Building frontend ...'
pnpm --filter ./packages/energy-core build:code > /tmp/core.log 2>&1 || {
  tail -40 /tmp/core.log
  exit 1
}
pnpm --filter ./apps/frontend build > /tmp/build.log 2>&1 || {
  tail -40 /tmp/build.log
  exit 1
}

rm -rf /dist/* && cp -r apps/frontend/dist/. /dist/
exec node /harness/serve.mjs
