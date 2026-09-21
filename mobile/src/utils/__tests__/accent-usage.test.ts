import fs from 'fs'
import path from 'path'

/**
 * Two Laterite rules, enforced on the actual source rather than trusted to review:
 *
 * 1. `text-accent` (4.22:1 on paper) is for large text, decorative marks and non-text
 *    graphics only. Below `text-[24px]` it has to be `text-accent-text` instead, unless
 *    the size still clears the WCAG large-text bold threshold (>= 18.66px bold) -- that
 *    case is marked with a `// large-text:` comment on or above the line, rather than
 *    silently exempted, so the exception stays visible in review. In JSX children
 *    position only `{/* ... *\/}` is syntactically a comment (a bare `//` renders as
 *    literal text), so both spellings of the marker are accepted here.
 * 2. A `bg-accent-fill` ground never carries translucent text: `text-white/NN` or
 *    `text-on-accent/NN` on it re-lowers a ratio this spec raised on purpose.
 */

const SRC_ROOT = path.join(__dirname, '../..')

function listTsxFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listTsxFiles(full))
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      files.push(full)
    }
  }
  return files
}

/** Blanks out comments while preserving line numbers and column positions, so a
 *  code-mention of a class name inside a comment (e.g. this file's own doc comment)
 *  can never be mistaken for a real `className`. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (line) => line.replace(/[^\n]/g, ' '))
}

/** Every string literal in the source -- `'...'`, `"..."` and backtick templates, which
 *  may span lines -- with the line it starts on. Template interpolations become a space,
 *  so the static classes either side still read as one class list. */
function stringLiterals(source: string): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = []
  for (const match of source.matchAll(/'([^'\n]*)'|"([^"]*)"|`([^`]*)`/g)) {
    const text = (match[1] ?? match[2] ?? match[3] ?? '').replace(/\$\{[^}]*\}/g, ' ')
    out.push({ text, line: source.slice(0, match.index).split('\n').length })
  }
  return out
}

/** Every `className={...}` / `className="..."` attribute, as the concatenation of all the
 *  string literals inside it, so a class list split across lines or across a ternary is
 *  judged as a whole. */
function classNameAttributes(source: string): { text: string; line: number }[] {
  const out: { text: string; line: number }[] = []
  for (const match of source.matchAll(/className=/g)) {
    let i = (match.index ?? 0) + 'className='.length
    let body: string
    if (source[i] === '{') {
      let depth = 0
      const from = i
      for (; i < source.length; i++) {
        if (source[i] === '{') depth++
        else if (source[i] === '}' && --depth === 0) break
      }
      body = source.slice(from, i + 1)
    } else {
      const quote = source[i]
      body = source.slice(i, source.indexOf(quote, i + 1) + 1)
    }
    const text = stringLiterals(body)
      .map((literal) => literal.text)
      .join(' ')
    out.push({ text, line: source.slice(0, match.index).split('\n').length })
  }
  return out
}

/** The class lists to judge: each whole className attribute, plus every string literal
 *  on its own (variant maps like `tv({ ... })` keep their classes outside any attribute). */
function classLists(source: string): { text: string; line: number }[] {
  return [...classNameAttributes(source), ...stringLiterals(source)]
}

const BARE_TEXT_ACCENT = /(?<![-\w])text-accent(?![-\w])/
const SMALL_SIZE = /text-\[(?:9|1\d|2[0-3])px\]|\btext-(?:xs|sm|base|lg|xl)\b/
const LARGE_TEXT_JUSTIFICATION = /(?:\/\/|\/\*|\{\/\*)\s*large-text:/

function smallAccentViolation(code: string, rawLines: string[]): string | null {
  for (const { text, line } of classLists(code)) {
    if (!BARE_TEXT_ACCENT.test(text) || !SMALL_SIZE.test(text)) continue
    // The marker can sit on the match's own line, or anywhere in a short comment block
    // immediately above it (JSX comments put it on the block's first line).
    const LOOKBACK_LINES = 4
    const justified = rawLines
      .slice(Math.max(0, line - 1 - LOOKBACK_LINES), line)
      .some((candidate) => LARGE_TEXT_JUSTIFICATION.test(candidate))
    if (!justified) {
      return (
        `${line} pairs "text-accent" with a small size class ("${text.trim()}"). Use "text-accent-text", ` +
        `or add a "// large-text:" comment on or above the line if the size still clears the ` +
        `WCAG large-text bold threshold.`
      )
    }
  }
  return null
}

function translucentFillViolation(code: string): string | null {
  for (const { text, line } of classLists(code)) {
    if (!text.includes('bg-accent-fill')) continue
    if (/text-(?:white|on-accent)\/\d/.test(text)) {
      return (
        `${line} pairs "bg-accent-fill" with a translucent text class ("${text.trim()}"). ` +
        `Text/icons on an accent fill must be "text-on-accent" at full opacity.`
      )
    }
  }
  return null
}

describe('text-accent stays large, text-accent-text carries small text', () => {
  const files = listTsxFiles(SRC_ROOT)
  expect(files.length).toBeGreaterThan(0)

  it.each(files.map((f) => [path.relative(SRC_ROOT, f), f] as const))('%s', (_rel, file) => {
    const raw = fs.readFileSync(file, 'utf8')
    const rawLines = raw.split('\n')
    const violation = smallAccentViolation(stripComments(raw), rawLines)
    if (violation) throw new Error(`${path.relative(SRC_ROOT, file)}:${violation}`)
  })
})

describe('bg-accent-fill never carries translucent text', () => {
  const files = listTsxFiles(SRC_ROOT)

  it.each(files.map((f) => [path.relative(SRC_ROOT, f), f] as const))('%s', (_rel, file) => {
    const violation = translucentFillViolation(stripComments(fs.readFileSync(file, 'utf8')))
    if (violation) throw new Error(`${path.relative(SRC_ROOT, file)}:${violation}`)
  })
})

describe('the guards catch what they claim to', () => {
  it('flags a small text-accent split across lines', () => {
    const source = 'const A = () => <Text className={`text-accent\n  text-[13px] uppercase`} />'
    expect(smallAccentViolation(source, source.split('\n'))).not.toBeNull()
  })

  it('flags a small text-accent split across a ternary', () => {
    const source =
      "<Text className={on ? 'text-accent' : 'text-foreground'} style={x} />\n" +
      "<Text className={cx('text-accent', 'text-[13px]')} />"
    expect(smallAccentViolation(source, source.split('\n'))).not.toBeNull()
  })

  it('accepts text-accent-text and large text-accent', () => {
    const source = '<Text className="text-accent-text text-[13px]" />\n<Text className="text-accent text-[40px]" />'
    expect(smallAccentViolation(source, source.split('\n'))).toBeNull()
  })

  it('flags translucent text on an accent fill split across lines', () => {
    const source =
      'const A = () => <View className={`bg-accent-fill\n  p-4`}><Text className="text-on-accent/70" /></View>\n' +
      '<View className={`bg-accent-fill\n text-on-accent/70`} />'
    expect(translucentFillViolation(source)).not.toBeNull()
  })

  it('flags a small text-accent in a quoted attribute that spans lines', () => {
    const source = '<Text className="text-accent\n  text-[13px]" />'
    expect(smallAccentViolation(source, source.split('\n'))).not.toBeNull()
  })

  it('flags translucent fill text in a quoted attribute that spans lines', () => {
    const source = '<View className="bg-accent-fill\n  text-on-accent/70" />'
    expect(translucentFillViolation(source)).not.toBeNull()
  })
})
