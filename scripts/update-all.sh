#!/usr/bin/env bash

# Run ncu in the root and in configured directories.
# Edit the DIRS array below to add or remove directories.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configure: add relative paths from project root
DIRS=(
  "admin"
  "website"
)

cd "$ROOT_DIR"

echo "→ Updating root"
ncu -u

for dir in "${DIRS[@]}"; do
  path="$ROOT_DIR/$dir"
  if [[ -f "$path/package.json" ]]; then
    echo "→ Updating $dir"
    (cd "$path" && ncu -u)
  else
    echo "⊘ Skipping $dir (no package.json)"
  fi
done

echo "Done."
