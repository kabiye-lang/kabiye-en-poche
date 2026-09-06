# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Both stores, but **one shared visual language rather than per-OS divergence** — confirmed
by the user. Read the iOS and Android references for platform mechanics (navigation,
touch targets, system behaviour, store requirements), not as licence to split the look.
iOS is the live channel today via TestFlight.

## Users

Three groups, confirmed as a genuine mix rather than one primary with secondaries. The
product has to serve all three at once, and they want different things from the same
screen:

- **Togolese diaspora reclaiming a heritage language.** Grew up hearing Kabiyè, never
  read or wrote it. Francophone-first. Learning privately, in short sessions, motivated
  by identity rather than obligation.
- **Non-Kabiyè speakers in Togo.** Togolese from other language groups, plus NGO,
  health, education and administrative workers posted to the Kara region. They need
  practical, spoken, useful Kabiyè.
- **Kabiyè speakers learning to write it.** Already fluent in speech; the gap is the
  orthography — `ɖ ɛ ɣ ɩ ŋ ɔ ʋ ñ` and the fact that tone is not written. This is a
  literacy job, not language acquisition, and it means the dictionary and alphabet
  surfaces are not merely reference material for them; they are the product.

The interface ships in English and French. French is the working second language of the
whole audience; English serves the diaspora and the wider reach.

## Product Purpose

Teach and document Kabiyè, a Gur language of northern Togo and one of the country's two
national languages, in a form that fits in a pocket.

It does two things at once: a structured lesson path (units → lessons → content and
activities, with progress and unlocking), and a searchable dictionary with an alphabet
reference and a Kabiyè keyboard. Success is a learner who can read, write and understand
Kabiyè words they meet in life — and, for the fluent, who can finally spell them.

## Positioning

The dictionary is the thing no neighbouring product can copy. It is not a wordlist: it
is a 942-page printed Kabiyè–French dictionary that had never been machine-readable,
recovered by decoding two legacy SIL font encodings rather than by OCR, then merged with
a Webonary crawl. That yields **9,738 entries, 21,185 searchable headwords and a 32,525-row
reversal index**, with provenance recorded per fact.

A general language app can generate lessons. It cannot produce this lexicon.

## Operating Context

- Learning happens in short, private sessions on a phone, not at a desk.
- Kabiyè's letters are not on any standard phone keyboard, which is why the app ships its
  own — writing the language at all requires it.
- Kabiyè orthography **does not write tone**. Tone is phonemic and distinguishes meaning,
  so any teaching material that implies tone is spelled is wrong.
- Lesson content is generated against the sources and then validated for grounding; it is
  not free-form authored.

## Capabilities and Constraints

Shipping today: lesson path with eight activity types (content, audio, listen-and-choose,
listen-and-type, match-pairs, fill-blank, multiple-choice, true/false, order-words);
dictionary search across Kabiyè, French and English with browse-by-letter; word detail with
senses, pronunciations, variants and cross-references; alphabet reference; Kabiyè keyboard;
progress tracking.

- **Content coverage is the live constraint**: 78 lessons are planned, 7 currently have
  content (103 activities). The dictionary is complete; the curriculum is not.
- **No audio recordings exist.** This is the largest known gap. Until recordings are hosted,
  audio affordances stay hidden rather than filled with stand-ins — see Product Principles.
  TTS was evaluated and rejected: it cannot produce correct tone on isolated words.
- Roughly a quarter of entries carry a French gloss but no English one. The UI shows the
  French and marks it, rather than hiding the entry.
- Backend is Supabase. The app is Expo (SDK 57 / React Native 0.86), expo-router, Uniwind,
  Lingui for EN/FR, TanStack Query.
- **Undecided, do not invent:** dialect coverage (Kara vs Boufalé — 786 dialect-marked
  entries bear on this), who records the audio, and the rights position on five corpus PDFs.

## Brand Commitments

- Name: **Kabiyè en Poche**. Existing wordmark asset in the app.
- Bilingual EN/FR interface is a commitment, not a convenience.
- The language's own letters are non-negotiable: any typeface used for Kabiyè must draw
  `ɖ Ɖ ɛ Ɛ ɣ Ɣ ɩ Ɩ ŋ Ŋ ɔ Ɔ ʋ Ʋ ñ Ñ` itself, never by system fallback.

## Evidence on Hand

Real, in the repository or the database:

- The decoded print dictionary and its grammar section (pp. 503–550), plus a French index.
- A Webonary crawl, merged with per-fact provenance.
- A corpus of 20 PDFs, licence-classified; five remain unusable pending a rights decision.
- 9,738 loaded lexemes; 78 lesson plans; 7 lessons with authored content.
- A recording script for ~2,000 Tier-1 audio items, built and ready for a speaker.

Explicitly absent — future work must not fabricate these: **any audio recording**, user
testimonials, install or usage numbers, and any institutional endorsement. The user did
not claim a relationship with Académie Kabiyè or SIL; do not imply one.

## Product Principles

1. **Never invent Kabiyè.** Every word, example and sentence traces to a source. A
   plausible-looking generated form is a defect, not content — this is a language people
   will learn wrongly if we get it wrong.
2. **Absence beats a stand-in.** Where content does not exist, show nothing rather than a
   placeholder. Placeholder audio taught 251 examples the wrong sound; the lesson
   generalises.
3. **Serve the fluent and the beginner from the same screen.** A speaker learning to spell
   and a diaspora learner meeting the word for the first time both arrive at the dictionary
   entry.
4. **Free and non-commercial.** No paywall, subscription, or advertising. Do not design
   monetisation surfaces.
5. **The orthography is the curriculum.** Rendering, keyboard and alphabet are not chrome
   around the lessons; for one of the three audiences they are the whole product.

## Accessibility & Inclusion

The audience includes people on modest hardware and intermittent connections in Togo; the
user did not make offline support a requirement, so do not assume it, but do not design as
if bandwidth were free either.

Controls carry real accessibility roles and labels (established 2026-09-06); keep that bar.
Placeholder and secondary text meets WCAG AA 4.5:1 in both themes.
