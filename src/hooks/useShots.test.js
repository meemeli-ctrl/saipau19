import { describe, expect, it } from 'vitest'
import { selectVisibleShots, sortShots } from './useShots'

// Peruuta-nappi poistaa listan viimeisen laukauksen, joten järjestyksen on
// oltava oikea myös silloin kun hallissa ei ole verkkoa.
describe('sortShots – laukausten järjestys', () => {
  it('järjestää laitteen kellon mukaan, vaikka palvelimen aikaleima puuttuu (offline)', () => {
    const shots = [
      { id: 'c', clientCreatedAt: 3000, createdAt: null },
      { id: 'a', clientCreatedAt: 1000, createdAt: null },
      { id: 'b', clientCreatedAt: 2000, createdAt: null },
    ]
    expect(sortShots(shots).map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('offline-synkan jälkeen kaikilla sama palvelinaika – laitteen kello ratkaisee', () => {
    const sync = 1_790_000_000_000
    const shots = [
      { id: 'x', clientCreatedAt: 5, createdAt: sync },
      { id: 'y', clientCreatedAt: 1, createdAt: sync },
    ]
    expect(sortShots(shots).map((s) => s.id)).toEqual(['y', 'x'])
  })

  it('vanhat laukaukset ilman laitteen kelloa käyttävät palvelimen aikaa', () => {
    const shots = [
      { id: 'uusi', createdAt: 200 },
      { id: 'vanha', createdAt: 100 },
    ]
    expect(sortShots(shots).map((s) => s.id)).toEqual(['vanha', 'uusi'])
  })

  it('tasatilanteessa järjestys on vakaa (id:n mukaan), ei satunnainen', () => {
    const shots = [
      { id: 'b', createdAt: 100 },
      { id: 'a', createdAt: 100 },
    ]
    expect(sortShots(shots).map((s) => s.id)).toEqual(['a', 'b'])
    expect(sortShots([...shots].reverse()).map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('ei muuta alkuperäistä listaa', () => {
    const shots = [{ id: 'b', createdAt: 2 }, { id: 'a', createdAt: 1 }]
    sortShots(shots)
    expect(shots.map((s) => s.id)).toEqual(['b', 'a'])
  })
})


// Päätetyn ottelun kartta näkyy kaikille, keskeneräinen vain tekijälleen.
describe('selectVisibleShots – kenen laukaukset näkyvät', () => {
  const all = [
    { id: '1', matchId: 'm1', userId: 'veska' },
    { id: '2', matchId: 'm1', userId: 'matti' },
    { id: '3', matchId: 'm2', userId: 'veska' },
  ]

  it('keskeneräisessä ottelussa näkyvät vain omat', () => {
    expect(selectVisibleShots(all, 'm1', 'matti', []).map((s) => s.id)).toEqual(['2'])
  })

  it('päätetyssä ottelussa näkyvät myös päättäjän laukaukset', () => {
    const v = selectVisibleShots(all, 'm1', 'matti', ['veska'])
    expect(v.map((s) => s.id)).toEqual(['1', '2'])
  })

  it('muiden laukaukset merkitään ei-omiksi, jotta niitä ei voi peruuttaa', () => {
    const v = selectVisibleShots(all, 'm1', 'matti', ['veska'])
    expect(v.find((s) => s.id === '1').mine).toBe(false)
    expect(v.find((s) => s.id === '2').mine).toBe(true)
  })

  it('toisen ottelun laukaukset eivät sekoitu', () => {
    expect(selectVisibleShots(all, 'm2', 'matti', ['veska']).map((s) => s.id)).toEqual(['3'])
  })

  it('ilman kirjautumista (paikallinen tila) kaikki ovat omia', () => {
    const v = selectVisibleShots(all, 'm1', null, [])
    expect(v.every((s) => s.mine)).toBe(true)
  })
})
