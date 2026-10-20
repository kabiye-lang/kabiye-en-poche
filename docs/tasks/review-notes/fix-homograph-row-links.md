# Review notes: fix/homograph-row-links

Open findings from the last Codex review (2026-10-19 20:55, manual, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [ ] [P3] `mobile/uniwind-types.d.ts:5` — [P3] [mobile/uniwind-types.d.ts:5]: This generated file has indentation-only changes unrelated to homograph routing. Revert the formatting change. No applicable active spec was found. Tests were not run. <!-- 5115c85719c9 -->
