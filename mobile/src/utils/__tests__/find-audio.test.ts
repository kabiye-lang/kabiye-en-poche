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
  it('plays the exact lexeme and form the caller names', () => {
    const idx = index(
      rec('one.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' }),
      rec('two.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#2' })
    )
    expect(findAudio(idx, { lexemeId: 'keɖe#2', kbp: 'keɖe' })).toBe(BASE + 'two.m4a')
  })

  // Review P1: a spelling fallback played keɖe#1's recording for keɖe#2.
  it('plays nothing for a lexeme id with no recording of its own, even when a sibling has one', () => {
    const idx = index(rec('one.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' }))
    expect(findAudio(idx, { lexemeId: 'keɖe#2', kbp: 'keɖe' })).toBeUndefined()
  })

  // Review round 2: the spelling fallback could only ever pick the wrong lexeme.
  it('plays nothing for a word looked up without a lexeme id', () => {
    const idx = index(
      rec('n.m4a', { kbpKey: 'nzʋlʋmɩyɛ', lexemeId: 'nzʋlʋmɩyɛ' }),
      rec('one.m4a', { kbpKey: 'keɖe', lexemeId: 'keɖe#1' })
    )
    expect(findAudio(idx, { kbp: 'nzʋlʋmɩyɛ' })).toBeUndefined()
    expect(findAudio(idx, { kbp: 'keɖe' })).toBeUndefined()
  })

  it('ignores tone, case and punctuation in the spelling shown', () => {
    const idx = index(rec('p.m4a', { kbpKey: 'pana', lexemeId: 'pana' }))
    expect(findAudio(idx, { lexemeId: 'pana', kbp: 'Páná!' })).toBe(BASE + 'p.m4a')
  })

  it('matches a lexeme id given in decomposed form (NFD) against the stored NFC one', () => {
    const idx = index(rec('n.m4a', { kbpKey: 'ñɩnɖʋ', lexemeId: 'ñɩnɖʋ'.normalize('NFC') }))
    expect(findAudio(idx, { lexemeId: 'ñɩnɖʋ'.normalize('NFD'), kbp: 'ñɩnɖʋ'.normalize('NFD') })).toBe(BASE + 'n.m4a')
  })

  it('never plays a word recording with no lexeme id', () => {
    const idx = index(rec('unfiled.m4a', { kbpKey: 'nzʋlʋmɩyɛ' }))
    expect(findAudio(idx, { kbp: 'nzʋlʋmɩyɛ' })).toBeUndefined()
    expect(findAudio(idx, { lexemeId: 'nzʋlʋmɩyɛ', kbp: 'nzʋlʋmɩyɛ' })).toBeUndefined()
  })

  // One lexeme, several recorded forms: a lesson can show an inflected form.
  it('plays the form shown, not another form of the same lexeme', () => {
    const idx = index(
      rec('headword.m4a', { kbpKey: 'caɣʋ', lexemeId: 'caɣʋ' }),
      rec('inflected.m4a', { kbpKey: 'ɛcaɣ', lexemeId: 'caɣʋ' })
    )
    expect(findAudio(idx, { lexemeId: 'caɣʋ', kbp: 'ɛcaɣ' })).toBe(BASE + 'inflected.m4a')
    expect(findAudio(idx, { lexemeId: 'caɣʋ', kbp: 'caɣʋ' })).toBe(BASE + 'headword.m4a')
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
    expect(findAudio(index(rec('x.m4a', { kbpKey: '', lexemeId: 'x' })), { kbp: '!' })).toBeUndefined()
  })

  it('answers every lookup with the development fixture when one is set', () => {
    expect(findAudio({ records: [], fixtureUrl: 'http://localhost:8083/tone.m4a' }, { kbp: 'keɖe' })).toBe(
      'http://localhost:8083/tone.m4a'
    )
  })
})

describe('exampleAudioUrl', () => {
  it('keeps a hosted legacy audio_url ahead of the index', () => {
    const idx = index(rec('indexed.m4a', { kbpKey: 'wɩʋ', lexemeId: 'wɩʋ' }))
    expect(exampleAudioUrl(idx, { kbp: 'wɩʋ', audio_url: BASE + 'legacy.m4a' })).toBe(BASE + 'legacy.m4a')
  })

  it('falls back to the index when the legacy URL is not ours', () => {
    const idx = index(rec('indexed.m4a', { kbpKey: 'wɩʋ', lexemeId: 'wɩʋ' }))
    expect(exampleAudioUrl(idx, { kbp: 'wɩʋ', lexeme_id: 'wɩʋ', audio_url: 'https://example.com/x.mp3' })).toBe(
      BASE + 'indexed.m4a'
    )
  })

  it('rejects an index URL that is not on our origin', () => {
    const idx = { records: [{ url: 'https://example.com/x.m4a', kind: 'word', kbpKey: 'wɩʋ', lexemeId: 'wɩʋ' }] }
    expect(exampleAudioUrl(idx, { kbp: 'wɩʋ', lexeme_id: 'wɩʋ' })).toBeUndefined()
  })
})
