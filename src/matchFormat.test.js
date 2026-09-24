import { describe, expect, it } from 'vitest'
import { formatMatchDate } from './matchFormat'

describe('formatMatchDate', () => {
  it('muotoilee viikonpäivän, päivän ja kellonajan suomeksi', () => {
    expect(formatMatchDate('2026-09-12', '14:00')).toBe('la 12.9. klo 14:00')
  })
  it('ilman kellonaikaa', () => {
    expect(formatMatchDate('2026-09-26')).toBe('la 26.9.')
  })
  it('tyhjä päivä -> tyhjä merkkijono', () => {
    expect(formatMatchDate('')).toBe('')
  })
})
