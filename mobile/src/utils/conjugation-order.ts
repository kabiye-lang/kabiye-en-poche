/** The order a learner reads a table in: the dictionary form first, then the order, then
 *  the aspects from bare to marked. Unknown rows keep their printed order after these. */
const ROW_ORDER = [
  'infinitif',
  'Infinitif',
  'Impératif',
  'Impératif (prohibitif)',
  'Aoriste',
  'Inaccompli présent',
  'Inaccompli passé',
  'Accompli non lié',
  'Accompli lié',
  'Accompli',
  'Accompli lointain',
  'Futur',
  'Irréel du passé',
  'Comparatif inaccompli',
  'Comparatif accompli',
  'Négatif catégorique',
  'Négatif provisoire',
  'Lointain',
  'descriptif',
  'progressif simple',
  'progressif passé',
  'accompli simple',
  'accompli avec complément',
  'accompli sans complément',
  'consécutif / impératif',
]

/** The book's complex and negative tables key a row `group → aspect`. The groups go in
 *  the book's printed order, and each group's aspects in ROW_ORDER. */
const GROUP_ORDER = [
  'Adversatif',
  'Habituel',
  'Expectatif',
  'Immédiat',
  'Lointain',
  'Négatif simple',
  'Négatif catégorique',
  'Négatif habituel',
  'Négatif lointain',
  'Négatif provisoire',
]

const indexOr = (list: string[], key: string) => {
  const i = list.indexOf(key)
  return i === -1 ? list.length : i
}

/** The row's place, as [group, aspect]. A plain row has group -1, so plain rows come
 *  first, as the book prints them (`Futur` before the `Adversatif` rows). */
const place = (code: string): [number, number] => {
  const [group, aspect] = code.split(' → ')
  if (aspect === undefined) return [-1, indexOr(ROW_ORDER, code)]
  return [indexOr(GROUP_ORDER, group), indexOr(ROW_ORDER, aspect)]
}

/** Sorts form keys. `jsonb` keeps no key order, so the table cannot trust what arrives. */
export const compareRows = (a: string, b: string) => {
  const [groupA, aspectA] = place(a)
  const [groupB, aspectB] = place(b)
  return groupA - groupB || aspectA - aspectB
}
