# Review notes: feat/path-step-order

Open findings from the last Codex review (2026-11-14 00:35, loop, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [ ] [P2] `mobile/src/utils/build-lesson-steps.ts:364` — [P2] **Legacy pairing can inflate practised-word counts** — [build-lesson-steps.ts:364], also line 368. For taught words `luu` and `cee` without `lexeme_id`, put an unnamed multiple-choice activity before a fill-blank naming `luu`. Default/new counts only `luu`. Speaker/heritage pairs the fill-blank to `luu`, then assigns the unrelated question to `cee`, counting both as practised. This breaks the <!-- 409fa0b38c23 -->

Same case, found by the implementer after the verifier fix (cfc24bb): with an unnamed activity listed before the one that names the word, and taught words without a `lexeme_id`, a path can count one more word as practised than no path does. None of the 192 lesson files reaches it: every taught word has a `lexeme_id` and every activity names a word. Two words that share a `lexeme_id` can also pair differently by path (greedy by rank).
