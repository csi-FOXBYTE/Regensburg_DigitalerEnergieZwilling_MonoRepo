#!/bin/sh
set -eu
version=${APP_VERSION:-}
if [ -n "$version" ] && ! printf '%s' "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'; then
  echo 'Invalid APP_VERSION' >&2
  exit 1
fi
printf '{"appVersion":"%s"}\n' "$version" > /tmp/regensburg-release.json
