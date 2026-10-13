import type { SupabaseClient } from '@supabase/supabase-js'
import type { DataProvider, Identifier, RaRecord, UpdateResult } from 'react-admin'

import { HttpError } from 'react-admin'

import { supabaseDataProvider } from 'ra-supabase'

import { checkApproval, duplicateMessage, normaliseAudio, sameLookup } from '@/lib/audio-review'
import { deleteAudioFromStorage } from '@/lib/audio-upload'
import { readFailure } from '@/lib/read-failure'

import { supabase } from './supabase'

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
})

export const dataProvider: DataProvider = {
  ...baseDataProvider,
  create: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.create(resource, params)
    const [data] = await auditedAudioWrites([{ status: 'pending' }], params.data)
    return baseDataProvider.create(resource, { ...params, data }).catch((err) => rethrowReadable(err))
  },
  update: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.update(resource, params)
    const [stored] = await storedAudios([params.id])
    if (!stored) throw new Error('Audio not found')
    const reviewed = reviewedSnapshot(params.previousData)
    const approving = wantsApproved(params.data, stored)
    if (approving && !matchesReviewed(stored, reviewed)) throw new Error(CHANGED_SINCE_OPENED)
    // Only what the editor changed: resending what they merely saw could undo someone else's edit.
    const [data] = await auditedAudioWrites([stored], changedFields(params.data, params.previousData))
    if (!Object.keys(data).length) return { data: stored } as UpdateResult
    return { data: await writeAudio(stored.id, data, approving ? reviewed : undefined) } as UpdateResult
  },
  updateMany: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.updateMany(resource, params)
    const rows = await storedAudios(params.ids)
    const missing = params.ids.filter((id) => !rows.some((row) => String(row.id) === String(id)))
    if (missing.length) throw new Error(`Audio not found: ${missing.join(', ')}. Nothing was saved.`)
    const names = (part: RaRecord[]) => part.map((r) => `"${r.name ?? r.id}"`).join(', ') || 'none'
    // What the reviewer saw of each row, from the list they selected in: { [id]: record }.
    const seen: Record<string, Record<string, unknown> | undefined> = params.meta?.reviewed ?? {}
    const reviewed = rows.map((row) => reviewedSnapshot(seen[String(row.id)]))
    const approving = rows.map((row) => wantsApproved(params.data, row))
    const changed = rows.filter((row, i) => approving[i] && !matchesReviewed(row, reviewed[i]))
    if (changed.length) {
      throw new Error(`Not approved: ${names(changed)}. ${CHANGED_SINCE_OPENED} Nothing was saved.`)
    }
    // Every row is checked before the first write, so a refused bulk approval writes nothing.
    const writes = await auditedAudioWrites(rows, params.data)
    // One write per row, so a failure part-way leaves earlier rows saved: say which.
    for (const [i, row] of rows.entries()) {
      try {
        await writeAudio(row.id, writes[i], approving[i] ? reviewed[i] : undefined)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        rethrowReadable(
          err,
          `Stopped at ${names([row])}: ${message} Saved: ${names(rows.slice(0, i))}. Not saved: ${names(rows.slice(i))}.`
        )
      }
    }
    return { data: rows.map((row) => row.id) }
  },
  delete: async (resource, params) => {
    if (resource === 'audios' && params.previousData?.storage_path) {
      try {
        await deleteAudioFromStorage(params.previousData.storage_path)
      } catch (err) {
        console.error('Failed to delete audio from storage:', err)
        throw err
      }
    }
    return baseDataProvider.delete(resource, params)
  },
  deleteMany: async (resource, params) => {
    if (resource === 'audios' && params.ids?.length) {
      const ids = params.ids.map(String)
      const { data: rows } = await supabase.from('audios').select('storage_path').in('id', ids)
      const paths = (rows ?? []).map((r) => r.storage_path).filter(Boolean)
      for (const path of paths) {
        try {
          await deleteAudioFromStorage(path)
        } catch (err) {
          console.error('Failed to delete audio from storage:', err)
          throw err
        }
      }
    }
    return baseDataProvider.deleteMany(resource, params)
  },
}

export const CHANGED_SINCE_OPENED = 'This recording changed since you opened it. Reload and review it again.'

// The generated types do not list the review columns yet, so audio reads and writes use the
// client untyped.
const audiosTable = () => (supabase as unknown as SupabaseClient).from('audios')

/** The audios rows as stored now. */
async function storedAudios(ids: Identifier[]): Promise<RaRecord[]> {
  if (!ids.length) return []
  const { data, error, status } = await audiosTable().select('*').in('id', ids.map(String))
  if (error) throw readFailure(error, status)
  return data ?? []
}

/** The columns a reviewer approves: the file and what it is said to be. */
const REVIEWED_COLUMNS = ['storage_path', 'kind', 'kbp_text', 'kbp_key', 'lexeme_id', 'source'] as const
type Reviewed = Record<(typeof REVIEWED_COLUMNS)[number], unknown>

