# SPEC — Website: narrow screens, truthful acquisition, honest controls

Source: `../design_handoff_laterite/IMPLEMENTATION-REVIEW.md` §5. Order: 5 of 5. Contrast/focus/toggle height are in `SPEC-laterite-a11y-foundations.md` (which also adds `lint:check`); copy about outcomes and generation is in `SPEC-honest-outcomes.md`.

Revision 2 — folds in the Codex spec review (2026-09-21). Rejected findings at the end.

## Decisions already made

- No public store or TestFlight link exists. No store badges until one does.
- The newsletter form is removed until a real list exists.
- Because active TestFlight intake is not confirmed, the site does **not** claim iOS testing is under way; it says the app is coming and offers a mailto to hear when it is out. (Owner can swap the copy when TestFlight intake is confirmed.)

## Changes — `website/src/pages/Home.tsx` unless noted

1. **Acquisition, hero (~L310-324) and footer (~L645-660)**
   - Remove both badge links (`href="#"`). Keep the image files in `public/`.
   - Hero: availability statement, 17px `text-ink`: EN "Coming to iPhone and Android." FR "Bientôt sur iPhone et Android."
   - Below it one text link: EN "Tell me when it's out" FR "Prévenez-moi à la sortie" → `mailto:hello@kabiye-en-poche.org?subject=Kabiy%C3%A8%20en%20Poche` (same address as "Record with us" ~L604-609). Class: `inline-flex min-h-11 items-center underline underline-offset-4` (+ `text-paper` in the footer). Both hero and footer links ≥ 44px tall.
   - Remove `t.availability` (L21/L114) — replaced.
   - Footer: same statement + link instead of the badge row (also removes the 12px overflow at 320px).
   - `downloadNow` (EN+FR): rewrite to "Coming soon to iPhone and Android." / "Bientôt sur iPhone et Android." if it asks people to download.
   - Nav "Get the app" CTA (~L268, → `#get-the-app`): hide below `sm` (`hidden sm:inline-flex`) so the nav fits at 320px in FR; keep the label truthful — rename to "The app" / "L'application" if it says "Get".
2. **Section ids and links** — ids today are wrong: `#dictionary` is on the alphabet playground (~L370) and `#alphabet` is on "Who it's for" (~L429). No dictionary section exists.
   - Playground section → `id="alphabet"`; audience section → `id="audience"`.
   - Nav (~L248-251) → `#alphabet`, `#lessons`, `#contribute`; drop Dictionary (no destination). Remove `navDictionary` strings.
   - Footer columns: replace string arrays `footerLinks` / `footerMoreLinks` with `{ label, href }[]` per language. Project: Alphabet `#alphabet`, Lessons `#lessons`, Contribute `#contribute`. More: GitHub → the existing URL (~L611). Drop "Sources & licences", "Privacy", "Terms" (no destinations exist).
3. **Newsletter** — remove `<NewsletterSignup lang={lang} />` (L634) and import (L4); delete `components/newsletter-signup.tsx` if nothing else imports it. No orphan heading or empty colour band.
4. **Clipboard — `handleCopyPad`** (~L226-231):
   - Replace `copied: boolean` with `copyStatus: 'idle' | 'copied' | 'failed'`.
   - On press: clear any pending timer, set `idle`; if `!navigator.clipboard?.writeText` → `failed`; else `try { await writeText(pad); set 'copied' } catch { set 'failed' }`. Timer resets `copied` → `idle` after 1600ms; a newer attempt supersedes it. Editing the pad resets to `idle`.
   - The Copy button label stays "Copy"/"Copied" as today for `copied`. Below the controls, a dedicated `<p role="status" aria-live="polite">` shows "Copied" / "Copié" or "Could not copy — select the text and copy it yourself." / "Copie impossible — sélectionnez le texte et copiez-le vous-même.", empty when idle. Do not reuse the pad-contents live region.
5. **Unreachable keyboard modal** — `<KabiyeKeyboard>` (~L275-279) is never opened. Remove the mount, `isKeyboardOpen` state, `openKeyboard` strings (L50/L141), and `components/kabiye-keyboard.tsx` if nothing else imports it. (Its clipboard bug disappears with it; spec 1's edit to its link colour becomes moot — skip it if not yet made.)
6. **Remove** `console.log(browserLang)` (L216).
7. **Narrow screens** — whole-page audit at 320px, EN and FR, not just grid minima: any element wider than its container gets a fix at the cause (wrap, `min(…,100%)`, smaller mobile padding `px-5 sm:px-8` on sections if needed). No `overflow-x: hidden` used as a fix; remove any that exists for that purpose.

## Out of scope

Newsletter service, store listing, new sections (incl. a dictionary section), screenshots, restyling. Footer-on-ink contrast already passes (paper at 55%/60% on ink ≈ 5.29 / 6.00:1) — no change.

## Done means

- [ ] `pnpm -C website build` and `pnpm -C website lint:check` exit 0; gates leave `git status` unchanged.
- [ ] `grep -rn 'href="#"' website/src` and `grep -rnE "console.log|app-store-badge|google-play-badge|NewsletterSignup|KabiyeKeyboard" website/src` → nothing.
- [ ] Browser check (done by the loop owner with the Playwright MCP against `pnpm -C website dev`), reduced motion emulated, at 320, 375 and 1280px × EN/FR (6 runs), screenshots saved as `website-{width}-{lang}.png` in the session scratchpad:
  - `documentElement.scrollWidth <= documentElement.clientWidth + 1`;
  - every element's rect has `left >= -1` and `right <= clientWidth + 1` (ignoring `aria-hidden` decoration that is clipped by design — list any);
  - every `a[href^="#"]` resolves to exactly one element with that id; no `href="#"`;
  - both mailto links and the language toggle measure ≥ 44px tall.
- [ ] Clipboard, in the browser with `navigator.clipboard.writeText` stubbed: reject → status "Could not copy…", never "Copied"; resolve → "Copied"; fail then succeed → only "Copied"; succeed then fail → only the failure text; `navigator.clipboard` undefined → failure text.
- [ ] Keyboard-only: Tab reaches every alphabet tile, Delete/Clear/Copy and both mailto links; Enter/Space activate buttons.

## Review findings rejected

- #4 (raise footer opacity) — item removed: the existing values already pass.
