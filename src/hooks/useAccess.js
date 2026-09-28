import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

// Sama omistajan uid kuin firestore.rules-tiedoston isOwner()-varmistuksessa.
const OWNER_UID = 'Gj6mIjvRyEM5wRhitG1Qlubsems2'

/**
 * Onko kirjautuneella tunnuksella käyttöoikeus (dokumentti allowed_users/{uid}).
 *
 * Palauttaa 'allowed' | 'denied' | 'checking' | 'unknown'.
 * - 'unknown' = ei voitu tarkistaa (ei verkkoa eikä tallessa aiempaa tulosta).
 *   Silloin käyttöä EI estetä, koska hallissa ei ole verkkoa – varsinainen
 *   suojaus on joka tapauksessa firestore.rules-säännöissä.
 */
export function useAccess(user) {
  const uid = user?.uid ?? null
  const skip = !isFirebaseConfigured || !uid || uid === OWNER_UID
  const [result, setResult] = useState({ uid: null, status: 'checking' })

  useEffect(() => {
    if (skip) return
    let cancelled = false
    getDoc(doc(db, 'allowed_users', uid)).then(
      (snap) => {
        if (!cancelled) setResult({ uid, status: snap.exists() ? 'allowed' : 'denied' })
      },
      (err) => {
        if (!cancelled) {
          setResult({ uid, status: err?.code === 'permission-denied' ? 'denied' : 'unknown' })
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [uid, skip])

  if (skip) return 'allowed'
  return result.uid === uid ? result.status : 'checking'
}
