import { isWritten } from '../lesson-status'

describe('isWritten', () => {
  it('treats available and null as written', () => {
    expect(isWritten('available')).toBe(true)
    expect(isWritten(null)).toBe(true)
  })

  it('treats coming_soon, maintenance and disabled as not written', () => {
    expect(isWritten('coming_soon')).toBe(false)
    expect(isWritten('maintenance')).toBe(false)
    expect(isWritten('disabled')).toBe(false)
  })
})
