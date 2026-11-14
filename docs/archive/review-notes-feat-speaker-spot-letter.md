# Review notes: feat/speaker-spot-letter

Spec: `docs/archive/SPEC-speaker-spot-letter.md`. Diff review: the Claude `reviewer` agent (same vendor as the author: Codex was limited until 12:42 and the free model went silent), SHIP, no P0 or P1. Verify: the Claude `verifier` agent, PASS.

## Open notes

- **P2, owner decision.** `reviewOutcomes` (`mobile/src/utils/lesson-session.ts:298`) does not skip `built` steps. On speaker, the Finish review line can name a word whose only practice step was a missed built step ("kalʋʋ came back for a second try. You got it."), while the same screen lists it under "Words you met". A word can also get a worse review line than on `new` when its built step is missed twice. The practised count is not affected. In the 192 files, 4 built words have no other practice step: ŋŋŋ (C1-03-01), wʋyʋ (B2-06-01), kalʋʋ (A1-04-01), ɛzɩma (A1-02-04). The one-line fix, if the owner wants the summary the same on every path: `if (!word || step.built) continue`. The step still goes to the review round.
- **P3.** The `KABIYE_ONLY` comment in `mobile/src/utils/kabiye-variants.ts:43-47` says it is the one set the app uses. Copies remain in `alphabet-letter.tsx:111`, `alphabet-list.tsx:49`, `dictionary/browse-letter.tsx:16`, and `kabiye-script.ts:19` (a different set). Fix the comment, or move those to the shared set in a later change.
- **P3.** The built activity's `data` holds the word's gloss, and the fingerprint hashes `data`. A gloss-only fix to a taught word resets saved speaker sessions on that lesson, while `null` and `new` survive the same edit.
- **P3.** The tie-break relies on a stable `Array.prototype.sort` (true on V8 and current Hermes). A sort with an explicit index tie-break would remove that reliance.
- **P3.** The `isAnswerable` guard cannot fail on real words (2 special letters always give 2 misspellings). Kept: it costs nothing.

## Closed by the verifier

- Heritage pin `yfjaj1`: it is develop's value, and the pin tests also pass against develop's builder.
- A built word that also has an unpaired authored `spell` or `spot_letter`: none in the 192 files.
