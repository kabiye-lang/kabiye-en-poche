# Audio bucket is public: fix before audio goes live

Status: pending. Audio is not in use yet, so this waits until the audio feature is built.

## The problem

- The storage bucket `audios` is public.
- The policy `audios_storage_public_select` lets anyone read every file in it.
- The `audios` table shows only rows with `status = 'approved'` and `source = 'native'` to the public. The bucket skips that filter.
- So a `pending` or rejected recording can be downloaded by anyone who knows or guesses its file name.
- On 2 Nov 2026 the bucket held 1 file, from 25 Feb 2026, with no `audios` row. A test upload made from the admin that day was deleted with its file.

Found by the Codex review of kbp-content [PR #343](https://github.com/kabiye-lang/kbp-content/pull/343). The live policies are captured in `kbp-content/supabase/migrations/20261102120000_captured_security.sql`.

## Fix (pick one when audio work starts)

1. Make `audios` private. Serve approved files through signed URLs, from the app and the admin.
2. Keep a public bucket for approved files only. Upload to a private bucket, and copy a file to the public one when it is approved.

Either way:

- Remove `audios_storage_public_select`, or limit it to approved files.
- Update `getAudioPublicUrl` in `admin/src/lib/audio-upload.ts` and the URL that `upload-audio` returns.
- Update step 2 of `admin/AUDIO_SETUP.md`.
- Delete the orphan file before launch.

## Done means

- A signed-out request for a `pending` file gets 400 or 404.
- An approved file still plays in the app.
