import type { AudioRecord } from '../find-audio'

import { EMPTY_AUDIO_INDEX, exampleAudioUrl, findAudio } from '../find-audio'

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { supabase: { url: 'https://isdeilllppdfngxmsols.supabase.co' } } } },
}))

const BASE = 'https://isdeilllppdfngxmsols.supabase.co/storage/v1/object/public/audios/'

const rec = (name: string, fields: Partial<AudioRecord>): AudioRecord => ({
  url: BASE + name,
  kind: 'word',
  kbpKey: null,
  lexemeId: null,
  ...fields,
})

const index = (...records: AudioRecord[]) => ({ records })

describe('findAudio', () => {
  it('prefers the exact lexeme id over a spelling match', () => {
    const idx = index(rec('spelled.m4a', { kbpKey: 'keɖe' }), rec('exact.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' }))
    expect(findAudio(idx, { lexemeId: 'keɖe#1', kbp: 'keɖe' })).toBe(BASE + 'exact.m4a')
  })

  it('matches by spelling, ignoring tone, case and punctuation', () => {
    const idx = index(rec('pana.m4a', { kbpKey: 'pana' }))
    expect(findAudio(idx, { kbp: 'Páná!' })).toBe(BASE + 'pana.m4a')
  })

  it('skips a spelling match filed under a different lexeme', () => {
    const idx = index(rec('other.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#2' }))
    expect(findAudio(idx, { lexemeId: 'keɖe#1', kbp: 'keɖe' })).toBeUndefined()
  })

  it('never guesses between two lexemes spelled alike', () => {
    const idx = index(
      rec('one.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' }),
      rec('two.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#2' })
    )
    expect(findAudio(idx, { kbp: 'keɖe' })).toBeUndefined()
  })

  it('takes the first match when every candidate is the same lexeme or unfiled', () => {
    const idx = index(
      rec('unfiled.m4a', { kbpKey: 'keɖe' }),
      rec('one.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' }),
      rec('one-again.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' })
    )
    expect(findAudio(idx, { kbp: 'keɖe' })).toBe(BASE + 'unfiled.m4a')
  })

  // Lesson sentences carry the lexeme id of the word they illustrate.
  it('does not answer a word with a sentence recording filed under its lexeme', () => {
    const idx = index(rec('sentence.m4a', { kind: 'sentence', kbpKey: 'tuu keɖe pasakɩ sɔka', lexemeId: 'keɖe#1' }))
    expect(findAudio(idx, { lexemeId: 'keɖe#1', kbp: 'keɖe' })).toBeUndefined()
  })

  it('finds a sentence by its spelling only, never by lexeme id', () => {
    const idx = index(rec('sentence.m4a', { kind: 'sentence', kbpKey: 'tuu keɖe pasakɩ sɔka', lexemeId: 'keɖe#1' }))
    expect(findAudio(idx, { kbp: 'Tuu keɖe pasakɩ sɔka.', kind: 'sentence' })).toBe(BASE + 'sentence.m4a')
    expect(findAudio(idx, { lexemeId: 'keɖe#1', kbp: 'keɖe', kind: 'sentence' })).toBeUndefined()
  })

  it('never plays a row with no kind', () => {
    const idx = index(rec('unknown.m4a', { kind: null, kbpKey: 'keɖe', lexemeId: 'keɖe#1' }))
    expect(findAudio(idx, { lexemeId: 'keɖe#1', kbp: 'keɖe' })).toBeUndefined()
    expect(findAudio(idx, { kbp: 'keɖe', kind: 'sentence' })).toBeUndefined()
  })

  it('finds nothing in an empty index or for an empty word', () => {
    expect(findAudio(EMPTY_AUDIO_INDEX, { kbp: 'keɖe' })).toBeUndefined()
    expect(findAudio(index(rec('x.m4a', { kbpKey: '' })), { kbp: '!' })).toBeUndefined()
  })

  it('answers every lookup with the development fixture when one is set', () => {
    expect(findAudio({ records: [], fixtureUrl: 'http://localhost:8083/tone.m4a' }, { kbp: 'keɖe' })).toBe(
      'http://localhost:8083/tone.m4a'
    )
  })
})

describe('exampleAudioUrl', () => {
  it('keeps a hosted legacy audio_url ahead of the index', () => {
    const idx = index(rec('indexed.m4a', { kbpKey: 'keɖe' }))
    expect(exampleAudioUrl(idx, { kbp: 'keɖe', audio_url: BASE + 'legacy.m4a' })).toBe(BASE + 'legacy.m4a')
  })

  it('falls back to the index when the legacy URL is not ours', () => {
    const idx = index(rec('indexed.m4a', { kbpKey: 'keɖe' }))
    expect(exampleAudioUrl(idx, { kbp: 'keɖe', audio_url: 'https://example.com/x.mp3' })).toBe(BASE + 'indexed.m4a')
  })

  it('rejects an index URL that is not on our origin', () => {
    const idx = { records: [{ url: 'https://example.com/x.m4a', kind: 'word', kbpKey: 'keɖe', lexemeId: null }] }
    expect(exampleAudioUrl(idx, { kbp: 'keɖe' })).toBeUndefined()
  })
})