/** What the reviewer saw of the reviewed columns. A column they did not see counts as null. */
function reviewedSnapshot(seen: Record<string, unknown> | undefined): Reviewed {
  return Object.fromEntries(REVIEWED_COLUMNS.map((column) => [column, seen?.[column] ?? null])) as Reviewed
}

function matchesReviewed(stored: Record<string, unknown>, reviewed: Reviewed): boolean {
  return REVIEWED_COLUMNS.every((column) => (stored[column] ?? null) === reviewed[column])
}

/** True when the write sets status 'approved', or leaves an approved row approved. */
function wantsApproved(patch: Record<string, unknown>, stored: RaRecord): boolean {
  return (patch.status ?? stored.status) === 'approved'
}

/** The fields of `data` that differ from what the editor opened. The id never moves. */
function changedFields(data: Record<string, unknown>, opened: Record<string, unknown> | undefined) {
  const { id: _id, ...fields } = data
  if (!opened) return fields
  return Object.fromEntries(
    Object.entries(fields).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(opened[key]))
  )
}

/**
 * Write one audio row. With `reviewed`, the UPDATE only matches while the row still holds
 * what the reviewer saw, so a change made after the checks is never approved.
 */
async function writeAudio(id: Identifier, data: Record<string, unknown>, reviewed?: Reviewed) {
  let query = audiosTable().update(data).eq('id', String(id))
  for (const column of reviewed ? REVIEWED_COLUMNS : []) {
    const value = reviewed?.[column]
    query = value === null ? query.is(column, null) : query.eq(column, value)
  }
  const { data: rows, error, status } = await query.select()
  if (error) throw new HttpError(readableWriteError(error), status, error)
  if (!rows?.length) throw new Error(reviewed ? CHANGED_SINCE_OPENED : 'Audio not found')
  return rows[0] as RaRecord
}

const DERIVED_COLUMNS = ['kbp_text', 'kbp_key', 'lexeme_id'] as const

/**
 * Audio writes go through here on every path. The patch is merged onto each stored
 * row, the merged row is normalised (kbp_key derived, a sentence loses its lexeme id)
 * and, when it ends approved, validated. A caller's kbp_key is ignored.
 */
async function auditedAudioWrites(rows: Record<string, unknown>[], rawPatch: Record<string, unknown>) {
  // A patch never moves a row: the stored id is kept, so duplicate checks exclude the right row.
  const { id: _patchId, kbp_key: _callerKey, ...patch } = rawPatch
  const merged = rows.map((row) => {
    const next = normaliseAudio({ ...row, ...patch, id: row.id })
    // A new file is an unreviewed recording, whatever status the patch asks for.
    if ('storage_path' in patch && patch.storage_path !== row.storage_path) next.status = 'pending'
    return next
  })
  const approved = merged.filter((row) => row.status === 'approved')
  for (const [i, row] of approved.entries()) {
    const twin = approved.slice(0, i).find((other) => sameLookup(other, row))
    if (twin) throw new Error(duplicateMessage(twin.name, row))
  }
  const blockers = await Promise.all(approved.map((row) => checkApproval(row)))
  const blocked = blockers.findIndex(Boolean)
  if (blocked >= 0) {
    const name = approved[blocked].name
    throw new Error(name ? `${String(name)}: ${blockers[blocked]}` : String(blockers[blocked]))
  }
  // Send the derived columns only when the patch is about them or normalisation changes
  // them: re-sending values read earlier could undo another admin's edit.
  const touchesText = ['kbp_text', 'kind', 'lexeme_id'].some((column) => column in patch)
  return merged.map((row, i) => {
    const write: Record<string, unknown> = { ...patch }
    if (row.status !== (patch.status ?? rows[i].status)) write.status = row.status
    for (const column of DERIVED_COLUMNS) {
      if (touchesText || row[column] !== (rows[i][column] ?? null)) write[column] = row[column]
    }
    return write
  })
}

/**
 * The admin message for a failed write. The database refuses an invalid approved row
 * on its own (23505 unique, 23514 check), so a write that slipped past the checks above
 * still gets a plain explanation. ra-supabase puts the Postgres error in `body`;
 * a Supabase client error carries `code` itself.
 */
function readableWriteError(err: unknown): string {
  const error = err as { message?: string; code?: string; body?: { code?: string } } | undefined
  const code = error?.body?.code ?? error?.code
  if (code === '23505') return 'Another approved recording already covers this word/form.'
  if (code === '23514') return 'Approved recordings need kind, text and, for a word, a lexeme.'
  return error?.message || 'Update failed.'
}

/** Rethrow with the admin message, keeping the HTTP status so a 401/403 still reaches the auth provider. */
function rethrowReadable(err: unknown, message = readableWriteError(err)): never {
  const { status, body } = (err ?? {}) as { status?: number; body?: unknown }
  throw typeof status === 'number' ? new HttpError(message, status, body) : new Error(message)
}
