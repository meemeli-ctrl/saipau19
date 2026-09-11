import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'
import { TEAM_NAME } from '../data/team'

/**
 * Normalisoi käyttäjän syötteen sähköpostiksi. Jos syötteessä ei ole @-merkkiä,
 * oletetaan kyseessä olevan pelkkä käyttäjätunnus ja lisätään sisäinen domain.
 */
function normalizeLoginIdentifier(input) {
  const trimmed = (input || '').trim().toLowerCase()
  if (!trimmed) return ''
  if (trimmed.includes('@')) return trimmed
  // Sallitaan a-z, 0-9, piste, alaviiva ja väliviiva
  const sanitized = trimmed.replace(/[^a-z0-9._-]/g, '')
  return `${sanitized}@saipau19.app`
}

function getReadableErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Virheellinen käyttäjätunnus tai salasana.'
    case 'auth/email-already-in-use':
      return 'Tämä käyttäjätunnus on jo käytössä.'
    case 'auth/weak-password':
      return 'Salasanan tulee olla vähintään 6 merkkiä pitkä.'
    case 'auth/invalid-email':
      return 'Tarkista käyttäjätunnuksen muoto.'
    case 'auth/too-many-requests':
      return 'Liian monta epäonnistunutta yritystä. Yritä hetken kuluttua uudelleen.'
    case 'auth/network-request-failed':
      return 'Verkkovirhe. Tarkista internetyhteys.'
    default:
      return 'Kirjautuminen epäonnistui. Tarkista tiedot ja yritä uudelleen.'
  }
}

export default function LoginView({ onLocalLogin, onBypassLocal }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase-yhteyttä ei ole konfiguroitu (.env puuttuu).')
      return
    }
    setLoading(true)
    setError('')
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error('Google sign in error:', err)
      setError('Google-kirjautuminen epäonnistui.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      setError('Syötä käyttäjätunnus.')
      return
    }
    if (!password) {
      setError('Syötä salasana.')
      return
    }

    const email = normalizeLoginIdentifier(trimmedUsername)

    if (!isFirebaseConfigured || !auth) {
      if (onLocalLogin) {
        onLocalLogin({
          displayName: trimmedUsername,
          email,
        })
        return
      }
      setError('Firebase-yhteyttä ei ole konfiguroitu (.env puuttuu).')
      return
    }

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      console.error('Auth error:', err)
      setError(getReadableErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-view">
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo-badge">SaiPa</div>
          <h1>{TEAM_NAME}</h1>
          <p className="login-subhead">Laukaisukartta</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">
            Kirjaudu sisään
          </h2>

          {error && <div className="login-error-banner">{error}</div>}

          <div className="form-group">
            <label htmlFor="login-username">Käyttäjätunnus tai sähköposti</label>
            <input
              id="login-username"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="esim. valmentaja tai nimi@seura.fi"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Salasana</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? <span className="btn-spinner">Käsitellään…</span> : 'Kirjaudu sisään'}
          </button>

          <div className="login-divider">
            <span>TAI</span>
          </div>
          
          <button
            type="button"
            className="login-google-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
              </g>
            </svg>
            Kirjaudu Googlella
          </button>
        </form>

        {!isFirebaseConfigured && onBypassLocal && (
          <div className="login-local-fallback">
            <p className="login-note">
              Firebase ei ole vielä määritelty. Voit kokeilla sovellusta offline-tilassa:
            </p>
            <button
              type="button"
              className="login-fallback-btn"
              onClick={onBypassLocal}
            >
              Jatka paikallisessa tilassa (localStorage) →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
