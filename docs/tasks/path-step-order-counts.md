# Path step order: counts (build step 1)

Measured on 2026-11-13 for `docs/specs/SPEC-path-step-order.md`, build step 1.

## Source

- Folder: kbp-content `storage/lessons/notebooklm-json`, copied to a scratch folder first.
- Files: 192. The spec says 189. kbp-content commit `07c2dd33` (2026-11-13) added 3 lessons after the spec was written: Translating Proverbs, Genres of Oral Literature, Glossing a Sentence. Two files are legacy (`001-01-Alphabet-and-Sounds`, `001-02-Vowel-Harmony-and-Length`). The lesson code `C1-05-03` occurs in two files.
- Method: the app's own `taughtWords` and `isAnswerable` from `mobile/src/utils/build-lesson-steps.ts`, with no recordings. So no audio activity is answerable. A word "matches" an activity by the builder's rule: `lexeme_id`, else `correct`, else `answer`, equal to the word's `kbp` or `lexeme_id`.

## Words

| Count | Value |
|---|---|
| Taught words, all lessons | 1,320 |
| Taught words with a Kabiyè-only letter (ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ) | 1,002 |
| Words that match no answerable activity | 20 |
| Words that match exactly 1 | 609 |
| Words that match 2 or more | 691 |
| Words that match a spelling activity (`spell`, `spot_letter`) | 596 |
| Words that match a recognition activity (`read_choose`, `match_pairs`, `multiple_choice`) | 901 |
| Words that match a production activity (`fill_blank`, `order_words`) | 376 |
| Words that match a spelling activity and another type | 404 |
| Words that match a recognition activity and `spell`, `fill_blank` or `order_words` | 242 |

## Effect of the change

| Count | Value |
|---|---|
| Speaker: words whose paired activity changes | 157 |
| Heritage: words whose paired activity changes | 257 |
| Heritage: words paired to production (`spell`, `fill_blank`, `order_words`), so their practice is deferred to after their section's last word (for the last word itself the position does not change) | 165 |
| Activities no word claims today (they run after the sections) | 889 |
| Lessons with an unclaimed `spell` or `spot_letter` today | 121 |
| Lessons with at least one answerable spelling activity | 192 of 192 |
| Lessons whose step list changes for speaker | 121 of 192 |
| Lessons whose step list changes for heritage | 184 of 192 |
| Lessons whose step list changes for `new` or no path | 0 of 192 (byte-identical steps and fingerprints) |
| Lessons whose practised words (`wordKbp` set) or step ids differ from today, speaker or heritage | 0 of 192 |

More than half the taught words (691 of 1,320) match more than one activity. So the pairing change has a real effect, and the spec's fallback ("the effect comes from the card lead, the unclaimed sort and the heritage deferral") does not apply. Every lesson has a spelling activity. So the edge case "a lesson with no `spell` or `spot_letter`" does not occur in today's content.

## Answerable activities by type

| Type | Count |
|---|---|
| `multiple_choice` | 511 |
| `spot_letter` | 461 |
| `read_choose` | 449 |
| `fill_blank` | 212 |
| `order_words` | 209 |
| `match_pairs` | 207 |
| `spell` | 140 |
