import type { LexemeOption } from '@/lib/lexeme'

import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { searchLexemes } from '@/lib/lexeme'

interface LexemeLookupProps {
  value: string | null
  onChange: (lexemeId: string | null) => void
}

/** Search the dictionary by headword and store the lexeme id of the chosen entry. */
export function LexemeLookup({ value, onChange }: LexemeLookupProps) {
  const [term, setTerm] = useState('')
  const [options, setOptions] = useState<LexemeOption[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!term.trim()) return
    let cancelled = false
    const timer = setTimeout(() => {
      searchLexemes(term)
        .then((found) => {
          if (cancelled) return
          setOptions(found)
          setError(null)
        })
        .catch((err: Error) => !cancelled && setError(err.message))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term])

  const choose = (option: LexemeOption) => {
    onChange(option.lexemeId)
    setTerm('')
    setOptions([])
  }

  return (
    <div className="mt-1 space-y-2">
      {value ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-medium">{value}</span>
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:underline">
            Clear
          </button>
        </div>
      ) : null}
      <Input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={value ? 'Search to change the lexeme' : 'Search the dictionary by headword, e.g. keɖe'}
      />
      {error && <p className="text-xs text-red-700">{error}</p>}
      {term.trim() && options.length > 0 && (
        <ul className="max-h-60 overflow-y-auto rounded-md border text-sm">
          {options.map((option) => (
            <li key={option.lexemeId}>
              <button
                type="button"
                onClick={() => choose(option)}
                className="hover:bg-muted w-full px-3 py-1.5 text-left"
              >
                <span className="font-medium">{option.headword}</span>
                {option.homographNumber != null && (
                  <span className="text-muted-foreground"> #{option.homographNumber}</span>
                )}
                {option.tone && <span className="text-muted-foreground"> · {option.tone}</span>}
                {option.gloss && <span> · {option.gloss}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
