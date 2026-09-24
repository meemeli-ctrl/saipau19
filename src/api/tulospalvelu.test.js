import { describe, expect, it } from 'vitest'
import { splitMatches } from './tulospalvelu'

const m = (id, date, played) => ({ id, date, time: '14:00', played })

describe('splitMatches – tulevat ja pelatut ottelut', () => {
  const now = new Date(2026, 8, 12, 18, 0) // la 12.9.2026 klo 18

  it('tämän päivän pelaamaton ottelu on yhä tuleva (ei putoa illalla pois)', () => {
    const { upcoming, next } = splitMatches([m('tanaan', '2026-09-12', false)], now)
    expect(upcoming.map((x) => x.id)).toEqual(['tanaan'])
    expect(next.id).toBe('tanaan')
  })

  it('pelattu ottelu on pelattu, vaikka päivä olisi tulevaisuudessa', () => {
    const { upcoming, past } = splitMatches([m('p', '2026-09-20', true)], now)
    expect(upcoming).toEqual([])
    expect(past.map((x) => x.id)).toEqual(['p'])
  })

  it('pelatut uusin ensin, seuraava peli on ensimmäinen tuleva', () => {
    const list = [
      m('vanha', '2026-09-01', true),
      m('uudempi', '2026-09-05', true),
      m('seuraava', '2026-09-26', false),
      m('myohempi', '2026-10-03', false),
    ]
    const { past, next } = splitMatches(list, now)
    expect(past.map((x) => x.id)).toEqual(['uudempi', 'vanha'])
    expect(next.id).toBe('seuraava')
  })

  it('ei tulevia -> next on null', () => {
    expect(splitMatches([m('p', '2026-09-01', true)], now).next).toBeNull()
  })
})
