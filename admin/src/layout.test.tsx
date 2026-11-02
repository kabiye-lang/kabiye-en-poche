// @vitest-environment jsdom
import type { AuthProvider, DataProvider } from 'react-admin'

import { act } from 'react'
import { Admin, memoryStore, Resource, useAuthenticated } from 'react-admin'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { QueryClient } from '@tanstack/react-query'
import polyglotI18nProvider from 'ra-i18n-polyglot'
import englishMessages from 'ra-language-english'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/header', () => ({ default: () => null }))

const { default: Layout } = await import('./layout')

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom does not implement scrolling, which react-admin calls on navigation.
window.scrollTo = () => {}

let root: ReturnType<typeof createRoot> | null = null

afterEach(async () => {
  await act(async () => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

// Like the real dashboard: a page that runs react-admin's sign-in check.
const Dashboard = () => {
  useAuthenticated()
  return <p>dashboard</p>
}

// ra-supabase's authProvider, reduced to what the layout and the dashboard call.
// getPermissions resolves undefined without a user, as ra-supabase does.
function fakeAuth(
  user: { app_metadata: Record<string, unknown> } | null,
  lookup: 'ok' | 'throws' | 'empty' = 'ok'
) {
  return {
    login: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    checkAuth: vi.fn(async () => (user ? undefined : Promise.reject(new Error('signed out')))),
    checkError: vi.fn(async () => {}),
    getPermissions: vi.fn(async () => {
      if (lookup === 'throws') throw new Error('network')
      // ra-supabase returns nothing when auth.getUser() fails, even with a cached session.
      if (lookup === 'empty') return undefined
      return user?.app_metadata
    }),
  } satisfies AuthProvider
}

// Like a real list page (ListBase): it runs the sign-in check when it mounts.
const UnitList = () => {
  useAuthenticated()
  return <p>unit list</p>
}

async function renderAdmin(authProvider: AuthProvider, path = '/') {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root?.render(
      <MemoryRouter initialEntries={[path]}>
        <Admin
          dataProvider={{} as DataProvider}
          authProvider={authProvider}
          layout={Layout}
          dashboard={Dashboard}
          loginPage={() => <p>login page</p>}
          queryClient={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
          store={memoryStore()}
          i18nProvider={polyglotI18nProvider(() => englishMessages, 'en')}
        >
          <Resource name="units" list={UnitList} />
        </Admin>
      </MemoryRouter>
    )
  )
}

async function waitForText(text: string) {
  for (let i = 0; i < 200; i++) {
    if (document.body.textContent?.includes(text)) return
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  }
  throw new Error(`Timed out waiting for "${text}". Page: "${document.body.textContent}"`)
}

describe('Layout role check', () => {
  // Production showed a blank page here: the layout waited for a role that a
  // signed-out visitor never gets, so no page ran the sign-in check.
  it('sends a signed-out visitor to the login page', async () => {
    await renderAdmin(fakeAuth(null))
    await waitForText('login page')
  })

  // The page's own sign-in check refetched on mount, so the layout flipped between
  // the page and nothing and the redirect never ran.
  it('sends a signed-out visitor on a list page to the login page', async () => {
    await renderAdmin(fakeAuth(null), '/units')
    await waitForText('login page')
  })

  it('shows the page to an ADMIN', async () => {
    const auth = fakeAuth({ app_metadata: { user_role: 'ADMIN' } })
    await renderAdmin(auth)
    await waitForText('dashboard')
    expect(auth.logout).not.toHaveBeenCalled()
  })

  it('signs out a signed-in user without the ADMIN role and never shows the page', async () => {
    const auth = fakeAuth({ app_metadata: { provider: 'email' } })
    await renderAdmin(auth)
    await waitForText('login page')
    expect(auth.logout).toHaveBeenCalled()
    expect(document.body.textContent).not.toContain('dashboard')
  })

  it('shows an error, not the page, when the role lookup fails', async () => {
    await renderAdmin(fakeAuth({ app_metadata: { user_role: 'ADMIN' } }, 'throws'))
    await waitForText('Could not check your access')
    expect(document.body.textContent).not.toContain('dashboard')
  })

  it('shows an error, not the page, when a signed-in user gets no role result', async () => {
    await renderAdmin(fakeAuth({ app_metadata: { user_role: 'ADMIN' } }, 'empty'))
    await waitForText('Could not check your access')
    expect(document.body.textContent).not.toContain('dashboard')
  })
})
