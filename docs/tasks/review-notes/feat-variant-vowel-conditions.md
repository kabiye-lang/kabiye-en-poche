# Review notes: feat/variant-vowel-conditions

Open findings from the last Codex review (2026-10-19 22:31, manual, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [ ] [P2] `word-sections.tsx:293` — [P2] [word-sections.tsx:293] Conditional references inside related expressions lose their usage notes. `LexRef` now supports conditions for sub-entry references too ([dictionary.ts:79]), but `SubEntries` renders only the type and targets. Render those references through `LexicalReferences` and pass `translation`. No matching active or legacy spec was found. No tests were added. <!-- 6d410e04a1aa -->
