import { supabaseAuthProvider } from 'ra-supabase'

import { supabase } from './supabase'

/**
 * Auth provider using Supabase Auth.
 *
 * For admin access, set app_metadata.user_role = 'ADMIN' on the user in Supabase Auth
 * (Dashboard → Authentication → Users → select user → Edit user → Raw user meta → add user_role).
 */
export const authProvider = supabaseAuthProvider(supabase, {
  getIdentity: async (user) => {
    return {
      id: user.id,
      fullName: user.email ?? 'Admin',
    }
  },
  getPermissions: async (user) => {
    if (!user) {
      throw new Error()
    }
    return user.app_metadata
  },
})
