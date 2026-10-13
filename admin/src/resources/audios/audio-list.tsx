import { useState } from 'react'
import {
  BulkDeleteButton,
  Button,
  Confirm,
  CreateButton,
  Datagrid,
  DeleteButton,
  EditButton,
  ExportButton,
  FunctionField,
  List,
  SelectInput,
  ShowButton,
  TextField,
  TopToolbar,
  useListContext,
  useNotify,
  useRefresh,
  useUpdateMany,
} from 'react-admin'

import { ApproveButton, AudioSourceField, AudioStatusField, RejectButton, STATUS_CHOICES } from './audio-review-actions'
import { AudioSearchFilter } from './audio-search-filter'
import { ReviewedSelection, useReviewedSelection } from './reviewed-selection'

const deleteConfirmTitle = 'Delete this audio?'
const deleteConfirmContent = 'This will permanently remove the audio from storage. This action cannot be undone.'

const AudioListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

// No default value: filtering on status before the review migration would fail the list query.
const audioFilters = [
  <AudioSearchFilter key="search" />,
  <SelectInput key="status" source="status" label="Status" choices={STATUS_CHOICES} />,
]

/**
 * Approve the selected rows. Each row is approved only while it still holds what the
 * reviewer saw when selecting it (file, kind, text, key, lexeme, source): the data
 * provider checks the snapshots passed in `meta`. On failure some rows may be saved
 * already (the message says which), so the list reloads.
 */
const BulkApproveButton = () => {
  const { selectedIds, onUnselectItems } = useListContext()
  const snapshots = useReviewedSelection()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [updateMany, { isPending }] = useUpdateMany()

  const approve = async () => {
    setOpen(false)
    const unseen = selectedIds.filter((id) => !snapshots[String(id)])
    if (unseen.length) {
      notify(`Select these rows again before approving: ${unseen.join(', ')}. Nothing was saved.`, { type: 'error' })
      return
    }
    const reviewed = Object.fromEntries(selectedIds.map((id) => [id, snapshots[String(id)]]))
    try {
      await updateMany(
        'audios',
        { ids: selectedIds, data: { status: 'approved' }, meta: { reviewed } },
        { returnPromise: true }
      )
      notify(`${selectedIds.length} audio(s) approved`)
      onUnselectItems()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Update failed', { type: 'error' })
    } finally {
      refresh()
    }
  }

  return (
    <>
      <Button label="Approve" onClick={() => setOpen(true)} disabled={isPending} />
      <Confirm
        isOpen={open}
        title="Approve the selected audios?"
        content="The app will play them for learners."
        onConfirm={approve}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

const AudioBulkActions = () => (
  <>
    <BulkApproveButton />
    <BulkDeleteButton
      mutationMode="pessimistic"
      confirmTitle={deleteConfirmTitle}
      confirmContent={deleteConfirmContent}
      confirmColor="warning"
    />
  </>
)

export const AudioList = () => (
  <List actions={<AudioListActions />} filters={audioFilters}>
    <ReviewedSelection>
      <Datagrid rowClick="edit" bulkActionButtons={<AudioBulkActions />}>
        <TextField source="name" />
        <FunctionField label="Status" render={() => <AudioStatusField />} />
        <TextField source="kind" />
        <TextField source="kbp_text" label="Kabiyè text" />
        <FunctionField label="Source" render={() => <AudioSourceField />} />
        <TextField source="tags" />
        <TextField source="description" />
        <TextField source="storage_path" label="Path" />
        <ApproveButton />
        <RejectButton />
        <ShowButton />
        <EditButton />
        <DeleteButton
          mutationMode="pessimistic"
          confirmTitle={deleteConfirmTitle}
          confirmContent={deleteConfirmContent}
          confirmColor="warning"
        />
      </Datagrid>
    </ReviewedSelection>
  </List>
)
