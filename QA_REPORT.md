# QA Report — Kabiyè en poche (Android)

**Date**: 2025-04-05
**Device**: Pixel 9a (emulator-5554, Android)
**App version**: 0.0.1
**Package**: com.kabiyeenpoche.app
**Tester**: Maestro MCP + manual inspection

---

## Health Score: 8/10

The app is well-built with rich content and solid navigation. A few data/UI bugs were found, mostly cosmetic or low severity.

---

## Summary by Tab

### Home Tab — PASS
- Welcome banner loads correctly
- "Continue Learning" card shows current lesson (Vowel Harmony and Length)
- Course cards display with correct titles and descriptions
- "View All" button navigates to Learn tab
- Kabiyè Alphabet link navigates to color-coded letter grid
- Lesson navigation works (lesson 1/18, Continue advances to 2/18, back button works)

### Learn Tab — PASS
- Foundations I expanded: shows 3 lessons with correct status indicators
  - Alphabet and Sounds: Completed (checkmark)
  - Vowel Harmony and Length: In-progress (circle, "Tap to start")
  - Tones and Meaning: Locked (lock icon, "Complete previous lesson to unlock")
- Coming Soon courses greyed out and non-tappable (correct behavior)
- Lesson detail page loads with rich content: explanations, examples with audio speaker icons, Continue button, progress bar

### Dictionary Tab — PASS (with bugs)
- Kabiyè/English mode toggle works
- Search field accepts input
- Word of the Day shows 3 entries with translations
- Browse by Letter grid renders all Kabiyè letters (a, c, ɖ, e, ɛ, f, h, k, l, m, n, ñ, ŋ, p, s, t, w, y)
- Letter detail page shows word list (50+ entries for "k")
- Word detail page renders headword, pronunciation, part of speech, definitions, and example sentences
- Search Results page shows proper empty state ("No results found")
- PDF button visible in header

### Keyboard Tab — PASS
- Custom Kabiyè keyboard loads with special characters (ɖ, ɛ, ɣ, ɩ, ñ, ŋ, ɔ, ʋ)
- Punctuation row, shift key, space, backspace, enter present
- Typing works: text appears correctly in the text area
- Clear button resets text area
- Copy button present

### Profile Tab — PASS
- Progress Overview: Units 0/1, Lessons 1/3, Overall Progress 33% with progress bar
- Learning Resources: 5 external links (Académie Kabiyè, Essékuliye, Tanaou, Workbook, Lexilogos)
- Support: Join community, Terms, Privacy Policy
- Settings: App Language (English), Reset Progress (red destructive style)

---

## Bugs Found

### BUG-1: Dictionary search dropdown shows duplicated headword [Medium]
**Location**: Dictionary tab → English mode → type in search field
**Steps to reproduce**:
1. Go to Dictionary tab
2. Switch to English mode
3. Type "taa" in search field
**Expected**: Quick search results show Kabiyè headword + matching English text
**Actual**: Results show headword as both title and subtitle (e.g., "haŋaɣ / haŋaɣ")
**Root cause**: `match_text` field is null in search results, code falls back to `result.headword`
**File**: `src/screens/dictionary/dictionary.tsx` line ~125: `{result.match_text ?? result.headword}`

### BUG-2: Example sentences show French even in English mode [Low]
**Location**: Word detail page (e.g., "ka ka₁")
**Steps to reproduce**:
1. Navigate to any word with example sentences
2. App language is English
**Expected**: Example translations shown in English
**Actual**: Example translations are in French (e.g., "Le père de Kpatcha a souffert longtemps...")
**Note**: Definitions correctly display in English. Only examples are affected. May be a data gap (English translations not available for examples).

### BUG-3: Coming Soon cards show navigation chevron [Cosmetic]
**Location**: Learn tab → Coming Soon courses
**Description**: Greyed-out "Coming Soon" course cards display a right chevron (›) that implies they are tappable/navigable, but tapping them does nothing.
**Suggestion**: Remove the chevron from Coming Soon cards, or dim it further to indicate non-interactivity.

### BUG-4: Sparse word detail pages [Low/Data]
**Location**: Word detail page (e.g., "hɛyɛ sɔɔkʋ")
**Description**: Some words show only a single definition with no pronunciation, examples, or additional context, resulting in a large empty white space. Compare "ka ka₁" (4 definitions + 3 examples) vs "hɛyɛ sɔɔkʋ" (1 definition only).
**Note**: Likely a data completeness issue, not a code bug.

---

## Observations (Not Bugs)

- **Inline search not triggered by Maestro input_text**: Maestro's text injection bypasses React Native's `onChangeText`, so the real-time search dropdown doesn't appear via automation. Not an app bug — the `onSubmitEditing` navigation works correctly.
- **Search text persists after back navigation**: The search query "taa" remains in the field after navigating to Search Results page and returning. This is standard React state behavior.
- **Tab bar hidden on detail pages**: Word detail and lesson pages hide the tab bar. This is correct UX.
- **Lesson content quality**: The Vowel Harmony lesson has excellent, detailed linguistic content with proper Kabiyè typography and phonetic notation.

---

## Test Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Home tab layout | ✅ | Banner, cards, alphabet link |
| Home → Lesson navigation | ✅ | Opens lesson, progress bar, Continue works |
| Home → Alphabet page | ✅ | Color-coded letter grid |
| Learn tab courses | ✅ | Expanded list, status indicators |
| Learn → Locked lesson | ✅ | Lock icon, explanatory text |
| Learn → Coming Soon | ✅ | Non-tappable (BUG-3: has chevron) |
| Dictionary → Kabiyè search | ✅ | Field works, submit navigates |
| Dictionary → English search | ⚠️ | Results found, but BUG-1 duplicated subtitle |
| Dictionary → Browse by Letter | ✅ | 19 letters, word list loads |
| Dictionary → Word detail | ⚠️ | Works, but BUG-2 French examples, BUG-4 sparse |
| Dictionary → Search empty state | ✅ | "No results found" shown properly |
| Keyboard → Custom keys | ✅ | Special characters work |
| Keyboard → Clear | ✅ | Resets text area |
| Profile → Progress | ✅ | Correct stats and progress bar |
| Profile → Resources | ✅ | 5 links with descriptions |
| Profile → Settings | ✅ | Language, Reset Progress |
| Tab navigation | ✅ | All 5 tabs accessible |
| Back navigation | ✅ | Works from all detail pages |
