import { compareRows } from '../conjugation-order'

describe('compareRows', () => {
  // jsonb returns keys shortest first, so the book's complex table arrived with
  // 'Habituel → Impératif' above 'Futur'. The book prints plain rows, then each group.
  it('puts the book complex and negative tables back in printed order', () => {
    const printed = [
      'Futur',
      'Irréel du passé',
      'Adversatif → Impératif',
      'Adversatif → Inaccompli présent',
      'Adversatif → Accompli',
      'Habituel → Impératif',
      'Immédiat → Aoriste',
      'Lointain → Inaccompli passé',
      'Négatif simple → Impératif (prohibitif)',
      'Négatif simple → Inaccompli présent',
      'Négatif provisoire → Accompli',
      'Négatif provisoire → Accompli lointain',
    ]
    const asStored = [...printed].sort((a, b) => a.length - b.length || (a < b ? -1 : 1))
    expect(asStored.sort(compareRows)).toEqual(printed)
  })

  it('ranks unknown rows after the known ones, and unknown groups after the known groups', () => {
    expect(['Nouveau', 'Aoriste'].sort(compareRows)).toEqual(['Aoriste', 'Nouveau'])
    expect(['Inconnu → Accompli', 'Négatif provisoire → Accompli'].sort(compareRows)).toEqual([
      'Négatif provisoire → Accompli',
      'Inconnu → Accompli',
    ])
  })
})
