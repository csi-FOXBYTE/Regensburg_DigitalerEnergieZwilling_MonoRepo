#!/usr/bin/env sh
# Prints the pinned image reference of one scanner stage of the Dockerfile.
awk -v stage="$1" '$1 == "FROM" && $3 == "AS" && $4 == stage { print $2; found = 1 } END { exit !found }' \
  "$(dirname "$0")/Dockerfile"
