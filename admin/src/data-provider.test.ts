import { beforeEach, describe, expect, it, vi } from 'vitest'

type Row = Record<string, unknown>

// A small in-memory stand-in for the two tables the audio paths read, and for the
// ra-supabase provider they write through. Writes land in `written`, not in the tables.
const db = vi.hoisted(() => ({
  tables: {} as Record<string, Row[]>,
  written: [] as { id: unknown; data: Row }[],
  // The write to this row id fails with this error, as a database refusal would.
  failOn: null as { id: string; error: unknown } | null,
}))

vi.mock('@/supabase', () => {
  const query = (rows: Row[]) => {
    let result = rows
    const where = (keep: (row: Row) => boolean) => {
      result = result.filter(keep)
      return builder
    }
    const builder = {
      select: () => builder,
      eq: (column: string, value: unknown) => where((row) => row[column] === value),
      filter: (column: string, _op: 'eq', value: unknown) => where((row) => row[column] === value),
      neq: (column: string, value: unknown) => where((row) => row[column] !== value),
      in: (column: string, values: unknown[]) => where((row) => values.includes(row[column])),
      limit: (count: number) => {
        result = result.slice(0, count)
        return builder
      },
      then: (resolve: (value: { data: Row[]; error: null }) => unknown) => resolve({ data: result, error: null }),
    }
    return builder
  }
  return { supabase: { from: (table: string) => query(db.tables[table] ?? []) } }
})

vi.mock('ra-supabase', () => ({
  supabaseDataProvider: () => ({
    update: async (_resource: string, params: { id: unknown; data: Row }) => {
      if (db.failOn && db.failOn.id === params.id) throw db.failOn.error
      db.written.push({ id: params.id, data: params.data })
      return { data: { id: params.id, ...params.data } }
    },
    create: async (_resource: string, params: { data: Row }) => {
      db.written.push({ id: 'new', data: params.data })
      return { data: { id: 'new', ...params.data } }
    },
  }),
}))

const { dataProvider } = await import('./data-provider')

const entry = (headword: string, homograph: number | null) => ({
  headword,
  entry_data: { headword, homograph_number: homograph },
})

const audio = (row: Row): Row => ({
  name: `audio ${row.id}`,
  kind: null,
  kbp_text: null,
  kbp_key: null,
  lexeme_id: null,
  source: 'native',
  status: 'pending',
  ...row,
})

const update = (id: string, data: Row) => dataProvider.update('audios', { id, data, previousData: { id } })
const updateMany = (ids: string[], data: Row) => dataProvider.updateMany('audios', { ids, data })
const writtenFor = (id: string) => db.written.find((write) => write.id === id)?.data

beforeEach(() => {
  db.written = []
  db.failOn = null
  db.tables = {
    dictionary_entries: [entry('keɖe', 1), entry('keɖe', 2), entry('caɣʋ', null)],
    audios: [
      audio({ id: 'sentence', kind: 'sentence', kbp_text: 'Lɩm keɖe.', lexeme_id: 'keɖe#1' }),
      audio({ id: 'word', kind: 'word', kbp_text: 'keɖe', lexeme_id: 'keɖe#1' }),
      audio({
        id: 'approved',
        kind: 'word',
        kbp_text: 'keɖe',
        kbp_key: 'keɖe',
        lexeme_id: 'keɖe#2',
        status: 'approved',
      }),
      audio({ id: 'stale', kind: 'sentence', kbp_text: 'Páná!', kbp_key: null }),
    ],
  }
})

describe('audio writes normalise the merged row', () => {
  it('drops a sentence lexeme id on bulk approve and on a bulk lexeme update', async () => {
    await updateMany(['sentence'], { status: 'approved' })
    expect(writtenFor('sentence')).toMatchObject({ status: 'approved', lexeme_id: null })

    db.written = []
    await updateMany(['sentence'], { lexeme_id: 'keɖe#2' })
    expect(writtenFor('sentence')).toMatchObject({ lexeme_id: null })
  })

  it('drops the lexeme id when a single update sets only lexeme_id on a sentence', async () => {
    await update('sentence', { lexeme_id: 'keɖe#2' })
    expect(writtenFor('sentence')).toMatchObject({ lexeme_id: null })
  })

  it('derives kbp_key from the stored text on approve, and ignores a caller kbp_key', async () => {
    await update('stale', { status: 'approved' })
    expect(writtenFor('stale')).toEqual({ status: 'approved', kbp_key: 'pana' })

    db.written = []
    await updateMany(['stale'], { kbp_key: 'forged' })
    expect(writtenFor('stale')).toMatchObject({ kbp_key: 'pana' })
  })
})

