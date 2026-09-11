/**
 * Rajapinta Suomen Salibandyliiton tulospalveluun (Torneopal / Taso REST API).
 *
 * Sama julkinen luku-API ja avain, jota virallinen tulospalvelu.salibandy.fi
 * käyttää selaimessa. Avain välitetään Accept-otsakkeessa muodossa
 * "json/<avain>" – näin Torneopal-API sen odottaa. CORS on sallittu (*).
 *
 * Kausikohtaiset tunnisteet (COMPETITION_ID) vaihtuvat joka kausi:
 * "sb2026" = valtakunnalliset sarjat 2026–2027. Päivitä ensi kaudeksi
 * (tai aseta VITE_TORNEOPAL_COMPETITION_ID .env-tiedostoon).
 */

const API_BASE =
  import.meta.env.VITE_TORNEOPAL_API_BASE || 'https://salibandy-api.torneopal.net/taso/rest'

const API_KEY =
  import.meta.env.VITE_TORNEOPAL_API_KEY || 'zsn3anknxzcfzc23k53jqdcd4pymutsf'

// Sarja: U19 Pojat 1. divisioona, valtakunnalliset sarjat 2026–2027.
export const COMPETITION_ID = import.meta.env.VITE_TORNEOPAL_COMPETITION_ID || 'sb2026'
export const CATEGORY_ID = import.meta.env.VITE_TORNEOPAL_CATEGORY_ID || '580'
export const CATEGORY_NAME = 'U19 Pojat 1. divisioona'

// SaiPan U19-joukkue tulospalvelussa.
export const SAIPA_TEAM_ID = import.meta.env.VITE_TORNEOPAL_TEAM_ID || '29558'

async function call(method, params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = `${API_BASE}/${method}${query ? `?${query}` : ''}`
  const res = await fetch(url, { headers: { Accept: `json/${API_KEY}` } })
  if (!res.ok) {
    throw new Error(`Tulospalvelu ${method}: HTTP ${res.status}`)
  }
  const data = await res.json()
  if (data?.call?.status === 'error') {
    throw new Error(`Tulospalvelu ${method}: ${data.call.error}`)
  }
  return data
}

/**
 * Muuntaa Torneopal-ottelun sovelluksen käyttämään kevyeen muotoon.
 */
function normalizeMatch(m) {
  const played = m.status === 'Played'
  return {
    id: String(m.match_id),
    date: m.date, // "YYYY-MM-DD"
    time: (m.time || '').slice(0, 5), // "HH:MM"
    status: m.status,
    played,
    home: m.team_A_name,
    away: m.team_B_name,
    saipaHome: String(m.team_A_id) === String(SAIPA_TEAM_ID),
    opponent:
      String(m.team_A_id) === String(SAIPA_TEAM_ID) ? m.team_B_name : m.team_A_name,
    scoreHome: played ? Number(m.fs_A) : null,
    scoreAway: played ? Number(m.fs_B) : null,
    venue: m.venue_name || '',
    city: m.venue_city_name || '',
    group: m.group_name || '',
    category: m.category_name || CATEGORY_NAME,
  }
}

/**
 * Hakee SaiPan ottelut U19 Pojat 1. divisioonasta aikajärjestyksessä.
 */
export async function fetchSaipaMatches() {
  const data = await call('getMatches', {
    team_id: SAIPA_TEAM_ID,
    competition_id: COMPETITION_ID,
    category_id: CATEGORY_ID,
  })
  const matches = (data.matches || []).map(normalizeMatch)
  matches.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  return matches
}

/**
 * Jakaa ottelut tuleviin ja pelattuihin. Ensimmäinen tuleva on "seuraava peli".
 */
export function splitMatches(matches, now = new Date()) {
  // Paikallinen päivä (ei UTC), jotta illan peli ei putoa "tulevista" liian aikaisin.
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`
  const upcoming = []
  const past = []
  for (const m of matches) {
    if (!m.played && m.date >= today) upcoming.push(m)
    else past.push(m)
  }
  past.reverse() // uusin pelattu ensin
  return { upcoming, past, next: upcoming[0] ?? null }
}

/**
 * Hakee yksittäisen ottelun tarkemmat tiedot ja tapahtumat (maalit).
 */
export async function fetchMatchDetails(matchId) {
  if (!matchId) return null
  try {
    const data = await call('getMatch', { match_id: matchId })
    return data.match || null
  } catch (err) {
    console.error('Virhe haettaessa ottelun tietoja:', err)
    return null
  }
}
