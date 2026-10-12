import { compareRows } from '../conjugation-order'

describe('compareRows', () => {
  // jsonb returns keys shortest first, so the book's complex table arrived with
  // 'Habituel → Impératif' above 'Futur'. Both tables below are the book's, as printed.
  const complexes = [
    'Futur',
    'Irréel du passé',
    'Adversatif → Impératif',
    'Adversatif → Inaccompli présent',
    'Adversatif → Inaccompli passé',
    'Adversatif → Accompli',
    'Adversatif → Comparatif inaccompli',
    'Adversatif → Comparatif accompli',
    'Habituel → Impératif',
    'Habituel → Inaccompli présent',
    'Habituel → Comparatif inaccompli',
    'Expectatif → Impératif',
    'Expectatif → Inaccompli présent',
    'Immédiat → Aoriste',
    'Immédiat → Inaccompli passé',
    'Immédiat → Accompli',
    'Immédiat → Comparatif inaccompli',
    'Immédiat → Comparatif accompli',
    'Lointain → Impératif',
    'Lointain → Inaccompli présent',
    'Lointain → Inaccompli passé',
    'Lointain → Accompli',
  ]
  const negatives = [
    'Négatif simple → Impératif (prohibitif)',
    'Négatif simple → Inaccompli présent',
    'Négatif simple → Inaccompli passé',
    'Négatif simple → Accompli',
    'Négatif catégorique → Impératif (prohibitif)',
    'Négatif catégorique → Inaccompli présent',
    'Négatif catégorique → Inaccompli passé',
    'Négatif catégorique → Accompli',
    'Négatif habituel → Impératif (prohibitif)',
    'Négatif habituel → Inaccompli présent',
    'Négatif lointain → Impératif (prohibitif)',
    'Négatif lointain → Inaccompli passé',
    'Négatif lointain → Accompli',
    'Négatif provisoire → Impératif (prohibitif)',
    'Négatif provisoire → Accompli',
    'Négatif provisoire → Accompli lointain',
  ]
  const asStored = (keys: string[]) => [...keys].sort((a, b) => a.length - b.length || (a < b ? -1 : 1))

  it.each([
    ['complexes', complexes],
    ['négatives', negatives],
  ])('puts the book %s table back in printed order', (_, printed) => {
    expect(asStored(printed).sort(compareRows)).toEqual(printed)
  })

  it('ranks unknown rows after the known ones, and unknown groups after the known groups', () => {
    expect(['Nouveau', 'Aoriste'].sort(compareRows)).toEqual(['Aoriste', 'Nouveau'])
    expect(['Inconnu → Accompli', 'Négatif provisoire → Accompli'].sort(compareRows)).toEqual([
      'Négatif provisoire → Accompli',
      'Inconnu → Accompli',
    ])
  })
})
