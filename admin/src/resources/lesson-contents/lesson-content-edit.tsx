import {
  ArrayInput,
  Button,
  Edit,
  NumberInput,
  ReferenceInput,
  required,
  SaveButton,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextInput,
  Toolbar,
  TopToolbar,
  useRecordContext,
  useRedirect,
} from 'react-admin'

import { AudioUrlInput } from '@/components/inputs/audio-url-input'
import { MarkdownInput } from '@/components/inputs/markdown-input'

const LessonContentEditActions = () => {
  const record = useRecordContext()
  const redirect = useRedirect()
  return (
    <TopToolbar>
      <Button
        label="Cancel"
        onClick={() => redirect(record?.lesson_id ? `/lessons/${record.lesson_id}/1` : '/lesson_contents')}
      />
    </TopToolbar>
  )
}

const LessonContentEditToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
)

export const LessonContentEdit = () => (
  <Edit
    mutationMode="pessimistic"
    actions={<LessonContentEditActions />}
    redirect={(_, __, data) => (data?.lesson_id ? `/lessons/${data.lesson_id}/1` : 'list')}
  >
    <SimpleForm toolbar={<LessonContentEditToolbar />}>
      <ReferenceInput source="lesson_id" reference="lessons">
        <SelectInput optionText="title_en" validate={[required()]} />
      </ReferenceInput>
      <TextInput source="title_en" label="Title (EN)" validate={[required()]} />
      <TextInput source="title_fr" label="Title (FR)" validate={[required()]} />
      <NumberInput source="position" />

      <MarkdownInput source="content_en" label="Content (EN)" />
      <MarkdownInput source="content_fr" label="Content (FR)" />

      <ArrayInput source="examples" label="Examples (kbp, en, fr, pronunciation, audio_url)">
        <SimpleFormIterator inline>
          <TextInput source="kbp" label="Kabiyè" />
          <TextInput source="en" label="English" />
          <TextInput source="fr" label="French" />
          <TextInput source="pronunciation" label="Pronunciation" />
          <AudioUrlInput source="audio_url" label="Audio URL" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Edit>
)
