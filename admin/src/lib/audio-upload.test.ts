import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: {
    auth: { getSession: () => getSession() },
    storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) },
  },
}))

const { getExtension, uploadAudio } = await import('./audio-upload')

describe('getExtension', () => {
  it('trusts a known extension on the filename over the blob MIME type', () => {
    // The filename wins deliberately: a recorder can hand us audio/webm for a blob
    // the user already named .wav after converting it.
    expect(getExtension(new Blob([], { type: 'audio/webm' }), 'clip.wav')).toBe('wav')
  })

  it('lowercases the filename extension', () => {
    expect(getExtension(new Blob([], { type: '' }), 'CLIP.WAV')).toBe('wav')
  })

  it('falls back to the MIME type when the filename extension is not an audio one', () => {
    expect(getExtension(new Blob([], { type: 'audio/ogg' }), 'notes.txt')).toBe('ogg')
  })

  it('falls back to the MIME type when the filename has no extension at all', () => {
    expect(getExtension(new Blob([], { type: 'audio/mpeg' }), 'recording')).toBe('mp3')
  })

  it.each([
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/wave', 'wav'],
    ['audio/mp3', 'mp3'],
    ['audio/mp4', 'm4a'],
    ['audio/ogg', 'ogg'],
  ])('maps %s to .%s', (mime, expected) => {
    expect(getExtension(new Blob([], { type: mime }), 'recording')).toBe(expected)
  })

  it('defaults to webm for an unrecognised MIME type', () => {
    expect(getExtension(new Blob([], { type: 'application/octet-stream' }), 'recording')).toBe('webm')
  })

  it('accepts oga, which is in the allowlist but has no MIME branch', () => {
    // oga only ever arrives via the filename; audio/ogg maps to 'ogg'.
    expect(getExtension(new Blob([], { type: '' }), 'clip.oga')).toBe('oga')
  })
})

describe('uploadAudio', () => {
  beforeEach(() => {
    getSession.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('refuses to upload without a session rather than sending an unauthenticated request', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    await expect(uploadAudio(new Blob([]), { name: 'a', tags: [] })).rejects.toThrow('Not authenticated')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends the access token and joins tags into one field', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: '1' }) } as Response)

    await uploadAudio(new Blob(['x']), { name: 'clip.wav', tags: ['a', 'b'] })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer tok')
    const body = init?.body as FormData
    expect(body.get('tags')).toBe('a, b')
    expect(body.get('name')).toBe('clip.wav')
    expect(body.get('description')).toBeNull()
  })

  it('prefers the server error field, then details, then a generic message', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })

    const cases: [Record<string, string>, string][] = [
      [{ error: 'too large', details: 'ignored' }, 'too large'],
      [{ details: 'bad codec' }, 'bad codec'],
      [{}, 'Upload failed'],
    ]
    for (const [payload, expected] of cases) {
      vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => payload } as Response)
      await expect(uploadAudio(new Blob([]), { name: 'a', tags: [] })).rejects.toThrow(expected)
    }
  })

  it('falls back to the status text when the error body is not JSON', async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new SyntaxError('not json')
      },
    } as unknown as Response)

    await expect(uploadAudio(new Blob([]), { name: 'a', tags: [] })).rejects.toThrow('Bad Gateway')
  })
})
