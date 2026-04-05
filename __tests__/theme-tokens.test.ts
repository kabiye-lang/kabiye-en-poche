import { brandColors } from '../src/utils/design-system-nativewind'

describe('Theme tokens', () => {
  it('brandColors should have all required color keys', () => {
    expect(brandColors).toHaveProperty('primary')
    expect(brandColors).toHaveProperty('primaryDark')
    expect(brandColors).toHaveProperty('secondary')
    expect(brandColors).toHaveProperty('bgGrey')
    expect(brandColors).toHaveProperty('textDark')
    expect(brandColors).toHaveProperty('accent')
    expect(brandColors).toHaveProperty('textLight')
  })

  it('colors should be valid hex values', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/
    Object.entries(brandColors).forEach(([key, value]) => {
      expect(value).toMatch(hexPattern)
    })
  })

  it('brandColors snapshot should match', () => {
    expect(brandColors).toMatchSnapshot()
  })
})
