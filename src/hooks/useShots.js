import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  getDocs,
  setDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { fetchMatchDetails } from '../api/tulospalvelu'

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
 * Laukausten järjestys merkintähetken mukaan. Käyttää laitteen omaa kelloa
 * (clientCreatedAt), koska palvelimen aikaleima syntyy vasta kun laukaus ehtii
 * pilveen: hallissa ilman verkkoa koko ottelu saa saman aikaleiman, ja
 * "viimeisin laukaus" (Peruuta-nappi) olisi satunnainen. Vanhoille laukauksille
 * ilman clientCreatedAt-kenttää käytetään palvelimen aikaleimaa.
 */
export function sortShots(shots) {
  const key = (s) => s.clientCreatedAt ?? s.createdAt ?? Number.POSITIVE_INFINITY
  return [...shots].sort((a, b) => key(a) - key(b) || String(a.id).localeCompare(String(b.id)))
}

/**
 * Laukausten tila valitulle ottelulle. Käyttää Firestorea jos konfiguroitu,
 * muuten localStoragea. `matchId` erottaa eri pelien laukaukset toisistaan;
 * null = ei valittua peliä.
 *
 * Palauttaa { shots, addShot, removeShot, clearShots, backend }.
 */
export function useShots(matchId = null, user = null) {
  const activeMatch = norm(matchId)
  const [allShots, setAllShots] = useState(() => (isFirebaseConfigured ? [] : readLocal()))
  const [lockedPeriods, setLockedPeriods] = useState([])

  // Lukittujen erien tilaus: kun erä on "tallennettu", sitä ei voi enää muokata.
  useEffect(() => {
    if (!isFirebaseConfigured) {
      try {
        const localLocks = JSON.parse(
          localStorage.getItem('saipau19.lockedPeriods_' + (activeMatch || 'default')) ?? '[]',
        )
        setLockedPeriods(localLocks)
      } catch {
        /* ohitetaan */
      }
      return
    }
    const q = query(collection(db, 'locked_periods'))
    return onSnapshot(q, (snap) => {
      const matchLocks = []
      snap.docs.forEach((d) => {
        const data = d.data()
        if (norm(data.matchId) === activeMatch && (!user || data.userId === user.uid)) {
          matchLocks.push(data.period)
        }
      })
      setLockedPeriods(matchLocks)
    })
  }, [activeMatch, user])

  // Lukituksen avaus: jos erä on tallennettu vahingossa kesken pelin, sen
  // pitää saada auki – muuten koko erä jäisi lukkoon ottelun loppuun asti.
  const unlockPeriod = useCallback(
    async (period) => {
      if (isFirebaseConfigured) {
        await deleteDoc(
          doc(db, 'locked_periods', `${activeMatch || 'default'}_${period}_${user?.uid || 'anon'}`),
        )
        return
      }
      const localKey = 'saipau19.lockedPeriods_' + (activeMatch || 'default')
      const current = JSON.parse(localStorage.getItem(localKey) ?? '[]')
      const updated = current.filter((p) => p !== period)
      localStorage.setItem(localKey, JSON.stringify(updated))
      setLockedPeriods(updated)
    },
    [activeMatch, user],
  )

  const lockPeriod = useCallback(
    async (period) => {
      if (isFirebaseConfigured) {
        await setDoc(doc(db, 'locked_periods', `${activeMatch || 'default'}_${period}_${user?.uid || 'anon'}`), {
          matchId: activeMatch,
          userId: user?.uid || null,
          period,
          lockedAt: serverTimestamp(),
        })
        return
      }
      const localKey = 'saipau19.lockedPeriods_' + (activeMatch || 'default')
      const current = JSON.parse(localStorage.getItem(localKey) ?? '[]')
      if (!current.includes(period)) {
        current.push(period)
        localStorage.setItem(localKey, JSON.stringify(current))
        setLockedPeriods(current)
      }
    },
    [activeMatch, user],
  )

  // Firestore-tilaus (kaikki laukaukset; suodatus tehdään muistissa)
  useEffect(() => {
    if (!isFirebaseConfigured) return
    const q = query(collection(db, 'shots'))
    return onSnapshot(q, (snap) => {
      setAllShots(
        sortShots(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              id: d.id,
              ...data,
              matchId: norm(data.matchId),
              // null kun laukaus odottaa vielä pilveen pääsyä (offline)
              createdAt: data.createdAt?.toMillis?.() ?? null,
            }
          }),
        ),
      )
    })
  }, [])

  // Paikallinen tallennus
  useEffect(() => {
    if (isFirebaseConfigured) return
    writeLocal(allShots)
  }, [allShots])

  const shots = useMemo(
    () => allShots.filter((s) => norm(s.matchId) === activeMatch && (!isFirebaseConfigured || !user || s.userId === user.uid)),
    [allShots, activeMatch, user],
  )

  const addShot = useCallback(
    async (shot) => {
      const withMatch = {
        ...shot,
        matchId: activeMatch,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        clientCreatedAt: Date.now(),
      }
      if (isFirebaseConfigured) {
        await addDoc(collection(db, 'shots'), { ...withMatch, createdAt: serverTimestamp() })
        return
      }
      setAllShots((prev) => [
        ...prev,
        { ...withMatch, id: crypto.randomUUID(), createdAt: withMatch.clientCreatedAt },
      ])
    },
    [activeMatch, user],
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
        if (norm(d.data().matchId) === activeMatch && (!user || d.data().userId === user.uid)) batch.delete(d.ref)
      })
      await batch.commit()
      return
    }
    setAllShots((prev) => prev.filter((s) => norm(s.matchId) !== activeMatch))
  }, [activeMatch, user])

  const clearPeriodShots = useCallback(async (period) => {
    if (isFirebaseConfigured) {
      const snap = await getDocs(collection(db, 'shots'))
      const batch = writeBatch(db)
      snap.docs.forEach((d) => {
        const data = d.data()
        if (norm(data.matchId) === activeMatch && (data.period ?? 1) === period && (!user || data.userId === user.uid)) {
          batch.delete(d.ref)
        }
      })
      await batch.commit()
      return
    }
    setAllShots((prev) =>
      prev.filter((s) => !(norm(s.matchId) === activeMatch && (s.period ?? 1) === period)),
    )
  }, [activeMatch, user])

  const endMatch = useCallback(async (matchInfo) => {
    if (!isFirebaseConfigured || !activeMatch) return;
    
    // Hae API-data
    let apiData = null;
    try {
      apiData = await fetchMatchDetails(activeMatch);
    } catch (e) {
      console.warn("Failed to fetch API data", e);
    }

    // Tallenna completed_matches -kokoelmaan
    await setDoc(doc(db, 'completed_matches', `${activeMatch}_${user?.uid || 'anon'}`), {
      matchId: activeMatch,
      userId: user?.uid || null,
      userEmail: user?.email || null,
      matchInfo: matchInfo || null,
      // Sama joukko kuin käyttäjä näkee näytöllä (omat merkinnät), ei muiden.
      shots,
      apiData: apiData,
      completedAt: serverTimestamp()
    });
  }, [activeMatch, shots, user]);

  return {
    shots,
    addShot,
    removeShot,
    clearShots,
    clearPeriodShots,
    lockedPeriods,
    lockPeriod,
    unlockPeriod,
    endMatch,
    backend: isFirebaseConfigured ? 'Firestore' : 'localStorage',
  }
}
