import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2.97.0'

import { AuthMiddleware } from '../_shared/auth.ts'
import { getExtensionFromFilename, getExtensionFromMime, UploadAudioMetadataSchema } from '../_shared/validation.ts'

/**
 * IMPORTANT: https://supabase.com/docs/guides/functions/auth
 * Currently, the new API keys are not available by default on the Edge Functions environment.
 * But you can manually expose them as secret using the SB_ prefix.
 */

const MB = 1024 * 1024

Deno.serve((req) =>
  AuthMiddleware(req, async (req) => {
    try {
      const authHeader = req.headers.get('Authorization')!

      const contentType = req.headers.get('Content-Type') || ''
      if (!contentType.includes('multipart/form-data')) {
        return new Response(JSON.stringify({ error: 'Content-Type must be multipart/form-data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const formData = await req.formData()
      const file = formData.get('audio') as File | null
      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: 'Missing or invalid audio file' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const metadataResult = UploadAudioMetadataSchema.safeParse({
        name: formData.get('name') ?? '',
        description: formData.get('description') ?? null,
        tags: formData.get('tags') ?? '',
      })

      if (!metadataResult.success) {
        const msg = metadataResult.error.errors[0]?.message ?? 'Invalid metadata (tags are required)'
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const metadata = metadataResult.data
      const name = (metadata.name?.trim() || `audio-${Date.now()}`).slice(0, 500)
      const description = metadata.description?.trim() ?? null
      const tags = metadata.tags.split(',').map((t) => t.trim()).filter(Boolean)

      if (file.size > 10 * MB) {
        return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const extFromFilename = getExtensionFromFilename(file.name)
      const ext = extFromFilename ?? getExtensionFromMime(file.type)
      const storagePath = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseAnonKey = Deno.env.get('SB_PUBLISHABLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })

      const arrayBuffer = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage.from('audios').upload(storagePath, arrayBuffer, {
        contentType: file.type || 'audio/webm',
        upsert: false,
      })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return new Response(JSON.stringify({ error: 'Failed to upload audio', details: uploadError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: urlData } = supabase.storage.from('audios').getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      const { data: row, error: insertError } = await supabase
        .from('audios')
        .insert({
          storage_path: storagePath,
          name,
          description,
          tags,
          mime_type: file.type || 'audio/webm',
        })
        .select('id, storage_path, name, created_at')
        .single()

      if (insertError) {
        console.error('DB insert error:', insertError)
        await supabase.storage.from('audios').remove([storagePath])
        return new Response(JSON.stringify({ error: 'Failed to save audio metadata', details: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(
        JSON.stringify({
          id: row.id,
          storage_path: storagePath,
          url: publicUrl,
          name: row.name,
          created_at: row.created_at,
        }),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    } catch (err) {
      console.error('Upload error:', err)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  })
)