describe('audio writes validate the merged row when it ends approved', () => {
  it.each([
    ['an unknown lexeme id', { lexeme_id: 'does-not-exist' }, /not in the dictionary/],
    ['a cleared kind', { kind: null }, /kind/],
    ['a cleared text', { kbp_text: '  ' }, /text is empty/],
  ])('refuses %s on an approved word, through update and updateMany', async (_label, patch, message) => {
    await expect(update('approved', patch)).rejects.toThrow(message)
    await expect(updateMany(['approved'], patch)).rejects.toThrow(message)
    expect(db.written).toEqual([])
  })

  it('refuses a word without a lexeme id, or with a homograph number the dictionary lacks', async () => {
    await expect(update('word', { status: 'approved', lexeme_id: null })).rejects.toThrow(/needs a lexeme id/)
    await expect(update('word', { status: 'approved', lexeme_id: 'keɖe#3' })).rejects.toThrow(/not in the dictionary/)
    expect(db.written).toEqual([])
  })

  it('writes nothing when one row of a bulk approval is refused', async () => {
    db.tables.audios.push(audio({ id: 'empty', kind: 'sentence' }))
    await expect(updateMany(['sentence', 'empty'], { status: 'approved' })).rejects.toThrow(
      /audio empty: .*text is empty/
    )
    expect(db.written).toEqual([])
  })

  it('approves a valid word', async () => {
    await update('word', { status: 'approved' })
    expect(writtenFor('word')).toEqual({ status: 'approved', kbp_key: 'keɖe' })
  })
})

describe('approval refuses a second recording for the same app lookup', () => {
  it('refuses a word with the same lexeme id and key as an approved word, naming it', async () => {
    await expect(update('word', { status: 'approved', lexeme_id: 'keɖe#2' })).rejects.toThrow(/"audio approved"/)
    expect(db.written).toEqual([])
  })

  it('allows the same lexeme with another displayed form', async () => {
    db.tables.audios.push(
      audio({ id: 'form-1', kind: 'word', kbp_text: 'caɣʋ', kbp_key: 'caɣʋ', lexeme_id: 'caɣʋ', status: 'approved' }),
      audio({ id: 'form-2', kind: 'word', kbp_text: 'ɛcaɣ', lexeme_id: 'caɣʋ' })
    )
    await update('form-2', { status: 'approved' })
    expect(writtenFor('form-2')).toMatchObject({ status: 'approved', kbp_key: 'ɛcaɣ' })
  })

  it('refuses a sentence with the same key as an approved sentence', async () => {
    db.tables.audios.push(
      audio({ id: 'said', kind: 'sentence', kbp_text: 'Lɩm keɖe.', kbp_key: 'lɩm keɖe', status: 'approved' })
    )
    await expect(update('sentence', { status: 'approved' })).rejects.toThrow(/"audio said"/)
  })

  it('refuses two recordings of the same lookup approved in one bulk action', async () => {
    db.tables.audios.push(audio({ id: 'twin', kind: 'sentence', kbp_text: 'lɩm  keɖe' }))
    await expect(updateMany(['sentence', 'twin'], { status: 'approved' })).rejects.toThrow(/already covers/)
    expect(db.written).toEqual([])
  })
})

describe('a patch cannot change the row it is checked as', () => {
  it('keeps the stored id, so a patched id cannot hide the duplicate it names', async () => {
    const patch = { id: 'approved', status: 'approved', lexeme_id: 'keɖe#2' }
    await expect(update('word', patch)).rejects.toThrow(/"audio approved"/)
    await expect(updateMany(['word'], patch)).rejects.toThrow(/"audio approved"/)
    expect(db.written).toEqual([])
  })
})

