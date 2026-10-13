import type { AudioStatus } from '@/lib/audio-review'

import { Button, useNotify, useRecordContext, useRefresh, useUpdate } from 'react-admin'

const STATUS_CLASS: Record<AudioStatus, string> = {
  pending: 'bg-slate-100 text-slate-700',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export const STATUS_CHOICES = [
  { id: 'pending', name: 'Pending' },
  { id: 'approved', name: 'Approved' },
  { id: 'rejected', name: 'Rejected' },
]

export const AudioStatusField = () => {
  const record = useRecordContext()
  const status = record?.status as AudioStatus | undefined
  if (!status) return null
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[status] ?? ''}`}>{status}</span>
}

/** Synthetic recordings are never played by the app, so they stand out in the list. */
export const AudioSourceField = () => {
  const record = useRecordContext()
  if (record?.source === 'tts') {
    return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">TTS (synthetic)</span>
  }
  return record?.source ? <span className="text-xs">native</span> : null
}

const ReviewButton = ({ status, label }: { status: AudioStatus; label: string }) => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [update, { isPending }] = useUpdate()
  if (!record || record.status === status) return null

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // The data provider refuses an approval that breaks the rule, and its message lands here.
    try {
      await update('audios', { id: record.id, data: { status }, previousData: record }, { returnPromise: true })
      notify(`Audio ${status}`)
      refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed', { type: 'error' })
    }
  }

  return <Button label={label} onClick={handleClick} disabled={isPending} />
}

export const ApproveButton = () => <ReviewButton status="approved" label="Approve" />
export const RejectButton = () => <ReviewButton status="rejected" label="Reject" />
