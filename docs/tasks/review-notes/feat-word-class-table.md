# Review notes: feat/word-class-table

Open findings from the last Codex review (2026-10-22 16:22, manual, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [x] [P2] `mobile/src/types/dictionary.ts:106` — [P2] `mobile/src/types/dictionary.ts:106` — The new `ka lɛ` example is not present in the checked dictionary sources. Remove it or replace it with a source verified Kabiyè form. <!-- 8eb2eff8c97f -->
  Fixed: the comment now cites `["kA", "ŋga"]` under ɛnʋ, SIL p. 121, from the live classTable. `ka lɛ` was also sourced (`-lɛ`, SIL p. 292).
