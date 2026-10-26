# Review notes: docs/lesson-gotchas

Open findings from the last Codex review (2026-10-26 05:02, manual, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [x] [P2] `mobile/AGENTS.md:6` — [P2] [mobile/AGENTS.md:6] — “shows only” overstates the status gate. `learn-path.ts:37` also lists `maintenance` lessons, rendered as “Being corrected” in `learn.tsx:205`. Fix: say “counts as written/openable only” instead of “shows only.” The other four claims match the named code. No applicable active spec or added tests found. Excluded `docs/tasks/`. Whitespace check passed. Runtime tests were  <!-- 9c5ee0aa1d4f -->