describe('write failures', () => {
  // ra-supabase throws an HttpError whose body is the PostgREST error.
  const postgresError = (code: string) => Object.assign(new Error('violates constraint'), { body: { code } })

  it.each([
    ['23505', 'Another approved recording already covers this word/form.'],
    ['23514', 'Approved recordings need kind, text and, for a word, a lexeme.'],
  ])('turns Postgres %s into an admin message', async (code, message) => {
    db.failOn = { id: 'word', error: postgresError(code) }
    await expect(update('word', { status: 'approved' })).rejects.toThrow(message)
  })

  it('names the saved and unsaved rows when a bulk write fails part-way', async () => {
    db.failOn = { id: 'word', error: postgresError('23505') }
    const result = updateMany(['sentence', 'word', 'stale'], { status: 'rejected' })
    await expect(result).rejects.toThrow(
      'Stopped at "audio word": Another approved recording already covers this word/form. ' +
        'Saved: "audio sentence". Not saved: "audio word", "audio stale".'
    )
    expect(db.written.map((write) => write.id)).toEqual(['sentence'])
  })
})

describe('round 3 review fixes', () => {
  const clean = audio({ id: 'clean', kind: 'word', kbp_text: 'keɖe', kbp_key: 'keɖe', lexeme_id: 'keɖe#1' })

  it('sets an approved row back to pending when its file is replaced', async () => {
    await update('approved', { storage_path: 'new.wav', status: 'approved' })
    expect(writtenFor('approved')).toMatchObject({ storage_path: 'new.wav', status: 'pending' })
    db.written = []
    await updateMany(['approved'], { storage_path: 'other.wav' })
    expect(writtenFor('approved')).toMatchObject({ status: 'pending' })
  })

  it('sends only the status on Approve when the stored text fields are already normal', async () => {
    db.tables.audios.push(clean)
    await update('clean', { status: 'approved' })
    expect(writtenFor('clean')).toEqual({ status: 'approved' })
    db.written = []
    await updateMany(['clean'], { status: 'approved' })
    expect(writtenFor('clean')).toEqual({ status: 'approved' })
  })

  it('matches an NFD lexeme id against the NFC dictionary and stores it NFC', async () => {
    db.tables.dictionary_entries.push(entry('ñɩnɖʋ', null))
    db.tables.audios.push(audio({ id: 'nfd', kind: 'word', kbp_text: 'ñɩnɖʋ', lexeme_id: 'ñɩnɖʋ'.normalize('NFD') }))
    await update('nfd', { status: 'approved' })
    expect(writtenFor('nfd')?.lexeme_id).toBe('ñɩnɖʋ'.normalize('NFC'))
  })

  it('refuses to approve a TTS recording', async () => {
    await expect(update('word', { status: 'approved', source: 'tts' })).rejects.toThrow(/TTS/)
    await expect(updateMany(['word'], { status: 'approved', source: 'tts' })).rejects.toThrow(/TTS/)
  })

  it('ignores an approved TTS row in the duplicate check', async () => {
    db.tables.audios.push(
      audio({ id: 'synthetic', kind: 'word', kbp_key: 'keɖe', lexeme_id: 'keɖe#1', source: 'tts', status: 'approved' })
    )
    await update('word', { status: 'approved' })
    expect(writtenFor('word')).toMatchObject({ status: 'approved' })
  })

  it('keeps the HTTP status of a refused write, so a 401 reaches the auth provider', async () => {
    db.failOn = { id: 'word', error: Object.assign(new Error('JWT expired'), { status: 401 }) }
    await expect(update('word', { name: 'x' })).rejects.toMatchObject({ status: 401, message: 'JWT expired' })
    await expect(updateMany(['word'], { name: 'x' })).rejects.toMatchObject({ status: 401 })
  })

  it('refuses a bulk update naming ids it cannot find, and saves nothing', async () => {
    await expect(updateMany(['word', 'ghost'], { status: 'rejected' })).rejects.toThrow(/ghost/)
    expect(db.written).toEqual([])
  })

  it('normalises and validates a create', async () => {
    await dataProvider.create('audios', {
      data: { name: 'n', kind: 'sentence', kbp_text: ' Páná! ', lexeme_id: 'keɖe#1', kbp_key: 'forged' },
    })
    expect(writtenFor('new')).toMatchObject({ kbp_text: 'Páná!', kbp_key: 'pana', lexeme_id: null })
    await expect(
      dataProvider.create('audios', { data: { kind: 'word', kbp_text: 'keɖe', status: 'approved' } })
    ).rejects.toThrow(/needs a lexeme id/)
  })
})
