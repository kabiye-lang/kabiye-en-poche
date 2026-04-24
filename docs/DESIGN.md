# Design System — Kabiyè en Poche

## Color Palette

All colors are defined as CSS custom properties in `src/global.css` and consumed via Tailwind utility classes.

### Brand Colors

| Name            | Light          | Dark           | Usage                        |
| --------------- | -------------- | -------------- | ---------------------------- |
| Primary         | `#1B6B3C`      | `#4CAF74`      | CTAs, active tabs, links     |
| Secondary       | `#C8922A`      | `#C8922A`      | Gold accents, WotD, badges   |
| Secondary Text  | `#8B6914`       | `#C8922A`      | Text on gold backgrounds     |
| Accent          | `#BF3626`      | `#E05A4A`      | Destructive, alerts, errors  |
| Background      | `#FBF7F0`      | `#1A1714`      | Page backgrounds             |
| Card            | `#FFFFFF`      | `#2A2520`      | Card / surface backgrounds   |
| Foreground      | `#2C2417`      | `#F5F0E8`      | Primary text                 |
| Foreground Sec. | `#6B5E4F`      | `#A89880`      | Secondary / muted text       |
| Border          | `#D4C9B8`      | `#3A342E`      | Dividers, outlines           |

### Rationale

The **"Kara Green" (#1B6B3C)** evokes the lush Kara region of northern Togo where Kabiyè originates. **"Saha Gold" (#C8922A)** references traditional West African gold, used for ceramics and celebration. **"Laterite Red" (#BF3626)** draws from the signature red soil of the region. The warm neutral palette (`#FBF7F0` background, `#2C2417` text) avoids cool grays, giving the app a natural, earthy warmth.

## Typography

| Token    | Font Family          | Weight Range | Usage              |
| -------- | -------------------- | ------------ | ------------------ |
| UI       | Figtree              | 300–900      | Buttons, labels, nav |
| Content  | IBM Plex Sans Hebrew | 100–700      | Body text, dictionary entries |

### Scale

Defined via Tailwind `text-*` utilities — `caption`, `body`, `lg`, `h6`, `h5`, `h4`, `h3`, `h2`.

## Spacing

Standard Tailwind spacing scale (4px base). Key tokens used:

- `p-4` / `px-4` — standard section padding
- `mb-5` — section vertical spacing
- `gap-2` / `gap-3` — flex gap between items
- `rounded-2xl` — primary card radius
- `rounded-xl` — grouped list radius
- `rounded-full` — pills, buttons, dots

## Icon System

**Phosphor Icons** (React Native, v3.0.4)

- **Active state**: `weight="fill"`
- **Inactive state**: `weight="regular"` (not `light` — ensures visibility)
- **Decorative/duotone**: `weight="duotone"` for sparkle-type icons
- Sizes: `16` (small inline), `18-20` (standard), `24` (large interactive)

## Component Patterns

### Cards → Grouped Lists

Prefer grouped list rows inside a single `bg-card rounded-xl` container with `border-b border-border` dividers over individual `<Card>` components. This reduces visual monotony.

### Coming Soon / Unavailable States

Use `border border-dashed border-border` + `bg-card/60` instead of `opacity-50` for unavailable items. Include a `bg-secondary/15 rounded-full px-3 py-1` badge for the status label.

### Word of the Day

Gold editorial treatment: `bg-gold-light rounded-2xl p-4` with `text-secondary-text` headword. Skeleton loading uses `bg-secondary/20` shimmer bars.

### Hero Sections

Gradient with hex values directly (not `brandColors`). New user: `['#1B6B3C', '#C8922A']`. Returning user: `['#1B6B3C', '#2A8B55']`.

## Animation Tokens

| Token      | Duration | Easing        | Usage                     |
| ---------- | -------- | ------------- | ------------------------- |
| Fast       | 150ms    | ease-out      | Micro-interactions, press |
| Standard   | 300ms    | ease-in-out   | Transitions, fade-up      |
| Spring     | 200ms    | spring(1,80,10)| Onboarding swipe, bouncy  |

## Dark Mode

Warm brown tones instead of cool grays:
- Background: `#1A1714` (warm dark)
- Card: `#2A2520` (elevated warm dark)
- Tertiary: `#3A342E` (borders, dividers)
- Text adapts to lighter warm tones: `#F5F0E8` (primary), `#A89880` (secondary)

## Keyboard

- Collapsible instruction hint (auto-hides after 3 uses via AsyncStorage)
- TextInput directly above keyboard with `min-h-20 rounded-xl border-border`
- Inline Clear/Copy toolbar between input and keys

## Onboarding

- 3 paginated screens with horizontal `FlatList`
- Gradient backgrounds per page
- Swipe + Next button + Skip link
- `gestureEnabled: false` on Stack to prevent back navigation
- Completion stored in `@kabiye_onboarding_complete` AsyncStorage key
