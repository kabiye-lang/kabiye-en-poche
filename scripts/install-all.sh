#!/usr/bin/env bash

# Run pnpm install in the root and in configured directories.
# Edit the DIRS array below to add or remove directories.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "→ Installing all workspace packages"
pnpm install

echo "Done."

echo "Done."
