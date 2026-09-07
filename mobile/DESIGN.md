---
name: Kabiyè en Poche
description: A pocket primer for reading, writing and learning Kabiyè.
colors:
  # Laterite: red earth of Kara, bone paper, ink. Three colours and no more; depth is
  # tonal (recessed -> paper -> leaf) or a border, never a shadow.
  paper: "#F4EBDD"
  paper-recessed: "#EADFCD"
  leaf: "#FFFFFF"
  line: "#D9CDB9"
  ink: "#221913"
  ink-quiet: "#6B5A4E"
  # Passes 4.5:1 on paper only at >= 24px, or bold >= 19px. Hero glyphs, section labels,
  # and the one primary action per screen. Never body text.
  laterite: "#C4451C"
  night-paper: "#221913"
  night-recessed: "#2E241C"
  night-tabbar: "#160F0B"
  night-ink: "#F4EBDD"
  night-ink-quiet: "rgba(244,235,221,0.7)"
  night-line: "rgba(244,235,221,0.12)"
  night-laterite: "#E07A55"
  # There is no correct/wrong colour pair. Correct fills with ink; wrong is a laterite
  # strikethrough plus an explanation. A learner should not need to know a colour code
  # to read their own mistake.
typography:
  # Bricolage Grotesque is the interface face. It misses the same twelve Kabiyè letters
  # Figtree did (ɖ Ɖ ɛ Ɛ ɣ Ɣ ɩ Ɩ ɔ Ɔ ʋ Ʋ), so every Kabiyè word is routed to Andika --
  # see utils/kabiye-script.ts, pinned by __tests__/kabiye-font-coverage.test.ts.
  section-label:
    fontFamily: "BricolageGrotesque_600SemiBold, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "0.10em"
    textTransform: "uppercase"
    color: laterite
  screen-title:
    fontFamily: "BricolageGrotesque_600SemiBold, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  step-question:
    fontFamily: "BricolageGrotesque_500Medium, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 500
    lineHeight: 1.15
  card-title:
    fontFamily: "BricolageGrotesque_600SemiBold, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
  body:
    fontFamily: "BricolageGrotesque_400Regular, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  body-small:
    fontFamily: "BricolageGrotesque_400Regular, system-ui, sans-serif"
    fontSize: "15px"
    color: ink-quiet
  kabiye-hero:
    # Single letters only. A word never exceeds 44 and must be allowed to wrap.
    fontFamily: "Andika_700Bold, system-ui, sans-serif"
    fontSize: "150px"
    fontWeight: 700
    lineHeight: 0.85
  kabiye-word:
    fontFamily: "Andika_700Bold, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 1.05
  kabiye-list:
    fontFamily: "Andika_700Bold, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
  kabiye-sentence:
    fontFamily: "Andika_700Bold, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  key: "8px"
  card: "14px"
  card-lg: "20px"
  state: "18px"
  pill: "9999px"
borders:
  # No shadows anywhere.
  outlined: "1.5px solid ink"
  divider: "1px solid line"
  rule: "1.5px solid ink"
  entry-underline: "2px solid ink"
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

Three colours: the red earth of Kara, bone paper, and ink. Nothing else. Depth comes from
tone (recessed → paper → leaf) or from a border; there are no shadows anywhere in the app.

### The three
- **Paper** (`#F4EBDD`): the ground everything sits on. Bone rather than white, so the
  ink reads as printed rather than displayed.
- **Ink** (`#221913`): text, filled buttons, the tab bar, and every "done" fill. It is
  also the primary button colour — the accent is spent elsewhere.
- **Laterite** (`#C4451C`): the hero glyph, section labels, the one primary action per
  screen, and the letters French cannot write. It passes 4.5:1 on paper only at ≥ 24px
  or bold ≥ 19px, which is why body text is always ink and never laterite.

### What does not get a colour
Answer feedback. There is no green and no red: **correct fills with ink, wrong is a
laterite strikethrough with the correct answer beneath and an explanation.** A learner
should not have to know a colour code to read their own mistake, and a wrong answer in a
language this under-documented is more often the app's gap than the learner's.

Letter *type* also lost its colours. Four hues for grapheme/vowel/consonant/indication
was a legend to memorise, coding a distinction the label under each tile already makes.
The one accent goes to the distinction the app exists to teach: whether French can write
the letter at all.


## Typography

**Interface:** Bricolage Grotesque · **Kabiyè:** Andika

Bricolage Grotesque carries every word of interface copy in English and French. Andika is
SIL's typeface for African-language literacy and carries every word of Kabiyè.

This is the system's defining decision and it is not stylistic. **The interface face draws
only 4 of the 16 letters the Kabiyè alphabet needs.** Without the split, every Kabiyè word
is rendered half in the interface face and half in an OS fallback, splitting single
graphemes like `aɣ` across two typefaces — on the alphabet card whose entire job is to
show the learner what that letter looks like.

Bricolage misses precisely the twelve Figtree missed (ɖ Ɖ ɛ Ɛ ɣ Ɣ ɩ Ɩ ɔ Ɔ ʋ Ʋ) and draws
ŋ Ŋ ñ Ñ, so `utils/kabiye-script.ts` survived the typeface change unaltered. That is luck
rather than a property of grotesques, so `__tests__/kabiye-font-coverage.test.ts` reads
the shipped font binaries and fails if the next face moves the line.

### Hierarchy
- **Section label** (600, 13px, +0.10em, uppercase, laterite): names what a screen is
  about, above its title.
- **Screen title** (600, 40px, 1.0, −0.02em): "Your path", "9,738 entries", "Your Kabiyè".
- **Step question** (500, 26px, 1.15): what a lesson step is asking.
- **Card title** (600, 22px): unit titles, empty-state headings.
- **Body** (400, 17px, 1.5): lesson prose, definitions, all running copy.
- **Body small** (400, 15px, ink-quiet): captions, metadata, glosses.
- **Kabiyè hero** (Andika Bold, 150px, 0.85): a single letter, never a word.
- **Kabiyè word** (Andika Bold, 44px, 1.05): headwords and the word being taught. Words
  never exceed 44 and must be allowed to wrap.
- **Kabiyè list / sentence** (Andika Bold, 24px / 34px): rows, and sentences to read.

Andika ships two weights; the interface's wider scale collapses onto them, with semibold
and above reading as bold.

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
- **Don't** let the interface face render Kabiyè. It cannot draw `ɖ Ɖ ɛ Ɛ ɣ Ɣ ɩ Ɩ ɔ Ɔ ʋ Ʋ`, and the
  OS fallback splits words across two typefaces.
- **Don't** enable autocorrect on any field that accepts Kabiyè.
