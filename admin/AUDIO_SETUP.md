# Audio Recording & Management Setup

## Overview

The admin panel supports:

- **Record audio** in the browser (MediaRecorder)
- **Trim silence** at start/end (Web Audio API → WAV)
- **Upload** to Supabase Storage via Edge Function
- **Search & select** existing audios when entering `audio_url`
- **Manage audios** (list, edit tags) in the Audios section

## Setup Steps

### 1. Run Migrations

```bash
npx supabase db push
```

Or apply `supabase/migrations/20240225000003_audios.sql` manually.

### 2. Create Storage Bucket

In Supabase Dashboard → Storage:

- Create bucket: **audios**
- Set as **Public** (app needs to play audio files)

The migration adds RLS policies for `storage.objects`; if they fail, configure manually:

- **Admin upload**: authenticated users with `user_role = 'ADMIN'`
- **Public read**: all users can read from `audios` bucket

### 3. Deploy Edge Function

```bash
npx supabase functions deploy upload-audio
```

- **upload-audio**: `multipart/form-data` with `audio` (file), `name`, `description`, `tags` (comma-separated).  
  Auth uses the new JWT Signing Keys via `auth.getClaims()` (see `supabase/config.toml`: `verify_jwt = false` so the function can verify manually).  
  Storage deletion on row delete is handled by a DB trigger (see step 4) using the Storage REST API—no edge function needed.

### 4. Trigger: Delete Storage on Row Delete (Optional)

Migrations `20240225000004` and `20240225000005` add a trigger that deletes the storage file when an audios row is deleted (covers direct SQL/cascades; admin UI deletes from storage before DB). Uses `extensions.http` to call the Storage API directly—no edge function required.

**One-time setup** – add secrets to Supabase Vault (Dashboard → Project Settings → Vault, or SQL Editor):

```sql
SELECT vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'Supabase Url',
  'Base project URL (no trailing slash)'
);
SELECT vault.create_secret(
  'your-service-role-key',
  'Service Role Key',
  'Service role key for Storage API auth'
);
```

Get both from Dashboard → Project Settings → API.

### 5. Use in Admin

- **Lesson contents** (examples), **lesson activities** (audio, listen_choose, listen_type): use the "Pick" or "Pick audio" button next to the URL field.
- **Audios** (nav): browse, search, edit tags.

## Flow

1. **Record**: Click "Record" tab → Start → Stop → (optional) Trim silence → Name → Upload & select.
2. **Search**: Click "Search" tab → filter by name → play → Select.
3. URL is inserted into the field; data is stored in `audios` table and `audios` storage bucket.
