import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'

const STORAGE_KEY = 'saipau19.shots'

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(shots) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shots))
  } catch {
    /* tallennus epäonnistui – ohitetaan */
  }
}

// Sama arvo eri kirjoitusasuille (null / undefined / "") jotta "ilman peliä"
// -laukaukset päätyvät samaan koriin.
const norm = (matchId) => matchId || null

/**
 * Laukausten tila valitulle ottelulle. Käyttää Firestorea jos konfiguroitu,
 * muuten localStoragea. `matchId` erottaa eri pelien laukaukset toisistaan;
 * null = ei valittua peliä.
 *
 * Palauttaa { shots, addShot, removeShot, clearShots, backend }.
 */
export function useShots(matchId = null) {
  const activeMatch = norm(matchId)
  const [allShots, setAllShots] = useState(() => (isFirebaseConfigured ? [] : readLocal()))

  // Firestore-tilaus (kaikki laukaukset; suodatus tehdään muistissa)
  useEffect(() => {
    if (!isFirebaseConfigured) return
    const q = query(collection(db, 'shots'), orderBy('createdAt', 'asc'))
    return onSnapshot(q, (snap) => {
      setAllShots(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            matchId: norm(data.matchId),
            createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
          }
        }),
      )
    })
  }, [])

  // Paikallinen tallennus
  useEffect(() => {
    if (isFirebaseConfigured) return
    writeLocal(allShots)
  }, [allShots])

  const shots = useMemo(
    () => allShots.filter((s) => norm(s.matchId) === activeMatch),
    [allShots, activeMatch],
  )

  const addShot = useCallback(
    async (shot) => {
      const withMatch = { ...shot, matchId: activeMatch }
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'shots'), { ...withMatch, createdAt: serverTimestamp() })
        return
      }
      setAllShots((prev) => [
        ...prev,
        { ...withMatch, id: crypto.randomUUID(), createdAt: Date.now() },
      ])
    },
    [activeMatch],
  )

  const removeShot = useCallback(async (id) => {
    if (isFirebaseConfigured) {
      await deleteDoc(doc(db, 'shots', id))
      return
    }
    setAllShots((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const clearShots = useCallback(async () => {
    if (isFirebaseConfigured) {
      const snap = await getDocs(collection(db, 'shots'))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => {
        if (norm(d.data().matchId) === activeMatch) batch.delete(d.ref)
      })
      await batch.commit()
      return
    }
    setAllShots((prev) => prev.filter((s) => norm(s.matchId) !== activeMatch))
  }, [activeMatch])

  const clearPeriodShots = useCallback(async (period) => {
    if (isFirebaseConfigured) {
      const snap = await getDocs(collection(db, 'shots'))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => {
        const data = d.data()
        if (norm(data.matchId) === activeMatch && (data.period ?? 1) === period) {
          batch.delete(d.ref)
        }
      })
      await batch.commit()
      return
    }
    setAllShots((prev) =>
      prev.filter((s) => !(norm(s.matchId) === activeMatch && (s.period ?? 1) === period)),
    )
  }, [activeMatch])

  return {
    shots,
    addShot,
    removeShot,
    clearShots,
    clearPeriodShots,
    backend: isFirebaseConfigured ? 'Firestore' : 'localStorage',
  }
}
