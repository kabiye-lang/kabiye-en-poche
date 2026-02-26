import {
  ArrayInput,
  Create,
  NumberInput,
  ReferenceInput,
  required,
  SelectInput,
  SimpleForm,
  SimpleFormIterator,
  TextInput,
  useNotify,
  useRedirect,
} from 'react-admin'
import { useLocation } from 'react-router-dom'

import { AudioUrlInput } from '@/components/inputs/audio-url-input'
import { MarkdownInput } from '@/components/inputs/markdown-input'

export const LessonContentCreate = () => {
  const notify = useNotify()
  const redirect = useRedirect()
  const location = useLocation()
  const fromLesson = (location.state as { record?: { lesson_id?: string } })?.record?.lesson_id

  return (
    <Create
      mutationOptions={{
        onSuccess: (data) => {
          notify('ra.notification.created')
          if (fromLesson || data?.lesson_id) {
            redirect(`/lessons/${data?.lesson_id ?? fromLesson}`)
          } else {
            redirect('list', 'lesson_contents')
          }
        },
      }}
    >
      <SimpleForm>
        <ReferenceInput source="lesson_id" reference="lessons">
          <SelectInput optionText="title_en" validate={[required()]} />
        </ReferenceInput>
        <TextInput source="title_en" label="Title (EN)" validate={[required()]} />
        <TextInput source="title_fr" label="Title (FR)" validate={[required()]} />
        <NumberInput source="position" defaultValue={0} />

        <MarkdownInput source="content_en" label="Content (EN)" />
        <MarkdownInput source="content_fr" label="Content (FR)" />

        <ArrayInput source="examples" label="Examples" defaultValue={[]}>
          <SimpleFormIterator inline>
            <TextInput source="kbp" label="Kabiyè" />
            <TextInput source="en" label="English" />
            <TextInput source="fr" label="French" />
            <TextInput source="pronunciation" label="Pronunciation" />
            <AudioUrlInput source="audio_url" label="Audio URL" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  )
}
