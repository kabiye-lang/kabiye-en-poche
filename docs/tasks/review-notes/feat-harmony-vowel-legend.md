# Review notes: feat/harmony-vowel-legend

Open findings from the last Codex review (2026-10-19 22:01, manual, SHIP). Written by codex-review after each review; `review-notes --write` rebuilds it
from ~/.local/state/ai-loop/findings.jsonl and `review-notes --recheck` checks them against the code. Tick a box when handled.

- [ ] [P2] `mobile/src/screens/dictionary/word.tsx:348` — [P2] [mobile/src/screens/dictionary/word.tsx:348] The new row only appears when Supabase provides `detail.vowel`. This diff adds the type and renderer, but no in-repo data source supplies that field. Add source-backed vowel mappings to the source that builds `dictionary_abbreviations`, then check that a populated row appears in the dictionary. <!-- 942aeade6fc5 -->
