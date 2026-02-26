import { z } from 'npm:zod@4.3.6'

const AUDIO_EXTENSIONS = ['webm', 'wav', 'mp3', 'm4a', 'ogg', 'oga'] as const

export const UploadAudioMetadataSchema = z
  .object({
    name: z.string().max(500).optional(),
    description: z.string().max(2000).nullable().optional(),
    tags: z.string().max(500),
  })
  .refine(
    (data) => {
      const tagsArr = data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      return tagsArr.length >= 1
    },
    { message: 'At least one tag is required', path: ['tags'] }
  )

/** Map MIME type to storage file extension. Extension derived from content type, not filename. */
export function getExtensionFromMime(mime: string | null): string {
  if (!mime) return 'webm'
  const m = mime.toLowerCase()
  if (m.includes('webm')) return 'webm'
  if (m.includes('wav') || m.includes('wave')) return 'wav'
  if (m.includes('mpeg') || m === 'audio/mp3') return 'mp3'
  if (m.includes('mp4')) return 'm4a'
  if (m.includes('ogg')) return 'ogg'
  return 'webm'
}

/** Extract extension from filename only if it matches a known audio extension. */
export function getExtensionFromFilename(filename: string | null): string | null {
  if (!filename || !filename.includes('.')) return null
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext && AUDIO_EXTENSIONS.includes(ext as (typeof AUDIO_EXTENSIONS)[number])) {
    return ext
  }
  return null
}
