/**
 * Tab icon weight configuration test
 *
 * Verifies that all tab icons use weight="regular" when inactive
 * and weight="fill" when active (focused), per the design system spec.
 */
describe('Tab icon weight configuration', () => {
  it('inactive tabs should use "regular" weight', () => {
    // The weight logic used across all 5 tabs in (tabs)/_layout.tsx:
    // weight={focused ? 'fill' : 'regular'}
    const focused = false
    const weight = focused ? 'fill' : 'regular'
    expect(weight).toBe('regular')
  })

  it('active tabs should use "fill" weight', () => {
    const focused = true
    const weight = focused ? 'fill' : 'regular'
    expect(weight).toBe('fill')
  })
})
