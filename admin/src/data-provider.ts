import type { DataProvider, Identifier, RaRecord } from 'react-admin'

import { supabaseDataProvider } from 'ra-supabase'

import { checkApproval, duplicateMessage, normaliseAudio, sameLookup } from '@/lib/audio-review'
import { deleteAudioFromStorage } from '@/lib/audio-upload'

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
    return baseDataProvider.create(resource, { ...params, data })
  },
  update: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.update(resource, params)
    const [stored] = await storedAudios([params.id])
    if (!stored) throw new Error('Audio not found')
    const [data] = await auditedAudioWrites([stored], params.data)
    return baseDataProvider.update(resource, { ...params, data, previousData: stored })
  },
  updateMany: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.updateMany(resource, params)
    const rows = await storedAudios(params.ids)
    // Every row is checked before the first write, so a refused bulk approval writes nothing.
    const writes = await auditedAudioWrites(rows, params.data)
    for (const [i, row] of rows.entries()) {
      await baseDataProvider.update(resource, { id: row.id, data: writes[i], previousData: row })
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

/** The audios rows as stored now: '*' because the generated types do not list the review columns yet. */
async function storedAudios(ids: Identifier[]): Promise<RaRecord[]> {
  if (!ids.length) return []
  const { data, error } = await supabase.from('audios').select('*').in('id', ids.map(String))
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Audio writes go through here on every path. The patch is merged onto each stored
 * row, the merged row is normalised (kbp_key derived, a sentence loses its lexeme id)
 * and, when it ends approved, validated. A caller's kbp_key is ignored.
 */
async function auditedAudioWrites(rows: Record<string, unknown>[], patch: Record<string, unknown>) {
  const merged = rows.map((row) => normaliseAudio({ ...row, ...patch }))
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
  return merged.map((row) => ({
    ...patch,
    kbp_text: row.kbp_text,
    kbp_key: row.kbp_key,
    lexeme_id: row.lexeme_id,
  }))
}
