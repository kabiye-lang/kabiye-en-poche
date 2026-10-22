# Review notes: fix/booklet-source-page

Open findings from the last Codex review (2026-10-22 02:54, manual, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [x] [P2] `mobile/src/screens/dictionary/word.tsx:386` — [P2] [mobile/src/screens/dictionary/word.tsx:386] — The early return omits booklet pages for later senses. In the exported data, **ahoye** shows page 10, but its “Camp” definition comes from page 12. Collect and display the distinct booklet pages so readers can locate each definition. TypeScript, focused ESLint, and checks against the three example entries passed. Jest was blocked by sandbox cache <!-- e8e400bdf5db -->
