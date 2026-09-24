import { describe, expect, it } from 'vitest'
import { sortShots } from './useShots'

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
