import {
  Create,
  NumberInput,
  ReferenceInput,
  required,
  SelectInput,
  SimpleForm,
  TextInput,
  useNotify,
  useRedirect,
} from 'react-admin'

import { ActivityDataFormInput, validateActivityData } from '@/components/inputs/activity-data-form'

const activityTypeChoices = [
  { id: 'audio', name: 'Audio (single or conversation)' },
  { id: 'listen_choose', name: 'Listen & Choose' },
  { id: 'listen_type', name: 'Listen & Type' },
  { id: 'match_pairs', name: 'Match Pairs' },
  { id: 'order_words', name: 'Order Words' },
  { id: 'fill_blank', name: 'Fill Blank' },
  { id: 'multiple_choice', name: 'Multiple Choice' },
  { id: 'spell', name: 'Spell it (Kabiyè keyboard)' },
  { id: 'spot_letter', name: 'Spot the letter' },
  { id: 'read_choose', name: 'Read & Choose' },
  // Retired from new content, still editable so existing rows can be corrected.
  { id: 'true_false', name: 'True/False (legacy)' },
]

const DATA_HELPER = 'Fill the fields below according to the activity type. Data is stored as JSON.'

export const LessonActivityCreate = () => {
  const notify = useNotify()
  const redirect = useRedirect()

  return (
    <Create
      mutationOptions={{
        onSuccess: (data) => {
          notify('ra.notification.created')
          if (data?.lesson_id) {
            redirect(`/lessons/${data.lesson_id}`)
          } else {
            redirect('list', 'lesson_activities')
          }
        },
      }}
    >
      <SimpleForm>
        <ReferenceInput source="lesson_id" reference="lessons">
          <SelectInput optionText="title_en" validate={[required()]} />
        </ReferenceInput>
        <SelectInput source="activity_type" choices={activityTypeChoices} validate={[required()]} />
        <NumberInput source="position" defaultValue={0} />

        <TextInput source="instructions_en" label="Instructions (EN)" multiline />
        <TextInput source="instructions_fr" label="Instructions (FR)" multiline />
        <TextInput source="question_en" label="Question (EN)" multiline />
        <TextInput source="question_fr" label="Question (FR)" multiline />

        <ActivityDataFormInput
          source="data"
          label="Activity Data"
          helperText={DATA_HELPER}
          validate={validateActivityData}
        />
      </SimpleForm>
    </Create>
  )
}
