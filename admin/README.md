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
- **Activity data** – JSON editor for flexible activity structures; see `src/types/activity-data.ts` for shapes

## RLS / Permissions

Apply the admin RLS migration from `../supabase/migrations/20240225000001_admin_rls_policies.sql`:

1. Open **Supabase Dashboard → SQL Editor**
2. Paste and run the migration file contents

This migration:

- Enables RLS on admin-managed tables
- Adds **public_read** policies so the app can read content (anon + authenticated)
- Adds **admin_all** policies so users with `user_role = 'ADMIN'` in app_metadata get full CRUD

Admin access uses the `user_role` claim via [supabase-custom-claims](https://github.com/supabase-community/supabase-custom-claims). Set `app_metadata.user_role = 'ADMIN'` in the Supabase Auth user (step 3 above) or via the custom claims `set_claim()` function.
