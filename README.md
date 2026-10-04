# Kabiyè en poche

Learn to read and write Kabiyè (Togo): a mobile app with lessons and a dictionary, its
admin panel and its website.

| Workspace | What it is |
|---|---|
| `mobile/` | Expo app (Expo Router, Uniwind, Lingui, Supabase); iOS on TestFlight |
| `admin/` | React-admin panel for lessons, alphabet and audio (Vite; deployed with `cf`) |
| `website/` | The site (React + Vite; deployed with `wrangler`) |
| `supabase/` | The `upload-audio` edge function |

The dictionary data and the lessons come from the content pipeline in the sibling
repository `kbp-dict-crawler`, which also holds the captured database schema.

## Development

A pnpm workspace (`packageManager` in `package.json`), Node 22.19 or later.

```bash
pnpm install
pnpm --filter mobile ios             # or android, start
pnpm --filter mobile test            # jest
pnpm --filter mobile check-types
pnpm --filter admin dev              # setup in admin/README.md
pnpm --filter website dev
```

The app reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`, locally from
`mobile/.env.local` (gitignored).

Commit hooks: commitlint checks the message format, and lint-staged runs ESLint (with
`--fix`) and the type check on staged files.

Interface strings are Lingui catalogs in `mobile/src/locales/`; `pnpm --filter mobile
i18n:extract` refreshes them.

Conventions for code and for lesson content are in `AGENTS.md` and `.cursorrules`.
