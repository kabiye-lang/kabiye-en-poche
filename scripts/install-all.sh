#!/usr/bin/env bash

# Run npm install in the root and in configured directories.
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

echo "→ Installing in root"
npm install --legacy-peer-deps

for dir in "${DIRS[@]}"; do
  path="$ROOT_DIR/$dir"
  if [[ -f "$path/package.json" ]]; then
    echo "→ Installing in $dir"
    (cd "$path" && npm install --legacy-peer-deps)
  else
    echo "⊘ Skipping $dir (no package.json)"
  fi
done

echo "Done."
