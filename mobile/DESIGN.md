---
name: Kabiyè en Poche
description: A pocket primer for reading, writing and learning Kabiyè.
colors:
  primary: "#6200EE"
  primary-dark-theme: "#BB86FC"
  primary-tint: "#EDE4F7"
  secondary: "#8B5CF6"
  paper: "#F5F3F7"
  leaf: "#ffffff"
  recessed: "#EDE9F0"
  ink: "#1E1B2E"
  ink-quiet: "#6E6B7B"
  rule: "#E0DCE6"
  night-paper: "#1A1A2E"
  night-leaf: "#252538"
  night-recessed: "#2F2F45"
  night-ink: "#E8E4F0"
  night-ink-quiet: "#9B97A8"
  night-rule: "#3D3B50"
  correct-bg: "#dcfce7"
  correct-ink: "#15803d"
  wrong-bg: "#fee2e2"
  wrong-ink: "#b91c1c"
  hint: "#d97706"
  danger: "#BF3626"
typography:
  display:
    fontFamily: "Figtree_700Bold, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Figtree_600SemiBold, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
  title:
    fontFamily: "Figtree_500Medium, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
  body:
    fontFamily: "Figtree_400Regular, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  label:
    fontFamily: "Figtree_400Regular, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  kabiye:
    fontFamily: "Andika_400Regular, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  kabiye-strong:
    fontFamily: "Andika_700Bold, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  card-filled:
    backgroundColor: "{colors.recessed}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "{colors.recessed}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "10px"
  chip-difficulty:
    backgroundColor: "{colors.correct-bg}"
    textColor: "{colors.correct-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  language-tag:
    backgroundColor: "{colors.recessed}"
    textColor: "{colors.ink-quiet}"
    rounded: "4px"
    padding: "2px 6px"
---

# Design System: Kabiyè en Poche

## Overview

**Creative North Star: "The Pocket Primer"**

A well-made teaching book that happens to be a phone. The page is calm and the word is
the hero: a soft lavender-grey ground, white leaves laid on it, and one confident purple
reserved for the places where the reader acts. Nothing decorative competes with the
language itself, because for a large part of this audience the letterforms *are* the
lesson — they are learning to read `ɖ`, `ɛ`, `ɣ`, `ɩ`, `ɔ` and `ʋ` for the first time.

The system is deliberately quiet. It has one accent, no gradients, no shadows, and no
illustration. Its only real ornament is the type: the interface speaks one voice and the
Kabiyè language speaks another, and that distinction does more identity work than any
decoration could. Density is generous rather than efficient — this is a primer to sit
with, not a dashboard to scan.

Dark mode is a genuine second theme, not an inversion. The ground deepens to a blue-black
and the accent lifts to a lighter violet so it keeps its authority against it.

**Key Characteristics:**
- One accent, used only where the reader acts
- Two typefaces with one job each: interface and language
- Flat by tone — no shadows anywhere in the system
- Generous vertical rhythm; the Kabiyè word is always the largest thing in its block
- Fully paired light and dark palettes, both first-class

## Colors

A cool, low-chroma lavender family with a single saturated violet doing all the work of
signalling action, plus a conventional green/red pair reserved strictly for answer feedback.

### Primary
- **Electric Violet** (`#6200EE`): Actions and the language itself. Primary buttons,
  active tab, links, progress fill, and — distinctively — Kabiyè headwords in the
  dictionary and lesson examples. This is the one colour that says "this matters".
- **Lifted Violet** (`#BB86FC`): The dark-theme substitute for Electric Violet. Same
  role, raised in lightness so it holds against a near-black ground.
- **Violet Wash** (`#EDE4F7`): A pale tint of the accent for selected and grouped states.

### Secondary
- **Soft Violet** (`#8B5CF6`): A quieter companion accent, used sparingly for secondary
  emphasis. Not a second brand colour; it exists so the primary never has to be diluted.

### Neutral
- **Paper** (`#F5F3F7`): The app ground in light theme. Slightly lavender, never white —
  white is reserved for the cards laid on it.
- **Leaf** (`#ffffff`): Card and sheet surfaces. The contrast between Leaf and Paper *is*
  the elevation system.
- **Recessed** (`#EDE9F0`): Inputs, filled cards, and anything that should read as set
  into the page rather than laid on it.
