#!/usr/bin/env bash

# Update dependency ranges with ncu.
#
# `workspaces: true` in .ncurc.json makes a single run cover the root package.json and
# every package listed in pnpm-workspace.yaml, so there is nothing to traverse here.
#
# Under --workspaces ncu reads ONLY the root .ncurc.json — a .ncurc.json inside a
# workspace is silently ignored — which is why the Expo reject list lives at the root.
# scripts/renovate.js generates it; do not hand-edit `reject`.
#
# DIRS is for package.json files OUTSIDE the pnpm workspace, which ncu will not find.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Configure: paths relative to the project root, for directories not in pnpm-workspace.yaml
DIRS=()

cd "$ROOT_DIR"

echo "→ Updating root and all pnpm workspaces"
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
