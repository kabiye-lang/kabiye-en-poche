import fs from 'fs'
import path from 'path'

import { TOKENS } from '../../hooks/use-theme-color'

/**
 * Locks the Laterite contrast pairs in place by reading the actual source of truth --
 * `global.css` -- rather than a copy of the hex values. A future edit that lowers a
 * token below its WCAG floor, or that lets `global.css` and `use-theme-color.ts` drift
 * apart, fails here instead of shipping.
 */

const CSS_PATH = path.join(__dirname, '../../global.css')
const css = fs.readFileSync(CSS_PATH, 'utf8')

/** The `{ ... }` body of `@variant <name> { ... }`, brace-balanced so nested rules
 *  (there are none today, but this does not assume it stays that way) cannot truncate
 *  the block early. */
function extractVariantBlock(source: string, name: string): string {
  const marker = `@variant ${name} {`
  const start = source.indexOf(marker)
  if (start === -1) throw new Error(`@variant ${name} not found in global.css`)
  let i = start + marker.length
  let depth = 1
  while (depth > 0) {
    if (i >= source.length) throw new Error(`Unbalanced braces reading @variant ${name}`)
    if (source[i] === '{') depth++
    else if (source[i] === '}') depth--
    i++
  }
  return source.slice(start + marker.length, i - 1)
}

/** `--color-name: value;` pairs inside a block, keyed by the bit after `--color-`. */
function parseColorTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {}
  const pattern = /--color-([a-z0-9-]+):\s*([^;]+);/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(block))) {
    tokens[match[1]] = match[2].trim()
  }
  return tokens
}

const lightBlock = extractVariantBlock(css, 'light')
const darkBlock = extractVariantBlock(css, 'dark')
const light = parseColorTokens(lightBlock)
const dark = parseColorTokens(darkBlock)

function hexToLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Relative luminance, WCAG formula. Only `#rrggbb` is supported -- every pair this
 *  test checks resolves to a solid hex in both themes. */
function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) throw new Error(`Expected a solid #rrggbb colour, got "${hex}"`)
  const value = match[1]
  const r = hexToLinear(parseInt(value.slice(0, 2), 16))
  const g = hexToLinear(parseInt(value.slice(2, 4), 16))
  const b = hexToLinear(parseInt(value.slice(4, 6), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

const AA_NORMAL_TEXT = 4.5

describe('accent-text on its documented grounds', () => {
  it('clears 4.5:1 on paper, recessed and leaf in light', () => {
    expect(contrastRatio(light['accent-text'], light['background'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(light['accent-text'], light['background-tertiary'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(light['accent-text'], light['background-secondary'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  it('clears 4.5:1 on ink (#221913) and card (#2E241C) in dark', () => {
    expect(contrastRatio(dark['accent-text'], dark['background'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    expect(contrastRatio(dark['accent-text'], dark['background-secondary'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    // The measured facts this spec is built on name the raw hexes -- pin them too, so a
    // renamed or repointed token cannot quietly change which ground is being checked.
    expect(dark['background']).toBe('#221913')
    expect(dark['background-secondary']).toBe('#2E241C')
  })
})

describe('on-accent on the accent fills', () => {
  it('clears 4.5:1 on accent-fill and accent-fill-pressed, in both themes', () => {
    for (const theme of [light, dark]) {
      expect(contrastRatio(theme['on-accent'], theme['accent-fill'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      expect(contrastRatio(theme['on-accent'], theme['accent-fill-pressed'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    }
  })

  it('the fills themselves are fixed across themes, not theme-raised', () => {
    expect(light['accent-fill']).toBe(dark['accent-fill'])
    expect(light['accent-fill-pressed']).toBe(dark['accent-fill-pressed'])
  })
})

describe('accent-on-ink on the ink screens', () => {
  // The onboarding question and Spot the letter are ink in both themes. Small laterite
  // there is `accent-on-ink`, never `accent-text` -- #B03C17 on ink is 2.88:1.
  it('clears 4.5:1 on surface-ink in both themes', () => {
    for (const theme of [light, dark]) {
      expect(contrastRatio(theme['accent-on-ink'], theme['surface-ink'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    }
  })
})

describe('primary-foreground on primary', () => {
  it('clears 4.5:1 in both themes', () => {
    for (const theme of [light, dark]) {
      expect(contrastRatio(theme['primary-foreground'], theme['primary'])).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    }
  })
})

describe('TOKENS in use-theme-color.ts parity with global.css', () => {
  function cssVarName(tokenName: string): string {
    return tokenName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  }

  it.each(['light', 'dark'] as const)('every %s token equals the CSS value of the same name', (theme) => {
    const block = theme === 'light' ? light : dark
    for (const [name, value] of Object.entries(TOKENS[theme])) {
      const cssName = cssVarName(name)
      expect(block[cssName]).toBeDefined()
      expect(block[cssName]).toBe(value)
    }
  })
})
