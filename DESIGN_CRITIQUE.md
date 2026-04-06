# Design Critique — Kabiyè en Poche

**Date:** June 2025  
**Method:** Visual audit via Maestro MCP on Android emulator (Pixel 9a, API 36)  
**Screens reviewed:** Onboarding, Home, Learn, Alphabet Lesson, Dictionary, Keyboard, Profile, Word Detail — in both light and dark modes

---

## Anti-Patterns Verdict

**Pass — this does NOT look AI-generated.** The earthy, warm palette (forest green + gold + warm cream) is distinctive and culturally grounded. There are no telltale AI design fingerprints: no gradient text, no glassmorphism, no glowing dark-mode accents, no hero metric dashboards, no generic card-grid symmetry. The typography pairing (Figtree + IBM Plex Sans Hebrew) is considered, not default. The color choices clearly come from intentional brand thinking rather than a generic LLM prompt. This app has a point of view.

---

## Overall Impression

**Gut reaction:** Warm, approachable, and clearly cultural — but undercooked. The palette and type choices establish strong brand character, yet the interface repeatedly fails to fill its space or guide the user with confidence. Multiple screens feel like wireframes wearing a nice color palette rather than finished designs. The single biggest opportunity is **density and spatial confidence** — the app has great bones but wastes too much screen real estate, making it feel empty rather than spacious.

---

## What's Working

### 1. The Earthy Color Identity
The `#FBF7F0` warm cream background with `#1B6B3C` forest green and `#C8922A` gold is genuinely distinctive. It evokes paper, earth, and tradition — perfect for a language preservation app. Unlike Duolingo's playful cartoon palette or Babbel's corporate blues, this feels rooted in something specific. The color choices answer "who is this for?" with: someone who values cultural heritage.

### 2. The Learn Tab Module Structure  
The module cards with clear progression states (active/green vs. locked/dashed with "Coming Soon" gold badges) communicate learning path hierarchy effectively. The progress bar ("1/3 lessons completed") is clear. The locked modules don't feel like punishment — they feel like visible promise.

### 3. The Custom Kabiyè Keyboard
Including ɖ, ɛ, ɣ, ɩ, ñ, ŋ, ɔ, ʊ as dedicated keys is a standout feature. This is the kind of thoughtful, domain-specific tooling that distinguishes this from a generic language app. The keyboard layout itself is well-organized.

---

## Priority Issues

### 1. CRITICAL — Dark Mode Card Backgrounds Are Broken

**What:** Word entry cards, Word of the Day cards, and dictionary entries retain their light cream (`#FBF7F0`) background in dark mode, creating enormous bright rectangles against the `#1A1714` dark background.

**Why it matters:** This is the most visually jarring element in the app. It screams "unfinished" and defeats the purpose of dark mode. Users who switch to dark mode (often at night, for eye comfort) are hit with bright white cards. The contrast ratio between the cream cards and dark background is extreme and uncomfortable.

**Fix:** Word/dictionary cards in dark mode should use a dark card surface color (e.g., `#2A2520` or `#352F28`). The Kabiyè word text should switch to the light green (`#4CAF74`) and definitions/pronunciations to the muted light text (`#F3EDE3` / `#A89F93`). Test specifically: Home WotD card, Dictionary word entries, and the synonym chips.

### 2. HIGH — Massive Empty Space on Multiple Screens

**What:** The Home screen, Keyboard screen, Word Detail page, and Profile screen all have 40-60% unused vertical space below their content.

**Why it matters:** Empty space communicates "this is all there is" — it makes the app feel thin and underdeveloped. On the Home screen, below "Lessons" and "Dictionary" buttons, there's nothing but void. On the Word Detail page, a short definition list floats in the top third of a full-screen view with nothing below. The Keyboard screen has a huge gap between instructions and the text input area.

**Fix:**
- **Home:** Add more content cards — recent activity, "Continue Learning" prompt, daily streak counter, or featured words. Alternatively, center the existing content vertically with intentional breathing room.  
- **Word Detail:** Add related words, usage examples, audio pronunciation button, "Add to favorites" CTA, or etymology notes. If content doesn't exist yet, at minimum center the existing content or add a "back to dictionary" CTA at the bottom.  
- **Keyboard:** Move the text input area higher, closer to the instructions. Add example Kabiyè sentences to type, or a "try typing" prompt.  
- **Profile:** Add learning statistics, badges, or settings to fill the space.

### 3. HIGH — Onboarding Content Appears Empty

**What:** The onboarding screen showed a cream background with "Skip" and "Next" buttons and dot indicators, but the content area between the header and buttons appeared blank — no illustration, no text explaining what the app does.

**Why it matters:** This is the user's literal first impression. An empty onboarding screen tells users nothing about what they're about to use. It should be the most persuasive, visually rich screen in the app. Every language app competitor nails onboarding with clear value propositions and visual previews.

**Fix:** Each onboarding slide should have: (1) a hero illustration or screenshot, (2) a bold headline ("Learn Kabiyè, the language of northern Togo"), (3) a supporting sentence. Three slides is right. Focus on: What is Kabiyè → What you'll learn → Daily practice promise.