- **Ink** (`#1E1B2E`): Body and heading text. A near-black carrying a trace of the violet.
- **Quiet Ink** (`#6E6B7B`): Secondary text, pronunciations, captions, placeholders.
  Measured at 4.5:1 on Leaf; its dark-theme partner `#9B97A8` measures 5.27:1 on Night Leaf.
- **Rule** (`#E0DCE6`): Hairline borders, dividers, and the unfilled progress track.

Night-theme partners (`night-paper`, `night-leaf`, `night-recessed`, `night-ink`,
`night-ink-quiet`, `night-rule`) mirror these roles exactly.

### Tertiary
- **Correct** (`#dcfce7` / `#15803d`) and **Wrong** (`#fee2e2` / `#b91c1c`): Answer
  feedback only. **Hint** (`#d97706`): amber, for hints in exercises. **Danger**
  (`#BF3626`): destructive actions such as resetting progress.

### Named Rules

**The One Accent Rule.** There is exactly one accent, and it means "act here" or "this is
Kabiyè". If a new colour seems necessary, the answer is a tonal step, not a new hue.

**The Feedback-Only Rule.** Green and red never appear outside answer feedback. They are
not status colours, not decoration, and not a palette to draw from.

## Typography

**Interface Font:** Figtree (with system-ui, sans-serif)
**Language Font:** Andika (with system-ui, sans-serif)

**Character:** Figtree is a warm geometric sans — round, even, unfussy — and carries every
word of interface copy in English and French. Andika is SIL's typeface for
African-language literacy, and carries every word of Kabiyè. The pairing is close enough
to sit on one line without friction (Andika's x-height is 0.508em against Figtree's
0.500em) and different enough that the reader can feel which language they are looking at.

This is the system's defining decision, and it is not stylistic. Figtree draws only 4 of
the 16 letters the Kabiyè alphabet needs; before Andika, every Kabiyè word was rendered
half in Figtree and half in an OS fallback, splitting single graphemes like `aɣ` across
two typefaces.

### Hierarchy
- **Display** (Figtree Bold 700, 36px, 1.1): Screen titles — "Learn Kabiyè", "Profile".
- **Headline** (Figtree SemiBold 600, 24px): Section headings and lesson titles.
- **Title** (Figtree Medium 500, 20px): Card headings, activity questions.
- **Body** (Figtree Regular 400, 16px): Lesson prose, definitions, all running copy.
- **Label** (Figtree Regular 400, 14px): Captions, pronunciations, difficulty chips,
  secondary metadata.
- **Kabiyè** (Andika Regular 400 / Bold 700): Every Kabiyè word at whatever size its
  context calls for. Andika ships two weights only; the interface's eight collapse onto
  them, with semibold and above reading as bold.

### Named Rules

**The Two Voices Rule.** Figtree is the interface. Andika is the language. No text is
ever set in a face that cannot draw its own letters.

**The Declared Kabiyè Rule.** Text picks its face from its content automatically, but any
field the data model *guarantees* is Kabiyè must say so explicitly (`<Text kabiye>`).
Detection alone leaves words built only from shared letters — `caa`, `afa`, `pili` — in the
interface face, sitting visibly wrong beside their neighbours.

## Layout

A single-column, card-on-ground model throughout. Screens are vertical scrolls of stacked
cards over the Paper ground; there is no multi-column layout at phone width and no
sidebar.

Horizontal page padding is 16–24px (`px-4` to `px-6`); cards carry 16px of internal
padding (24px for lesson content). Vertical rhythm runs on a 4px base: 8px between tightly
related items (a headword and its pronunciation), 16px between blocks, 24–32px between
sections. Related content groups tightly and distinct groups separate generously.

Lesson screens are a fixed frame: a progress bar pinned to the top, a scrolling body, and
a primary action pinned to the bottom. That action is always present and always in the
same place, so a learner never hunts for "Continue".

## Elevation & Depth

**There are no shadows in this system.** Depth is entirely tonal: Recessed sits into the
page, Paper is the page, Leaf sits on it. Three steps, and that is the whole vocabulary.

This was originally accidental — `shadow-card` and `shadow-card-lg` were referenced by the
Card component but defined nowhere, so both did nothing — and has been made deliberate.
The dead classes are gone and `elevated` now expresses itself as a stronger tonal step
with a hairline border.

### Named Rules

