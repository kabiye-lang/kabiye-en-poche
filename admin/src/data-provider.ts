import type { DataProvider } from 'react-admin'

import { supabaseDataProvider } from 'ra-supabase'

import { checkApproval, prepareAudioWrite } from '@/lib/audio-review'
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
    const data = prepareAudioWrite(params.data)
    if (data.status === 'approved') await assertApprovable(data)
    return baseDataProvider.create(resource, { ...params, data })
  },
  update: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.update(resource, params)
    const data = prepareAudioWrite(params.data, params.previousData?.kind)
    if (data.status === 'approved') await assertApprovable({ ...params.previousData, ...data })
    return baseDataProvider.update(resource, { ...params, data })
  },
  updateMany: async (resource, params) => {
    if (resource !== 'audios') return baseDataProvider.updateMany(resource, params)
    const data = prepareAudioWrite(params.data)
    if (data.status === 'approved' && params.ids.length) {
      const { data: rows, error } = await supabase
        .from('audios')
        // '*' rather than the review columns by name: the generated types do not list them yet.
        .select('*')
        .in('id', params.ids.map(String))
      if (error) throw new Error(error.message)
      await Promise.all((rows ?? []).map((row) => assertApprovable({ ...row, ...data }, row.name)))
    }
    return baseDataProvider.updateMany(resource, { ...params, data })
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

/** Every path that approves an audio goes through here, so the rule cannot be skipped. */
async function assertApprovable(record: Record<string, unknown>, name?: string) {
  const blocker = await checkApproval(record)
  if (blocker) throw new Error(name ? `${name}: ${blocker}` : blocker)
}
