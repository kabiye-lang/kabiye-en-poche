// @vitest-environment jsdom
import type { DataProvider, RaRecord } from 'react-admin'

import { act } from 'react'
import { Admin, memoryStore, Resource } from 'react-admin'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

import { QueryClient } from '@tanstack/react-query'
import polyglotI18nProvider from 'ra-i18n-polyglot'
import englishMessages from 'ra-language-english'
import { afterEach, describe, expect, it, vi } from 'vitest'

// The form's own pre-checks query Supabase: every query finds nothing.
vi.mock('@/supabase', () => {
  const empty = { data: [], error: null, status: 200 }
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'neq', 'is', 'in', 'filter', 'ilike', 'order', 'limit']) {
    builder[method] = () => builder
  }
  builder.then = (resolve: (value: typeof empty) => unknown) => resolve(empty)
  return {
    supabase: {
      from: () => builder,
      storage: { from: () => ({ getPublicUrl: (path: string) => ({ data: { publicUrl: `https://files/${path}` } }) }) },
    },
  }
})

const { AudioEdit } = await import('./audio-edit')
const { AudioList } = await import('./audio-list')

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// jsdom does not implement scrolling, which react-admin calls on navigation.
window.scrollTo = () => {}

const audio = (row: RaRecord): RaRecord => ({
  name: `audio ${row.id}`,
  tags: ['test'],
  description: null,
  kind: 'sentence',
  kbp_text: 'Lɩm keɖe.',
  kbp_key: 'lɩm keɖe',
  lexeme_id: null,
  source: 'native',
  status: 'pending',
  storage_path: `${row.id}.wav`,
  ...row,
})

let root: ReturnType<typeof createRoot> | null = null

afterEach(async () => {
  await act(async () => root?.unmount())
  root = null
  document.body.innerHTML = ''
})

// The fakes implement only the methods each screen calls.
async function renderAdmin(path: string, dataProvider: object, queryClient = new QueryClient()) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root?.render(
      <MemoryRouter initialEntries={[path]}>
        <Admin
          dataProvider={dataProvider as DataProvider}
          queryClient={queryClient}
          store={memoryStore()}
          i18nProvider={polyglotI18nProvider(() => englishMessages, 'en')}
        >
          <Resource name="audios" list={AudioList} edit={AudioEdit} />
        </Admin>
      </MemoryRouter>
    )
  )
  return queryClient
}

async function waitFor<T>(find: () => T | null | undefined | false, what: string): Promise<T> {
  for (let i = 0; i < 200; i++) {
    const found = find()
    if (found) return found
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  }
  throw new Error(`Timed out waiting for ${what}`)
}

const byText = (selector: string, text: string, scope: ParentNode = document) =>
  [...scope.querySelectorAll<HTMLElement>(selector)].find((el) => el.textContent?.trim() === text)

async function click(element: HTMLElement) {
  await act(async () => element.click())
}

async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

describe('audio edit form', () => {
  it('resets an approved draft when a refetch shows a replaced file, so saving a name cannot approve it', async () => {
    const opened = audio({ id: 'a1', status: 'approved', storage_path: 'a.wav' })
    // Another admin replaced the file meanwhile: the row is pending again with b.wav.
    const replaced = audio({ id: 'a1', status: 'pending', storage_path: 'b.wav' })
    let current = opened
    const update = vi.fn(async (_resource: string, params: { id: unknown; data: RaRecord }) => ({
      data: { ...current, ...params.data },
    }))
    const queryClient = await renderAdmin('/audios/a1', {
      getOne: async () => ({ data: current }),
      update,
      getList: async () => ({ data: [], total: 0 }),
    })
    await waitFor(() => byText('label', 'Name *'), 'the edit form')

    current = replaced
    await act(async () => queryClient.invalidateQueries())
    await waitFor(() => document.querySelector('audio[src$="b.wav"]'), 'the refetched file')

    const nameLabel = byText('label', 'Name *')
    await type(nameLabel?.parentElement?.querySelector('input') as HTMLInputElement, 'renamed')
    await click(byText('button', 'Save') as HTMLElement)
    await waitFor(() => update.mock.calls.length > 0, 'the update call')

    const [, params] = update.mock.calls[0] as unknown as [string, { data: RaRecord; previousData: RaRecord }]
    expect(params.data.status).toBe('pending')
    expect(params.previousData.storage_path).toBe('b.wav')
    expect(document.body.textContent).toContain('This recording changed since you opened it')
  })

  it('confirms a save in words, not as a raw plural template', async () => {
    const row = audio({ id: 'a2' })
    const update = vi.fn(async (_resource: string, params: { data: RaRecord }) => ({ data: { ...row, ...params.data } }))
    await renderAdmin('/audios/a2', {
      getOne: async () => ({ data: row }),
      update,
      getList: async () => ({ data: [], total: 0 }),
    })
    await waitFor(() => byText('label', 'Name *'), 'the edit form')
    await click(byText('button', 'Save') as HTMLElement)
    await waitFor(() => document.body.textContent?.includes('Element updated'), 'the saved toast')

    expect(document.body.textContent).not.toContain('smart_count')
    expect(document.body.textContent).not.toContain('||||')
  })
})

describe('audio list bulk approve', () => {
  it('sends a reviewed snapshot for a row selected on another page', async () => {
    const rows = [audio({ id: 'p1' }), audio({ id: 'p2' })]
    const updateMany = vi.fn(async (_resource: string, params: { ids: unknown[] }) => ({ data: params.ids }))
    await renderAdmin('/audios?page=1&perPage=1', {
      getList: async (_resource: string, params: { pagination?: { page: number } }) => {
        const page = params.pagination?.page ?? 1
        return { data: rows.slice(page - 1, page), total: rows.length }
      },
      updateMany,
    })

    const rowCheckbox = (id: string) =>
      [...document.querySelectorAll('tbody tr')]
        .find((tr) => tr.textContent?.includes(`${id}.wav`))
        ?.querySelector<HTMLInputElement>('input[type="checkbox"]')
    await click(await waitFor(() => rowCheckbox('p1'), 'row p1'))
    await click(await waitFor(() => document.querySelector<HTMLElement>('[aria-label="Go to page 2"]'), 'page 2'))
    await click(await waitFor(() => rowCheckbox('p2'), 'row p2'))

    const toolbar = await waitFor(() => document.querySelector('[data-test="bulk-actions-toolbar"]'), 'the toolbar')
    await click(byText('button', 'Approve', toolbar) as HTMLElement)
    await click(await waitFor(() => byText('button', 'Confirm'), 'the confirm dialog'))
    await waitFor(() => updateMany.mock.calls.length > 0, 'the updateMany call')

    const [, params] = updateMany.mock.calls[0] as unknown as [string, { ids: unknown[]; meta: { reviewed: object } }]
    expect(params.ids).toEqual(['p1', 'p2'])
    expect(Object.keys(params.meta.reviewed).sort()).toEqual(['p1', 'p2'])
  })
})
