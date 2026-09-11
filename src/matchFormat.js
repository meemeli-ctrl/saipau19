// Ottelun päivämäärän ja kellonajan muotoilu suomeksi.
const DOW = ['su', 'ma', 'ti', 'ke', 'to', 'pe', 'la']

export function formatMatchDate(date, time) {
  if (!date) return ''
  const [y, m, d] = date.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dow = DOW[dt.getDay()]
  const day = `${d}.${m}.`
  return time ? `${dow} ${day} klo ${time}` : `${dow} ${day}`
}

export function matchTitle(match) {
  if (!match) return ''
  return `${match.home} – ${match.away}`
}
