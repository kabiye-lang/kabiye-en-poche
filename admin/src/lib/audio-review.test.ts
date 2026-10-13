import { describe, expect, it } from 'vitest'

import { approvalBlocker, prepareAudioWrite } from './audio-review'

describe('approvalBlocker', () => {
  it('blocks a recording whose Kabiyè text gives an empty match key', () => {
    expect(approvalBlocker({ kind: 'sentence', kbp_text: ' !? ', lexeme_id: null })).toMatch(/text is empty/)
  })

  it('blocks a word without a lexeme, which could play for a same-spelling word with another tone', () => {
    expect(approvalBlocker({ kind: 'word', kbp_text: 'keɖe', lexeme_id: '  ' })).toMatch(/lexeme id/)
  })

  it('allows a word with a lexeme and a sentence without one', () => {
    expect(approvalBlocker({ kind: 'word', kbp_text: 'keɖe', lexeme_id: 'keɖe#1' })).toBeNull()
    expect(approvalBlocker({ kind: 'sentence', kbp_text: 'Lɩm keɖe.', lexeme_id: null })).toBeNull()
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

  it('leaves kbp_key alone when the write does not touch kbp_text', () => {
    expect(prepareAudioWrite({ status: 'approved' })).toEqual({ status: 'approved' })
  })
})
