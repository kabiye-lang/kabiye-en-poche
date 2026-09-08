import { supabase } from '@/supabase'

export interface UploadAudioResult {
  id: string
  storage_path: string
  url: string
  name: string
  created_at: string
}

export async function uploadAudio(
  file: Blob,
  metadata: { name: string; description?: string; tags: string[] }
): Promise<UploadAudioResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('audio', file, metadata.name || `audio-${Date.now()}.webm`)
  formData.append('name', metadata.name || 'Untitled')
  if (metadata.description) formData.append('description', metadata.description)
  formData.append('tags', metadata.tags.join(', '))

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.details || 'Upload failed')
  }

  return res.json()
}

export function getAudioPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from('audios').getPublicUrl(storagePath)
  return data.publicUrl
}

export async function deleteAudioFromStorage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from('audios').remove([storagePath])
  if (error) throw new Error(error.message)
}

const AUDIO_EXTENSIONS = ['webm', 'wav', 'mp3', 'm4a', 'ogg', 'oga'] as const

/**
 * Pick the storage file extension for an uploaded blob: trust the filename when it
 * carries a known audio extension, otherwise sniff the MIME type, otherwise webm.
 * Exported for tests.
 */
export function getExtension(blob: Blob, fileName: string): string {
  const extFromName = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : null
  if (extFromName && AUDIO_EXTENSIONS.includes(extFromName as (typeof AUDIO_EXTENSIONS)[number])) return extFromName
  const mime = (blob.type || '').toLowerCase()
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('wav') || mime.includes('wave')) return 'wav'
  if (mime.includes('mpeg') || mime === 'audio/mp3') return 'mp3'
  if (mime.includes('mp4')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  return 'webm'
}

/** Upload audio blob to storage only (for replace/edit flow). Returns storage_path. */
export async function uploadAudioToStorage(
  blob: Blob,
  fileName: string
): Promise<{ storagePath: string; mimeType: string }> {
  const ext = getExtension(blob, fileName)
  const storagePath = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const { error } = await supabase.storage.from('audios').upload(storagePath, blob, {
    contentType: blob.type || 'audio/webm',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return { storagePath, mimeType: blob.type || 'audio/webm' }
}
