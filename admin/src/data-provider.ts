import { supabaseDataProvider } from 'ra-supabase'
import type { DataProvider } from 'react-admin'

import { deleteAudioFromStorage } from '@/lib/audio-upload'

import { supabase } from './supabase'

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseClient: supabase,
})

export const dataProvider: DataProvider = {
  ...baseDataProvider,
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
      const { data: rows } = await supabase
        .from('audios')
        .select('storage_path')
        .in('id', params.ids)
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
