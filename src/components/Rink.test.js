import { describe, expect, it } from 'vitest'
import { resolveOutcome } from './resolveOutcome'

// Vetoele on koko sovelluksen ydin: väärä suunta = väärä tilasto.
// Näytön y-akseli kasvaa alaspäin, joten "ylös" on negatiivinen deltaY.
describe('resolveOutcome – vedon suunta lopputulokseksi', () => {
  it('oikealle = maali', () => expect(resolveOutcome(80, 0)).toBe('goal'))
  it('vasemmalle = torjunta', () => expect(resolveOutcome(-80, 0)).toBe('save'))
  it('ylös = ohi', () => expect(resolveOutcome(0, -80)).toBe('miss'))
  it('alas = blokki', () => expect(resolveOutcome(0, 80)).toBe('block'))

  it('vino veto menee lähimpään pääsuuntaan', () => {
    expect(resolveOutcome(80, -30)).toBe('goal') // oikealle, vähän ylös
    expect(resolveOutcome(-30, -80)).toBe('miss') // ylös, vähän vasemmalle
    expect(resolveOutcome(30, 80)).toBe('block') // alas, vähän oikealle
    expect(resolveOutcome(-80, 30)).toBe('save') // vasemmalle, vähän alas
  })

  it('tarkat 45° rajat ovat pysyviä (muutos tässä on tietoinen päätös)', () => {
    expect(resolveOutcome(50, 50)).toBe('block')
    expect(resolveOutcome(50, -50)).toBe('miss')
    expect(resolveOutcome(-50, 50)).toBe('save')
    expect(resolveOutcome(-50, -50)).toBe('save')
  })
})