**The Flat Rule.** No `box-shadow` anywhere. If a surface needs to feel raised, move it a
tonal step, not a shadow. A drop shadow introduced here would be the only one in the app
and would read as a mistake.

## Shapes

Soft, consistently rounded, never sharp and never fully circular except where a shape is
genuinely a pill or a dot. Cards use 16px (`rounded-xl`); buttons and option rows 12px
(`rounded-lg`); small controls 8px (`rounded-md`). Chips, badges, the language tag and the
audio button are pills or circles (`rounded-full`).

Borders are hairlines in Rule, used to define an edge rather than to decorate. Selected
and answered states raise the border to 2px in the accent or a feedback colour — the
border, not a shadow, is how this system shows state.

## Components

### Buttons
- **Shape:** Gently rounded (12px), full-width in lesson and form contexts.
- **Primary:** Electric Violet ground, white label, 12px × 16px padding. The only filled
  button in the system.
- **Outline / Ghost:** Transparent ground with an accent label; outline adds a 2px accent
  border. For secondary and tertiary actions.
- **States:** Disabled drops to 50% opacity; loading swaps the label for a translated
  "Loading…" and reports `busy` to assistive technology. Every button carries
  `accessibilityRole="button"` by default — this is set once on the shared component, and
  new buttons should not need to think about it.
- **Gating:** A primary action that is not yet available renders at reduced opacity rather
  than disappearing, so the path forward stays visible.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** Leaf by default; Recessed for the `filled` variant; a hairline Rule
  border for `outlined`.
- **Shadow Strategy:** None. See Elevation & Depth.
- **Internal Padding:** 16px, or 24px for lesson content where the copy is long.

### Inputs / Fields
- **Style:** Recessed ground, hairline border, 16px radius, 10px padding.
- **Placeholder:** Quiet Ink, resolved per theme — never a hardcoded hex, since the light
  value fails contrast on the dark ground.
- **Search:** Autocorrect, autocapitalise and spellcheck are all off. iOS autocorrect
  mangles Kabiyè into French words.

### Navigation
- Five-item bottom tab bar (Home, Learn, Dictionary, Keyboard, Profile), icon over label,
  accent for the active item and Quiet Ink for the rest, with a short accent rule above
  the active tab. Detail screens push over it with a transparent header and a minimal
  back chevron.

### Exercise Options
- Full-width rows, Leaf ground, hairline border, 12px radius, with a radio dot at the
  leading edge. Selection raises the border to 2px accent; answering swaps ground and
  border to Correct or Wrong. The row is the target, not the dot.

### The Language Tag
- A small Recessed pill carrying an uppercase two-letter language code in Quiet Ink at
  label size, sitting to the trailing side of a gloss. It marks a definition shown in a
  language the reader did not choose — roughly a quarter of entries have only French.
  Deliberately quiet: it is a footnote about the text, not part of it.

### The Kabiyè Keyboard
- A full custom keyboard of the Kabiyè alphabet, keys on Leaf with the language-specific
  letters tinted in Violet Wash so the letters that do not exist in French stand out.
  Keys are set in Andika, as is the text they produce.

## Do's and Don'ts

### Do:
- **Do** set every Kabiyè string in Andika, and add `kabiye` to the `Text` explicitly
  wherever the field is known to be Kabiyè.
- **Do** separate surfaces with the tonal steps (Recessed → Paper → Leaf).
- **Do** reserve Electric Violet for actions and for the Kabiyè language.
- **Do** define both theme values for any new colour, and check text at 4.5:1 in each.
- **Do** show nothing where content does not exist. An absent speaker icon is correct;
  a speaker icon that plays the wrong sound is a defect.
- **Do** keep the primary action pinned in the same place on every lesson step.

### Don't:
- **Don't** add a `box-shadow`. There are none, and one would be conspicuous.
- **Don't** introduce a second accent hue. Reach for a tonal step instead.
- **Don't** use green or red for anything except answer feedback.
- **Don't** hardcode a colour that differs between themes — take it from the theme hook.
- **Don't** let Figtree render Kabiyè. It cannot draw `ɖ Ɖ ɛ Ɛ ɣ Ɣ ɩ Ɩ ɔ Ɔ ʋ Ʋ`, and the
  OS fallback splits words across two typefaces.
- **Don't** enable autocorrect on any field that accepts Kabiyè.
