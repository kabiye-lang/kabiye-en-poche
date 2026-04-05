# Design Critique: Kabiyè en Poche

## App Context

**Purpose**: A language learning app for Kabiyè — a Gur language spoken primarily in northern Togo by ~1 million people. The app provides dictionary lookup, structured lessons (alphabet, phonology, vocabulary), a custom keyboard for Kabiyè's special characters, and external learning resources.

**Target audience**: Diaspora Togolese reconnecting with their heritage language, linguistics enthusiasts, and anyone in the Kabiyè community wanting to learn/preserve their language.

**What it needs to feel like**: Warm, culturally grounded, trustworthy, approachable. This is a language preservation tool — it should feel like a gift from the community, not a Silicon Valley product.

---

## Anti-Patterns Verdict

**Partial fail.** The app has several recognizable AI-generated tells, though it avoids the worst offenders:

- **Purple-to-cyan gradient hero banner** — This is essentially the "AI color palette" described in the anti-patterns. Purple (#6200EE) primary + cyan (#03DAC6) secondary is Material Design's default theming. When combined as a gradient on the hero card, it reads as "I asked an AI to pick brand colors." No connection to Kabiyè culture, Togo, or the app's identity.
- **Identical card grids** — The "Let's Learn Together!" section is a 2×2 grid of same-sized cards with icon + heading + text, repeated identically. The Coming Soon cards and active cards look nearly the same except for opacity.
- **Everything wrapped in cards** — Home, Learn, Profile, Dictionary — virtually every piece of content is inside a rounded card with light gray background. There's no visual hierarchy variation; it's cards all the way down.
- **Generic rounded rectangles with subtle shadows** — The card component defaults to `rounded-xl` + `shadow-card`, which is exactly the "safe, forgettable" pattern from the anti-patterns.
- **Centered everything** — Most screens are vertically stacked, centered content in cards. No asymmetry, no editorial layout choices.

**What it avoids**: No glassmorphism, no gradient text, no sparklines, no dark-mode-with-glowing-accents. The typography (Figtree) is a solid, modern choice that avoids the Inter/Roboto trap.

---

## Overall Impression

The app is **functionally competent but visually anonymous**. It works — the information architecture is logical, the tab structure is clear, the lesson flow makes sense. But it could be any language app for any language. There is nothing in the visual design that says "Kabiyè," "Togo," or "West African language." The purple-cyan-orange palette feels arbitrary. The real missed opportunity: this app could be a point of cultural pride, but instead it looks like a generic Duolingo clone built from a template.

The single biggest opportunity: **ground the design in Kabiyè cultural identity** — use colors, patterns, or typography references that connect to Togolese/Kabiyè visual culture. Even subtle warming of the palette would transform the feel.

---

## What's Working

### 1. Typography system is strong
Figtree as the display/body font is an excellent choice. It's modern, readable, and distinctive without being distracting. The type scale (h1 through small) creates a functional hierarchy, and the bold headword treatment in the dictionary (purple bold for Kabiyè terms) creates visual anchoring. The lesson detail page's content card with body text is genuinely comfortable to read.

### 2. Dictionary information architecture is solid
The Dictionary tab is the best-designed screen. The language toggle (Kabiyè ↔ English) is immediately clear. Word of the Day provides instant engagement. Browse by Letter with the alphabet grid is intuitive and well-suited to dictionary exploration. The word detail page — headword → definitions → examples — flows logically. This is a well-thought-out information hierarchy.

### 3. Lesson progress system communicates state effectively
The Learn tab's use of status icons (checkmark = completed, open circle = in progress, lock = locked) with corresponding opacity and helper text ("Completed", "Tap to start", "Complete previous lesson to unlock") is clear. The progress bar on the unit card (1/3 lessons completed) and the lesson detail progress indicator (1/19) give learners spatial awareness.

---

## Priority Issues

### 1. The palette has no cultural identity
**What**: Purple (#6200EE) + Cyan (#03DAC6) + Orange (#FF5722) is Google's Material Design default color scheme. It bears no relationship to Kabiyè culture, Togolese visual identity, or language learning as a domain.

**Why it matters**: Language preservation apps carry cultural weight. When a Kabiyè speaker opens this, they should feel "this was made for us." Instead, the palette communicates "this was generated." The purple-to-cyan gradient hero is particularly generic — it's the default gradient an AI produces when asked for a "colorful, modern" banner.

**Fix**: Research Togolese cultural palettes. Consider warm earth tones (terracotta, ochre, deep greens) inspired by Togolese kente cloth, the Togo flag (green, gold, red, white), or the northern Togo landscape. Even shifting the primary from cold purple to a warmer hue (deep amber, warm red, forest green) would transform the app's emotional register. The hero gradient should be replaced with something culturally resonant.

### 2. Cards-on-cards visual monotony
**What**: Every screen is a vertical stack of identically-styled rounded cards on a light gray background. Home has 6+ cards. Profile has 8+ cards. Learn is cards inside an expandable card. There's no visual rhythm or variation.

**Why it matters**: When everything is a card, nothing stands out. The eye has no anchor. Continue Learning, Learn the Basics, and the unit grid all compete at the same visual weight. Users can't quickly scan to find what matters because every section looks the same.

**Fix**: Break the card tyranny. The Continue Learning CTA deserves more visual presence — perhaps a full-width component without the card wrapper. The "Word of the Day" in Dictionary could break out of the card grid with a larger, bolder treatment. The Profile page's list items (Learning Resources, Support) don't need cards — simple list rows with dividers would reduce visual noise. Reserve cards for items that genuinely need containment (lesson items, dictionary entries).

### 3. The Home screen tries to do too much
**What**: The Home screen has 5 distinct sections (Hero, Continue Learning, Learn the Basics, Let's Learn Together grid, View All CTA) competing in a single scroll view. The "Let's Learn Together!" section duplicates what's on the Learn tab. The orange "View All" card feels disconnected.

**Why it matters**: A new user landing here has cognitive overload. What should they do first? The hero says "Learn Kabiyè in a fun way" but provides no action. Continue Learning is the most useful section for returning users but sits below a large gradient banner that provides no value after first launch.

**Fix**: The Home screen should have a clear primary action path. For new users: start the first lesson. For returning users: continue where they left off. The hero banner should either be dismissable or replaced with a progress dashboard after the first session. The "Let's Learn Together!" grid duplicates the Learn tab and can be removed or reduced to a single featured unit. The orange "View All" button is effective but visually jarring — its bright orange on a gray/white page feels like a different app.

### 4. Dictionary word detail pages feel empty and unfinished
**What**: The word detail page for "waaa" shows: headword → one definition → one example → vast empty space. Most of the screen is blank white. No part of speech, no pronunciation guide (despite it existing in the data for other words), no "related words," no "hear pronunciation" button.

**Why it matters**: The dictionary is the app's most powerful reference tool. Sparse word entries make the dictionary feel incomplete, which erodes trust. Users expect richness from a dictionary — and the data appears to exist (the "Browse by Letter" list previews show pronunciation brackets and definitions). The blank space below the single example makes it feel broken.

**Fix**: Fill the vertical space with useful content: part of speech tag, pronunciation with audio playback, all available translations (French + English), related words, link back to browse by letter. If data is genuinely sparse for some entries, use an empty-state pattern — "Help us expand this entry" or "Contribute a translation" — that turns the gap into community engagement.

### 5. Keyboard tab's text area is mispositioned
**What**: The Keyboard screen has instructional text at the top, then a massive blank gap, then the text input area, then the keyboard. The text area sits awkwardly in the middle of the screen with no visual connection to the keyboard below it.

**Why it matters**: The keyboard is a utility tool — people use it to quickly type Kabiyè text and copy it. The empty space makes the flow feel broken. The Clear/Copy buttons being between the text area and keyboard further fragments the layout.

**Fix**: Move the text input directly above the keyboard with no gap. The instructional text can become a collapsible hint or first-time tooltip. Clear/Copy buttons should be inline with the text area (perhaps as a toolbar above it or icons inside the field). This is a tool screen — it should feel efficient, not spacious.

---

## Minor Observations

- **Tab bar icons are lightweight** — The unfocused tab icons (outline weight) are hard to distinguish at a glance. The active state (filled icon + purple + underline) is adequate but the resting state feels too faint.
- **"Coming Soon" units lack visual differentiation** — On the Learn tab, Coming Soon units are just lower opacity. They should feel clearly disabled — perhaps with a subtle pattern overlay or different background treatment that says "this is future content" rather than "this is broken."
- **The PDF icon on Dictionary** is cryptic — Top-right corner has a PDF icon with no label. Users won't know what it does without tapping it. Add a label or tooltip.
- **Progress bar in Profile** — The purple progress bar at 33% is functional but the bar itself is thin and hard to spot. A thicker bar with a label inside it (or a circular progress indicator) would be more rewarding.
- **Beginner badges** are green pills that read as "success" rather than "difficulty level." Consider a different shape or position so they don't compete with the completion checkmarks which are also green.
- **Browse by Letter grid** has inconsistent button sizes — single-character buttons like "a" and multi-character buttons like "ɛ" are the same width, which is fine, but the grid doesn't fill the row evenly (the last row has a single orphaned "y" button).
- **Example sentences on word detail** show French translations when the app is in English mode — this is a known data bug but for the critique: it breaks the expectation set by the English language toggle.

---

## Questions to Consider

- **"What would this look like if it were designed by a Kabiyè person for Kabiyè people?"** — Right now it looks designed by a developer who happens to know React Native. The cultural layer is entirely absent from the visual design. What colors, patterns, and imagery would make this feel like home?
- **"Does the Home screen need to exist?"** — The Learn tab is the actual entry point for learning. The Home screen is a wayfinding page that mostly duplicates the Learn tab's content. What if opening the app dropped you straight into your progress/next lesson?
- **"What would make someone show this app to a friend?"** — Right now the answer is "it helps you learn Kabiyè." A design that felt culturally distinctive would add "...and it's beautiful" to that recommendation.
- **"What would a confident version of the dictionary look like?"** — The dictionary has real linguistic data (pronunciation, definitions, examples). What if the word detail page treated that data with the reverence of a beautifully typeset dictionary? Think of how physical dictionaries use typography to encode meaning — bold for headwords, italic for pronunciation, small caps for parts of speech.

---

*Health score: 6/10 — Functionally sound, architecturally reasonable, but visually generic and culturally disconnected. The app does what it needs to do, but it doesn't make you feel anything.* 

Completed: *Write design critique report* (9/9)

