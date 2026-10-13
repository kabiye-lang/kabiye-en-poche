import type { RaRecord } from 'react-admin'

import { createContext, useContext, useEffect, useState } from 'react'
import { useListContext } from 'react-admin'

const ReviewedSelectionContext = createContext<Record<string, RaRecord>>({})

/**
 * Keeps each selected row as it looked when it was selected, keyed by id. Selections
 * survive pagination but the list data holds only the current page, so bulk approve
 * reads the snapshots from here. Deselected rows are pruned.
 */
export function ReviewedSelection({ children }: { children: React.ReactNode }) {
  const { selectedIds, data } = useListContext()
  const [snapshots, setSnapshots] = useState<Record<string, RaRecord>>({})

  useEffect(() => {
    setSnapshots((current) => {
      const selected = new Set(selectedIds.map(String))
      const next: Record<string, RaRecord> = {}
      for (const id of selected) {
        const shown = current[id] ?? data?.find((record) => String(record.id) === id)
        if (shown) next[id] = shown
      }
      const same =
        Object.keys(next).length === Object.keys(current).length &&
        Object.entries(next).every(([id, record]) => current[id] === record)
      return same ? current : next
    })
  }, [selectedIds, data])

  return <ReviewedSelectionContext.Provider value={snapshots}>{children}</ReviewedSelectionContext.Provider>
}

export const useReviewedSelection = () => useContext(ReviewedSelectionContext)
