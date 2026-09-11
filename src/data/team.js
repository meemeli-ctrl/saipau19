// Joukkueen tiedot. Muokkaa pelaajalista vastaamaan omaa joukkuettanne.
export const TEAM_NAME = 'SaiPa 19'

export const PLAYERS = [
  { number: 1, name: 'Maalivahti' },
  { number: 4, name: 'Puolustaja A' },
  { number: 6, name: 'Puolustaja B' },
  { number: 7, name: 'Hyökkääjä A' },
  { number: 9, name: 'Hyökkääjä B' },
  { number: 11, name: 'Hyökkääjä C' },
  { number: 14, name: 'Sentteri' },
  { number: 21, name: 'Laituri A' },
  { number: 27, name: 'Laituri B' },
  { number: 88, name: 'Ykkösketjun snaipperi' },
]

// Laukauksen lopputulokset
export const OUTCOMES = [
  { id: 'goal', label: 'Maali', color: '#16a34a', symbol: '●' },
  { id: 'save', label: 'Torjunta', color: '#2563eb', symbol: '○' },
  { id: 'miss', label: 'Ohi', color: '#f59e0b', symbol: '×' },
  { id: 'block', label: 'Blokattu', color: '#dc2626', symbol: '▲' },
]

export const outcomeById = (id) => OUTCOMES.find((o) => o.id === id) ?? OUTCOMES[0]
