# Kabiyè en Poche Admin Panel

Web admin panel for managing Kabiyè en Poche content. Built with React Admin, Supabase, and Vite.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase credentials (same as the main app):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Grant admin access in Supabase (requires [supabase-custom-claims](https://github.com/supabase-community/supabase-custom-claims) installed):
   - **Option A**: Run in SQL Editor: `select set_claim('YOUR_USER_UUID', 'user_role', '"ADMIN"');`
   - **Option B**: Supabase Dashboard → Authentication → Users → Edit user → **Raw User Meta** / app_metadata: add `{"user_role": "ADMIN"}`

## Development

```bash
npm run dev
```

Runs at http://localhost:3001

## Build

```bash
npm run build
```

## Resources

- **Units** – Learning units and modules
- **Lessons** – Primary entry point: edit lesson metadata, contents, and activities **in one place** (tabbed form)
- **Lesson Contents** / **Lesson Activities** – Standalone resources (accessible via Lesson edit tabs, or directly at `/lesson_contents`, `/lesson_activities`)
- **Alphabet** – Kabiyè alphabet letters and pronunciations
- **CMS Pages** – Static content (terms, privacy, etc.)
- **Categories** – Lesson categories (hierarchical)
- **Topics** – Lesson topics

### Rich editing

- **Markdown** – Content (EN/FR) uses live markdown editor with preview
- **Audio** – Examples and activities support `audio_url` (Supabase Storage or external URL)
- **Activity data** – JSON editor for flexible activity structures; the shapes the app reads are in `../mobile/src/types/activity-data.ts`

## RLS / Permissions

The live project already has what the panel needs:

- RLS enabled on every table
- A public read policy on each content table the app reads (units, lessons, lesson contents and activities, alphabet, CMS pages, categories, topics), for anon and signed-in users alike
- **`<table>_admin_select` / `_insert` / `_update` / `_delete`** policies on those tables and on `audios`, true when the user's `user_role` claim is `"ADMIN"` (read with `get_my_claim`)

They were created in the dashboard. No migration file for them exists in this repo or the pipeline repo (the `20240225000001_admin_rls_policies.sql` this page used to cite never existed); the live project is the reference.

Admin access uses the `user_role` claim via [supabase-custom-claims](https://github.com/supabase-community/supabase-custom-claims). Set `app_metadata.user_role = 'ADMIN'` in the Supabase Auth user (step 3 above) or via the custom claims `set_claim()` function.
