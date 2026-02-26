import { useGetIdentity, useLogout } from 'ra-core'

import { Button } from '@/components/ui/button'

export default function UserNav() {
  const { data: identity } = useGetIdentity()
  const logout = useLogout()

  return (
    <div className="flex items-center gap-4">
      {identity?.fullName && (
        <span className="text-muted-foreground text-sm">{identity.fullName}</span>
      )}
      <Button variant="outline" size="sm" onClick={() => logout()}>
        Log out
      </Button>
    </div>
  )
}
