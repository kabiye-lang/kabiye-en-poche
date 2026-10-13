import {
  BulkDeleteButton,
  BulkUpdateButton,
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
} from 'react-admin'

import { ApproveButton, AudioSourceField, AudioStatusField, RejectButton, STATUS_CHOICES } from './audio-review-actions'
import { AudioSearchFilter } from './audio-search-filter'

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

const AudioBulkActions = () => (
  <>
    <BulkUpdateButton label="Approve" data={{ status: 'approved' }} mutationMode="pessimistic" />
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
  </List>
)
