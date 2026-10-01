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
- Before editing, read the whole file (or the whole function you're changing) and plan the change. If you've edited the same spot three times for one request, stop and re-read the request: repeated patches usually mean it was misread.
- When I correct you, re-read my message and say in one line what changes, then do it. Ask first only if the correction is ambiguous.
- When the same approach fails twice (a command, a fix that doesn't hold), change approach instead of retrying it. If a second approach also fails, stop and tell me what you tried, what failed and what you'd try next.
- Before you report back, re-read my original message and check off every part of it; finish what's missing or say which parts are left and why. In a long session, also re-read it before starting each new part.

## Lanes
- Real features: `/ai:loop` (spec → independent spec review → the `implementer` agent builds → the `verifier` agent checks risky changes → independent QA). Specs live in `docs/specs/` as `SPEC-<slug>.md`; never overwrite an existing spec.
- Docs layout: specs go in `docs/specs/` as `SPEC-<slug>.md`; plans, task lists, handoffs and run notes go in `docs/tasks/`; shipped or dropped work goes in `docs/archive/`. Create the folders when missing; nothing goes at the repo root. When work ships or is dropped, `git mv` its spec and tasks to `docs/archive/` under the same names, add a line to `docs/archive/README.md` (file, what shipped or why it was dropped, month) and fix any path that cites them (`git grep <file name>`). Never edit an archived spec to match today's code; new work gets a new spec. `/ai:ship` archives what its branch finished; when `docs/specs/` or `docs/tasks/` holds something that looks finished or untouched for a month, list it and move it on my yes.
- Cloudflare: use the `cf` CLI. A folder with `cloudflare.config.ts` builds and deploys with cf (`cf build`, `cf deploy --mode <env>`), even while its old Wrangler config is still there; a folder with only a Wrangler config (`wrangler.toml`/`wrangler.jsonc`) keeps `wrangler` and its package scripts until it is migrated with `cf migrate`. Find commands with `cf cli search "<task>"` and `cf schema <command>`; run every write with `--dry-run` first; cf takes resource IDs, not names. Not in cf yet: live logs (`npx wrangler tail <worker>`) and single secrets (`npx wrangler secret put <NAME> --name <worker>`).
- Wrapping up a branch: `/ai:ship`. A pre-commit hook runs one independent review on every `git commit`; prefix `AI_LOOP_SKIP_REVIEW=1` only when a review just ran. Where `git config ai-loop.jevtriage` is set, a Jev triage of the diff runs first (`shadow` only logs; `on` may skip trivial commits and sharpen risky reviews).
- Mechanical work (renames, boilerplate, test scaffolds, surveys) goes to the cheap lane through the `grunt` agent / `grunt-run`, always with a self-contained brief. When `grunt-run --free-status` exits 0 a free model is on and the lane costs nothing: also send it first drafts of well-specified code, tests and docs, then review and run the gates yourself.
- Delegating to any subagent: give it a scope and acceptance criteria; it returns changed files, the test commands with their exit status, and log paths rather than pasted logs. One writer per file.
- Reviews come from Codex first, an OpenCode Go model second, the Claude `reviewer` agent last (flagged as same-vendor).
- Gotchas: a folder where mistakes recur carries a nested `AGENTS.md` of facts (what broke, the check that catches it) beside a one-line `CLAUDE.md` containing `@AGENTS.md`. Read it before working there; when a review finds a repeatable mistake, propose one line for it rather than fixing the instance only.
<!-- END:ai-loop -->
