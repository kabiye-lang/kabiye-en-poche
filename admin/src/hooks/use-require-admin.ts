import { useEffect } from 'react'
import { useLogout, usePermissions } from 'react-admin'

/**
 * Custom hook that ensures the user has ADMIN role.
 * If the user is not an admin, it will automatically log them out.
 *
 * Set app_metadata.user_role = 'ADMIN' in Supabase Auth for admin users.
 */
export const useRequireAdmin = (): boolean => {
  const { permissions } = usePermissions()
  const logout = useLogout()

  useEffect(() => {
    if (permissions && permissions.user_role !== 'ADMIN') {
      logout()
    }
  }, [permissions, logout])

  return permissions?.user_role === 'ADMIN'
}