### 4. MEDIUM — Color Palette Lacks Sufficient Contrast Range

**What (addressing your specific doubt):** The palette is harmonious but has a narrow contrast range. The warm cream background (`#FBF7F0`) + forest green text (`#1B6B3C`) + gold accents (`#C8922A`) all live in a similar warmth range. There's no cool counterpoint or high-contrast accent to create visual pop for critical interactive elements.

**Why it matters:** When everything is warm and earthy, nothing stands out. The "Copy" button on the Keyboard screen, the "Lessons" and "Dictionary" buttons on Home, the "Coming Soon" badges — they all blend into the same warm visual soup. The accent red (`#BF3626`) exists in the design system but was not visible on any screen I tested. Interactive elements need to visually separate from content.

**Fix:** Don't abandon the earthy palette — it's your brand strength. Instead:
- **Use the accent red** (`#BF3626`) for primary CTAs and important interactive states. It already exists in your design system but isn't being deployed.
- **Increase the green saturation** for interactive elements — the current `#1B6B3C` works for headings but is too dark/muted for buttons. Consider a brighter treatment for touchable surfaces.
- **Add a single cool accent** — even a subtle blue-green (`#2A8B7A`) for links/tappable text would create enough contrast from the warm palette to signal "this is interactive."
- **The gold** (`#C8922A`) works well for badges and secondary accents — keep it there but don't use it for primary actions.

### 5. MEDIUM — Tab Bar Icons Lack Differentiation in Inactive State

**What:** The bottom tab bar uses very muted, low-contrast inactive icons against the warm background. In dark mode, the inactive tab icons are barely visible against the dark brown background.

**Why it matters:** Users glance at the tab bar to orient themselves. If inactive tabs are nearly invisible, users must actively hunt for navigation rather than instinctively seeing their options. This adds friction to every single navigation action.

**Fix:** Increase the opacity/brightness of inactive tab icons. In light mode, use `#7A7067` instead of the current very muted tone. In dark mode, use `#A89F93`. The active green state is fine.

---

## Minor Observations

- **PDF icon in Dictionary header** (top right): Unclear affordance — is it "export as PDF"? "Download dictionary"? Needs a label or tooltip. It's an orphaned icon with no context.
- **"How to use" in Keyboard tab** has a toggle chevron (^) but the expanded text is minimal. Consider removing the toggle and just showing the instruction text permanently — it's short enough.
- **Browse by Letter grid** in Dictionary: The last row has only 2 letters ("w", "y") left-aligned with 6 empty cells. This looks imbalanced. Consider center-aligning the last row or using a flowing/wrapping layout.
- **Synonym chip** ("lak →") on Word Detail: The green chip style is good, but the arrow (→) might suggest navigation — which it is. Consider making the entire word entry tappable rather than just the chip.
- **No audio pronunciation button** visible anywhere despite the app being about learning a spoken language. This is a significant feature gap.
- **Part of speech notation** ("n.kl, l" / "n.m." / "n.f.") may be opaque to non-linguists. Consider adding a small info button or expanding abbreviations on first encounter.

---

## Questions to Consider

1. **"What would this app look like if it had 10x the content?"** — The empty space problem suggests the design wasn't stress-tested with real content density. Design for the app you want to build, not the MVP slice.

2. **"Should the Home screen be a dashboard or a launchpad?"** — Right now it's neither. If dashboard: show progress, streaks, stats. If launchpad: make the two CTAs (Lessons/Dictionary) bigger and bolder, and remove the alphabet card (it's accessible from Learn).

3. **"What if the Word of the Day was the hero?"** — It's the most engaging content on the Home screen, but it's small and pushed below the alphabet card. What if the WotD was large, beautiful, and front-center — with the Kabiyè word huge, an audio play button, and the definition below?

4. **"Does this need 5 tabs?"** — Keyboard could potentially be a modal/overlay accessible from Dictionary and lessons, rather than a permanent tab. This would simplify navigation and give the keyboard more contextual purpose (type the word you just learned).

5. **"What emotion should a user feel after spending 5 minutes here?"** — Currently the app feels *respectful and quiet*. That's not wrong for cultural content, but learning apps also need *momentum and reward*. Where are the micro-celebrations? The progress animations? The feeling of "I learned something"?

---

## Summary Rating

| Dimension | Score | Notes |
|---|---|---|
| AI Slop | ✅ Pass | Distinctive, culturally grounded |
| Visual Hierarchy | 5/10 | Weak — empty space dilutes focus |
| Information Architecture | 7/10 | Clear tab structure, logical grouping |
| Emotional Resonance | 6/10 | Warm but too quiet — needs energy |
| Discoverability | 5/10 | Muted interactive elements, unclear icons |
| Composition & Balance | 4/10 | Empty space is the #1 visual problem |
| Typography | 7/10 | Good font pairing, decent hierarchy |
| Color with Purpose | 5/10 | Cohesive but narrow — needs an interactive accent |
| Dark Mode | 3/10 | Broken card backgrounds, needs urgent fix |
| States & Edge Cases | 4/10 | Empty onboarding, no loading/error states seen |
