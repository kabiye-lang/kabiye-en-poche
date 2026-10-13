# admin gotchas

- Audio writes: normalise and validate the merged row, not the patch, in every data-provider path.
- Keep reviewed snapshots tied to drafts and selections across refetches and pagination.
- The jsdom component tests resolve jsdom through the workspace, not an admin dependency. Declare jsdom@20.0.3 in admin once pnpm can re-resolve the lockfile; on 2026-10-13 minimumReleaseAge blocked that, and `pnpm add` wrote a snapshot without its supports-color suffix.
