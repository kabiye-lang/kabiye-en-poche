import { useEffect, useState } from 'react'
import { useAuthState, useLogout, usePermissions } from 'react-admin'

export type AdminAccess = 'render' | 'hide' | 'error'

/**
 * Role check for every admin page. Says whether the page may render.
 *
 * - Signed out (checkAuth fails): render, so react-admin's own sign-in check on the
 *   page sends the visitor to the login page.
 * - ADMIN: render. A background refetch keeps the last result, so the page stays.
 * - Signed in without the ADMIN role: hide, and sign the user out.
 * - Signed in with no role result: error. ra-supabase returns no permissions when
 *   auth.getUser() fails, even with a valid cached session, so this is not "signed out".
 * - Either check still running: hide.
 *
 * Set app_metadata.user_role = 'ADMIN' in Supabase Auth for admin users.
 */
export const useRequireAdmin = (): AdminAccess => {
  // false: only read the sign-in state. The page's own check does the redirect.
  const auth = useAuthState(undefined, false)
  const { permissions, isPending, isFetching, error } = usePermissions()
  const logout = useLogout()

  // The page's own sign-in check runs the same query again when it mounts, which puts it
  // back to pending. Keep the last settled result, or a signed-out visitor flips between
  // the page and nothing and never reaches the redirect.
  const settledAuth = auth.isPending ? undefined : auth.authenticated === true
  const [lastAuthenticated, setLastAuthenticated] = useState(settledAuth)
  if (settledAuth !== undefined && settledAuth !== lastAuthenticated) {
    setLastAuthenticated(settledAuth)
  }
  const authenticated = settledAuth ?? lastAuthenticated
  const isSignedOut = authenticated === false
  const isAdmin = permissions?.user_role === 'ADMIN'
  const roleSettled = !isPending && !isFetching
  const isSignedIn = authenticated === true
  const isNonAdmin = isSignedIn && roleSettled && error == null && permissions != null && !isAdmin

  useEffect(() => {
    if (isNonAdmin) {
      logout()
    }
  }, [isNonAdmin, logout])

  if (isSignedOut) return 'render'
  if (isSignedIn && isAdmin) return 'render'
  if (isSignedIn && roleSettled && (error != null || permissions == null)) return 'error'
  return 'hide'
}
