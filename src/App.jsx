import { useCallback, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'
import LoginView from './components/LoginView'
import StartView from './components/StartView'
import ShotMap from './components/ShotMap'
import './App.css'

// Erikoisarvo: käyttäjä valitsi "ilman peliä".
const NO_MATCH = { id: null }

const USER_KEY = 'saipau19.localUser'

function readLocalUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null')
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(() => (isFirebaseConfigured ? null : readLocalUser()))
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [bypassLocal, setBypassLocal] = useState(() => (!isFirebaseConfigured && Boolean(readLocalUser())))
  // Ei lueta viimeksi valittua peliä localStoragesta käynnistyksessä: jokaisen
  // kirjautumisen (myös istunnon palautumisen sivun latauksessa) jälkeen pitää
  // aina näyttää pelin valinta ensin, ettei jää vahingossa merkitsemään
  // laukauksia vanhaan/väärään otteluun.
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setAuthReady(true)
    })
    return unsubscribe
  }, [])

  const chooseMatch = useCallback((match) => setSelected(match), [])
  const skip = useCallback(() => setSelected(NO_MATCH), [])
  const changeMatch = useCallback(() => setSelected(null), [])

  const handleLocalLogin = useCallback((mockUser) => {
    setUser(mockUser)
    setBypassLocal(true)
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser))
    } catch {
      /* ohitetaan */
    }
  }, [])

  const handleLogout = useCallback(async () => {
    if (auth) {
      await signOut(auth)
    }
    setUser(null)
    setBypassLocal(false)
    setSelected(null)
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ohitetaan */
    }
  }, [])

  if (!authReady) {
    return (
      <div className="startview">
        <div className="startview__card" style={{ textAlign: 'center', padding: '40px' }}>
          <p className="startview__note">Ladataan sovellusta…</p>
        </div>
      </div>
    )
  }

  // Jos Firebase on käytössä eikä käyttäjä ole kirjautunut, näytetään kirjautumisnäkymä
  if (isFirebaseConfigured && !user) {
    return <LoginView />
  }

  // Jos Firebase ei ole määritelty eikä käyttäjä ole vielä kirjautunut / jatkanut paikallisesti
  if (!isFirebaseConfigured && !user && !bypassLocal) {
    return (
      <LoginView
        onLocalLogin={handleLocalLogin}
        onBypassLocal={() => setBypassLocal(true)}
      />
    )
  }

  if (!selected) {
    return (
      <StartView
        user={user}
        onLogout={handleLogout}
        onSelectMatch={chooseMatch}
        onSkip={skip}
      />
    )
  }

  return (
    <ShotMap
      user={user}
      onLogout={handleLogout}
      match={selected.id ? selected : null}
      onChangeMatch={changeMatch}
    />
  )
}

