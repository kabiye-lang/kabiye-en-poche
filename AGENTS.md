# Agent instructions — Kabiyè en Poche

pnpm monorepo: `mobile/` (Expo 54 + Expo Router, Uniwind, Lingui, Supabase), `admin/` (React-admin + Vite, Supabase), `website/` (React + Vite), `supabase/`.
Hard rules (full conventions in `.cursorrules` — read it before touching lesson content, i18n, or file layout):
- Kebab-case file names everywhere.
- No summary or changelog files unless asked.
- Never fabricate Kabiyè: only words present in the provided dictionary/PDF sources; if a word isn't there, use one that is, or drop the example.

<!-- BEGIN:ai-loop (managed from ~/devs/dotfiles/claude — edit there; remove this block to opt out) -->
## Working rules
- Think before coding: state assumptions; ask when the request is ambiguous rather than guessing.
- Simplicity first: no speculative abstractions. If 200 lines could be 50, rewrite.
- Surgical changes: don't touch adjacent code; only remove orphans you created.
- Goal-driven: every task gets a verifiable "done means" (tests, build, observable behaviour) before work starts. Never report done on a self-report — run the gates.
- Tests: add one only when you can name the behaviour it protects, the credible regression that would fail it, and why the existing tests (e2e included) miss it; otherwise extend an existing case or leave it out. No tests that restate the implementation, copy fixtures, or keep a test-only export alive. A bug fix's regression test must fail on the old code. Pruning old ones: `/ai:test-audit`.
- Long runs: when a step doesn't need my input, keep going and put status notes in the same message as the next action; stop only when you can't continue without me or before anything destructive (the /ai:loop gates still wait for my yes). Build what was asked; list extras as suggestions instead of building them.

## Lanes
- Real features: `/ai:loop` (spec → independent spec review → Sonnet builds → independent QA). Specs live at the repo root as `SPEC-<slug>.md`; never overwrite an existing spec.
- Wrapping up a branch: `/ai:ship`. A pre-commit hook runs one independent review on every `git commit`; prefix `AI_LOOP_SKIP_REVIEW=1` only when a review just ran. Where `git config ai-loop.jevtriage` is set, a Jev triage of the diff runs first (`shadow` only logs; `on` may skip trivial commits and sharpen risky reviews).
- Mechanical work (renames, boilerplate, test scaffolds, surveys) goes to the cheap lane through the `grunt` agent / `grunt-run`, always with a self-contained brief. When `grunt-run --free-status` exits 0 a free model is on and the lane costs nothing: also send it first drafts of well-specified code, tests and docs, then review and run the gates yourself.
- Delegating to any subagent: give it a scope and acceptance criteria; it returns changed files, the test commands with their exit status, and log paths rather than pasted logs. One writer per file.
- Reviews come from Codex first, an OpenCode Go model second, the Claude `reviewer` agent last (flagged as same-vendor).
- Gotchas: a folder where mistakes recur carries a nested `AGENTS.md` of facts (what broke, the check that catches it) beside a one-line `CLAUDE.md` containing `@AGENTS.md`. Read it before working there; when a review finds a repeatable mistake, propose one line for it rather than fixing the instance only.
<!-- END:ai-loop -->
