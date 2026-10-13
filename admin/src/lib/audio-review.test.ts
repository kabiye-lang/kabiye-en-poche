import { describe, expect, it, vi } from 'vitest'

// The dictionary holds two tone twins of keɖe and no unnumbered keɖe.
const dictionary = [
  { headword: 'keɖe', entry_data: { headword: 'keɖe', homograph_number: 1 } },
  { headword: 'keɖe', entry_data: { headword: 'keɖe', homograph_number: 2 } },
]

vi.mock('@/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: async (_column: string, headword: string) => ({
          data: dictionary.filter((entry) => entry.headword === headword),
          error: null,
        }),
      }),
    }),
  },
}))

const { checkApproval, prepareAudioWrite } = await import('./audio-review')

describe('checkApproval', () => {
  it('blocks a recording whose Kabiyè text gives an empty match key', async () => {
    expect(await checkApproval({ kind: 'sentence', kbp_text: ' !? ', lexeme_id: null })).toMatch(/text is empty/)
  })

  it('blocks a recording without a kind', async () => {
    expect(await checkApproval({ kind: null, kbp_text: 'Lɩm keɖe.', lexeme_id: null })).toMatch(/kind/)
  })

  it('blocks a word without a lexeme, which could play for a same-spelling word with another tone', async () => {
    expect(await checkApproval({ kind: 'word', kbp_text: 'keɖe', lexeme_id: '  ' })).toMatch(/lexeme id/)
  })

  it('blocks a word whose lexeme id is not a dictionary entry', async () => {
    expect(await checkApproval({ kind: 'word', kbp_text: 'keɖe', lexeme_id: 'keɖe' })).toMatch(/not in the dictionary/)
    expect(await checkApproval({ kind: 'word', kbp_text: 'keɖe', lexeme_id: 'keɖe#3' })).toMatch(
      /not in the dictionary/
    )
  })

  it('allows a word with an existing lexeme and a sentence without one', async () => {
    expect(await checkApproval({ kind: 'word', kbp_text: 'keɖe', lexeme_id: 'keɖe#2' })).toBeNull()
    expect(await checkApproval({ kind: 'sentence', kbp_text: 'Lɩm keɖe.', lexeme_id: null })).toBeNull()
  })
})

describe('prepareAudioWrite', () => {
  it('derives kbp_key from kbp_text and stores blanks as null', () => {
    expect(prepareAudioWrite({ kbp_text: ' Páná! ', lexeme_id: ' ' })).toEqual({
      kbp_text: 'Páná!',
      kbp_key: 'pana',
      lexeme_id: null,
    })
    expect(prepareAudioWrite({ kbp_text: '' })).toEqual({ kbp_text: null, kbp_key: null })
  })

  it('drops the lexeme id of a sentence, so it cannot be played for that word', () => {
    expect(prepareAudioWrite({ kind: 'sentence', lexeme_id: 'keɖe#1' })).toEqual({ kind: 'sentence', lexeme_id: null })
    expect(prepareAudioWrite({ lexeme_id: 'keɖe#1' }, 'sentence')).toEqual({ lexeme_id: null })
    expect(prepareAudioWrite({ kind: 'word', lexeme_id: 'keɖe#1' }, 'sentence')).toEqual({
      kind: 'word',
      lexeme_id: 'keɖe#1',
    })
  })

  it('leaves kbp_key alone when the write does not touch kbp_text', () => {
    expect(prepareAudioWrite({ status: 'approved' })).toEqual({ status: 'approved' })
  })
})
