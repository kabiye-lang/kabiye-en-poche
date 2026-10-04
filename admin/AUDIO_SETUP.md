# Audio Recording & Management Setup

## Overview

The admin panel supports:

- **Record audio** in the browser (MediaRecorder)
- **Trim silence** at start/end (Web Audio API → WAV)
- **Upload** to Supabase Storage via Edge Function
- **Search & select** existing audios when entering `audio_url`
- **Manage audios** (list, edit tags) in the Audios section

## Setup Steps

### 1. Database

Already in place on the live project: the `audios` table, the public `audios` bucket, its
storage policies and the delete trigger (step 4). They were created in the dashboard and
have no migration file in this repo — the `20240225…` migrations this page used to cite
never existed — so there is nothing to push. The table is recorded in the pipeline
repository's schema capture, `kbp-dict-crawler/supabase/migrations/00000000000000_captured_schema.sql`.
Steps 2–4 describe setting up a new project.

### 2. Create Storage Bucket

In Supabase Dashboard → Storage:

- Create bucket: **audios**
- Set as **Public** (app needs to play audio files)

The live project has these policies on `storage.objects` (`audios_storage_admin_upload`,
`audios_storage_admin_update`, `audios_storage_admin_delete`, `audios_storage_public_select`);
on a new project, create them:

- **Admin upload**: authenticated users with `user_role = 'ADMIN'`
- **Public read**: all users can read from `audios` bucket

### 3. Deploy Edge Function

```bash
npx supabase functions deploy upload-audio --no-verify-jwt
```

- **upload-audio**: `multipart/form-data` with `audio` (file), `name`, `description`, `tags` (comma-separated).  
  Auth uses the new JWT Signing Keys via `auth.getClaims()`, so the function is deployed with JWT verification off and verifies the token itself (the live function has `verify_jwt: false`; this repo has no `supabase/config.toml` to carry that setting).  
  Storage deletion on row delete is handled by a DB trigger (see step 4) using the Storage REST API—no edge function needed.

### 4. Trigger: Delete Storage on Row Delete (Optional)

The trigger `on_audios_delete_storage` (function `delete_audio_from_storage`) deletes the storage file when an audios row is deleted (covers direct SQL/cascades; admin UI deletes from storage before DB). Uses `extensions.http` to call the Storage API directly—no edge function required. It exists on the live project; like the table, it has no migration file.

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
