/**
 * The interface face must not silently start (or stop) drawing Kabiyè letters.
 *
 * `utils/kabiye-script.ts` hard-codes the twelve letters the interface face cannot draw,
 * and every Kabiyè word in the app is routed to Andika on that basis. The list is only
 * correct for a particular typeface: swap the face and it can quietly become wrong, which
 * shows up not as a crash but as a word drawn half in one face and half in the OS
 * fallback -- on the alphabet card whose job is to show what the letter looks like.
 *
 * The Laterite redesign swapped Figtree for Bricolage Grotesque and the list happened to
 * stay correct. This test is what makes the next swap say so out loud: it reads the cmap
 * of the font actually installed and compares it against the list.
 */

import fs from 'fs'
import path from 'path'

/** Every letter of the Kabiyè alphabet that is not plain ASCII. */
const KABIYE_LETTERS = 'ɖƉɛƐɣƔɩƖŋŊɔƆʋƲñÑ'

/** The set `kabiye-script.ts` claims the interface face cannot draw. */
const CLAIMED_MISSING = 'ɖƉɛƐɣƔɩƖɔƆʋƲ'

function readU16(b: Buffer, o: number) {
  return b.readUInt16BE(o)
}

/** Code points the font's best Unicode cmap subtable maps. Supports formats 4 and 12. */
function codepoints(file: string): Set<number> {
  const d = fs.readFileSync(file)
  const numTables = readU16(d, 4)
  let cmapOffset = -1
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16
    if (d.toString('latin1', rec, rec + 4) === 'cmap') cmapOffset = d.readUInt32BE(rec + 8)
  }
  if (cmapOffset < 0) throw new Error(`no cmap table in ${file}`)

  const n = readU16(d, cmapOffset + 2)
  let sub = -1
  for (let i = 0; i < n; i++) {
    const rec = cmapOffset + 4 + i * 8
    const platform = readU16(d, rec)
    const encoding = readU16(d, rec + 2)
    const unicode =
      (platform === 3 && (encoding === 1 || encoding === 10)) ||
      (platform === 0 && [3, 4, 6].includes(encoding))
    if (unicode) sub = cmapOffset + d.readUInt32BE(rec + 4)
  }
  if (sub < 0) throw new Error(`no Unicode cmap subtable in ${file}`)

  const out = new Set<number>()
  const format = readU16(d, sub)
  if (format === 4) {
    const segCount = readU16(d, sub + 6) / 2
    const endBase = sub + 14
    const startBase = endBase + segCount * 2 + 2
    for (let i = 0; i < segCount; i++) {
      const end = readU16(d, endBase + i * 2)
      const start = readU16(d, startBase + i * 2)
      if (start === 0xffff) continue
      for (let c = start; c <= end && c !== 0xffff; c++) out.add(c)
    }
  } else if (format === 12) {
    const groups = d.readUInt32BE(sub + 12)
    for (let i = 0; i < groups; i++) {
      const g = sub + 16 + i * 12
      const start = d.readUInt32BE(g)
      const end = d.readUInt32BE(g + 4)
      for (let c = start; c <= end; c++) out.add(c)
    }
  } else {
    throw new Error(`unsupported cmap format ${format} in ${file}`)
  }
  return out
}

/** Resolve a font file out of the installed package, wherever pnpm put it.
 *  The google-fonts packages nest each weight in its own directory, so this walks. */
function fontFile(pkg: string, match: RegExp): string {
  const root = path.dirname(require.resolve(`${pkg}/package.json`))
  const stack = [root]
  while (stack.length) {
    const dir = stack.pop()!
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.name.endsWith('.ttf') && match.test(entry.name)) return full
    }
  }
  throw new Error(`no font matching ${match} under ${root}`)
}

describe('interface face vs the Kabiyè alphabet', () => {
  it('cannot draw exactly the letters kabiye-script.ts routes to Andika', () => {
    const covered = codepoints(fontFile('@expo-google-fonts/bricolage-grotesque', /400Regular/))
    const missing = [...KABIYE_LETTERS].filter((c) => !covered.has(c.codePointAt(0)!))
    expect(missing.join('')).toBe(CLAIMED_MISSING)
  })

  it('Andika draws every Kabiyè letter, so the fallback never reaches the OS', () => {
    const covered = codepoints(fontFile('@expo-google-fonts/andika', /400Regular/))
    const missing = [...KABIYE_LETTERS].filter((c) => !covered.has(c.codePointAt(0)!))
    expect(missing).toEqual([])
  })
})
