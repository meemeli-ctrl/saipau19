import { useEffect, useState } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

/**
 * Päätetyt ottelut (completed_matches): kuka on päättänyt minkäkin ottelun.
 * Kun ottelu on päätetty, sen päättäjän laukaisukartta näkyy kaikille
 * käyttäjille (ks. selectVisibleShots useShots.js:ssä).
 *
 * Palauttaa Mapin matchId -> [{ userId, userEmail }].
 */
export function useCompletedMatches() {
  const [completed, setCompleted] = useState(() => new Map())

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return onSnapshot(query(collection(db, 'completed_matches')), (snap) => {
      const next = new Map()
      snap.docs.forEach((d) => {
        const { matchId, userId, userEmail } = d.data()
        if (!matchId) return
        if (!next.has(matchId)) next.set(matchId, [])
        next.get(matchId).push({ userId: userId ?? null, userEmail: userEmail ?? null })
      })
      setCompleted(next)
    })
  }, [])

  return completed
}
