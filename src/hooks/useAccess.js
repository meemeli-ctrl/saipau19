import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

// Sama omistajan uid kuin firestore.rules-tiedoston isOwner()-varmistuksessa.
const OWNER_UID = 'Gj6mIjvRyEM5wRhitG1Qlubsems2'

/**
 * Onko kirjautuneella tunnuksella käyttöoikeus: dokumentti allowed_users/{uid}
 * tai (vahvistetulla sähköpostilla, esim. Google) allowed_emails/{sähköposti}.
 * Sama logiikka kuin firestore.rules-tiedoston isAllowedUser().
 *
 * Palauttaa 'allowed' | 'denied' | 'checking' | 'unknown'.
 * - 'unknown' = ei voitu tarkistaa (ei verkkoa eikä tallessa aiempaa tulosta).
 *   Silloin käyttöä EI estetä, koska hallissa ei ole verkkoa – varsinainen
 *   suojaus on joka tapauksessa firestore.rules-säännöissä.
 */
export function useAccess(user) {
  const uid = user?.uid ?? null
  const verifiedEmail = user?.emailVerified && user?.email ? user.email.toLowerCase() : null
  const skip = !isFirebaseConfigured || !uid || uid === OWNER_UID
  const [result, setResult] = useState({ uid: null, status: 'checking' })

  useEffect(() => {
    if (skip) return
    let cancelled = false
    const check = async () => {
      if ((await getDoc(doc(db, 'allowed_users', uid))).exists()) return 'allowed'
      if (verifiedEmail && (await getDoc(doc(db, 'allowed_emails', verifiedEmail))).exists()) {
        return 'allowed'
      }
      return 'denied'
    }
    check().then(
      (status) => {
        if (!cancelled) setResult({ uid, status })
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
  }, [uid, verifiedEmail, skip])

  if (skip) return 'allowed'
  return result.uid === uid ? result.status : 'checking'
}
