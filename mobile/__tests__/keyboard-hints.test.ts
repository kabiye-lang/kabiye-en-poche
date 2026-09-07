/**
 * The Kabiyè keyboard's capital handling.
 *
 * This file previously tested a local boolean being flipped -- `let showHint = false;
 * showHint = !showHint; expect(showHint).toBe(true)` -- which asserted that `!` works
 * and pinned nothing about the screen. The collapsible hint it referred to is gone,
 * replaced by a permanent one-line note, so the file now covers what the keyboard
 * actually has to get right: which character a key produces.
 *
 * Kabiyè capitalises where French does, so a writer needs a capital every sentence or
 * two rather than in runs. Long-press produces one directly; shift remains for runs.
 */

import { ALPHABET_LIST, KABIYE_SPECIFIC, resolveKey } from '../src/screens/keyboard'

describe('resolveKey', () => {
  const eth = { id: 'ɖ', caps: 'Ɖ' }

  it('types the lowercase letter with no shift', () => {
    expect(resolveKey(eth, 0, false)).toBe('ɖ')
  })

  it('types the capital on long-press, whatever shift says', () => {
    expect(resolveKey(eth, 0, true)).toBe('Ɖ')
    expect(resolveKey(eth, 1, true)).toBe('Ɖ')
    expect(resolveKey(eth, 2, true)).toBe('Ɖ')
  })

  it('types the capital while shift is held', () => {
    expect(resolveKey(eth, 1, false)).toBe('Ɖ')
  })

  it('types the capital while caps lock is on', () => {
    expect(resolveKey(eth, 2, false)).toBe('Ɖ')
  })

  it('falls back to the lowercase when a key has no distinct capital', () => {
    // Punctuation and digits have no case; a missing `caps` must not produce "undefined".
    expect(resolveKey({ id: '?', caps: '' }, 1, false)).toBe('?')
    expect(resolveKey({ id: '?', caps: '' }, 0, true)).toBe('?')
  })
})

describe('the alphabet the keyboard offers', () => {
  it('carries every letter French cannot write', () => {
    for (const letter of KABIYE_SPECIFIC) {
      expect(ALPHABET_LIST.some((key) => key.id === letter)).toBe(true)
    }
  })

  it('gives every Kabiyè-only letter a capital, since sentences start with them', () => {
    for (const key of ALPHABET_LIST) {
      if (KABIYE_SPECIFIC.has(key.id)) {
        expect(key.caps).toBeTruthy()
        expect(key.caps).not.toBe(key.id)
      }
    }
  })

  it('never maps two letters onto the same capital', () => {
    // ŋ and ñ both fall to "n" when a keyboard lacks them; the point of this one is
    // that they do not.
    const caps = ALPHABET_LIST.filter((k) => KABIYE_SPECIFIC.has(k.id)).map((k) => k.caps)
    expect(new Set(caps).size).toBe(caps.length)
  })
})
