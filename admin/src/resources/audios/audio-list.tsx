import {
  BulkDeleteButton,
  CreateButton,
  Datagrid,
  DeleteButton,
  EditButton,
  ExportButton,
  List,
  ShowButton,
  TextField,
  TopToolbar,
} from 'react-admin'

import { AudioSearchFilter } from './audio-search-filter'

const deleteConfirmTitle = 'Delete this audio?'
const deleteConfirmContent = 'This will permanently remove the audio from storage. This action cannot be undone.'

const AudioListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton />
  </TopToolbar>
)

export const AudioList = () => (
  <List actions={<AudioListActions />} filters={[<AudioSearchFilter key="search" />]}>
    <Datagrid
      rowClick="edit"
      bulkActionButtons={
        <BulkDeleteButton
          mutationMode="pessimistic"
          confirmTitle={deleteConfirmTitle}
          confirmContent={deleteConfirmContent}
          confirmColor="warning"
        />
      }
    >
      <TextField source="name" />
      <TextField source="tags" />
      <TextField source="description" />
      <TextField source="storage_path" label="Path" />
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
