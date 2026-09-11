import { useCallback, useEffect, useState } from 'react'
import { fetchSaipaMatches, splitMatches } from '../api/tulospalvelu'

const CACHE_KEY = 'saipau19.matches'
const CACHE_TTL = 10 * 60 * 1000 // 10 min

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    if (raw && Array.isArray(raw.matches)) return raw
  } catch {
    /* ohitetaan */
  }
  return null
}

function writeCache(matches) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ matches, at: Date.now() }))
  } catch {
    /* ohitetaan */
  }
}

/**
 * Hakee SaiPan ottelut tulospalvelusta. Näyttää välittömästi välimuistin
 * (toimii myös kaukalon laidalla ilman verkkoa) ja päivittää taustalla.
 *
 * Palauttaa { matches, upcoming, past, next, loading, error, refresh }.
 */
export function useMatches() {
  const cached = readCache()
  const [matches, setMatches] = useState(cached?.matches ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fresh = await fetchSaipaMatches()
      setMatches(fresh)
      writeCache(fresh)
    } catch {
      setError('Otteluiden haku tulospalvelusta ei onnistunut.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fresh = !cached || Date.now() - cached.at > CACHE_TTL
    if (fresh) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { matches, ...splitMatches(matches), loading, error, refresh }
}
