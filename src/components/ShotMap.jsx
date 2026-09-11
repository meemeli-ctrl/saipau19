import { useCallback, useEffect, useMemo, useState } from 'react'
import Rink from './Rink'
import { outcomeById } from '../data/team'
import { useShots } from '../hooks/useShots'
import { formatMatchDate } from '../matchFormat'

const PERIOD_LIST = [
  { id: 1, label: '1. erä' },
  { id: 2, label: '2. erä' },
  { id: 3, label: '3. erä' },
  { id: 'ja', label: 'JA' },
  { id: 'all', label: 'Kaikki' },
]

function ShotMarker({ shot }) {
  const outcome = outcomeById(shot.outcome)
  const common = { stroke: '#0b1a3a', strokeWidth: 1 }
  const pLabel = shot.period === 'ja' ? 'JA' : `${shot.period ?? 1}. erä`

  let marker = null
  if (shot.outcome === 'miss') {
    marker = (
      <g stroke={outcome.color} strokeWidth="2.4" strokeLinecap="round">
        <line x1="-4" y1="-4" x2="4" y2="4" />
        <line x1="-4" y1="4" x2="4" y2="-4" />
      </g>
    )
  } else if (shot.outcome === 'block') {
    marker = <path d="M0,-4.5 L5,4.5 L-5,4.5 Z" fill={outcome.color} {...common} />
  } else if (shot.outcome === 'save') {
    marker = <circle r="4.5" fill="none" stroke={outcome.color} strokeWidth="2.4" />
  } else {
    marker = <circle r="4.5" fill={outcome.color} {...common} />
  }

  return (
    <g>
      <title>{`${outcome.label} (${pLabel})`}</title>
      {marker}
    </g>
  )
}

export default function ShotMap({ user, onLogout, match = null, onChangeMatch }) {
  const { shots, addShot, removeShot, clearShots, clearPeriodShots, lockedPeriods, lockPeriod } = useShots(match?.id ?? null)
  const [period, setPeriod] = useState(1)

  const isLocked = useMemo(() => {
    if (period === 'all') return false
    return lockedPeriods.includes(period)
  }, [period, lockedPeriods])

  // Suodatetaan näytettävät laukaukset valitun erän mukaan
  const displayedShots = useMemo(() => {
    if (period === 'all') return shots
    return shots.filter((s) => (s.period ?? 1) === period)
  }, [shots, period])

  // Laukausmäärä per erä
  const countForPeriod = useCallback(
    (pId) => {
      if (pId === 'all') return shots.length
      return shots.filter((s) => (s.period ?? 1) === pId).length
    },
    [shots],
  )

  // Tilastot valitulle näkymälle
  const stats = useMemo(() => {
    let goals = 0
    let saves = 0
    let misses = 0
    let blocks = 0
    for (const s of displayedShots) {
      if (s.outcome === 'goal') goals++
      else if (s.outcome === 'save') saves++
      else if (s.outcome === 'miss') misses++
      else if (s.outcome === 'block') blocks++
    }
    return { goals, saves, misses, blocks, total: displayedShots.length }
  }, [displayedShots])

  const handleAddShot = useCallback(
    (posWithOutcome) => {
      if (isLocked) {
        alert('Tämä erä on tallennettu eikä siihen voi enää lisätä laukauksia.')
        return
      }
      addShot({
        x: posWithOutcome.x,
        y: posWithOutcome.y,
        outcome: posWithOutcome.outcome,
        period: period === 'all' ? 1 : period,
        playerNumber: null,
        playerName: 'Penkki',
      })
    },
    [addShot, period, isLocked],
  )

  const handleUndo = useCallback(() => {
    if (isLocked) {
      alert('Tämä erä on tallennettu eikä sitä voi enää muokata.')
      return
    }
    if (displayedShots.length > 0) {
      removeShot(displayedShots[displayedShots.length - 1].id)
    }
  }, [displayedShots, removeShot, isLocked])

  const handleClearPeriod = useCallback(() => {
    if (isLocked) {
      alert('Tämä erä on tallennettu eikä sitä voi enää tyhjentää.')
      return
    }
    if (displayedShots.length === 0) return
    const desc = period === 'all' ? 'kaikki ottelun laukaukset' : `${period === 'ja' ? 'jatkoajan' : `${period}. erän`} laukaukset`
    if (confirm(`Haluatko varmasti poistaa: ${desc}?`)) {
      if (period === 'all') {
        clearShots()
      } else {
        clearPeriodShots(period)
      }
    }
  }, [displayedShots.length, period, clearShots, clearPeriodShots, isLocked])

  // Pikanäppäimet
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleUndo()
      } else if (e.key === '1') {
        setPeriod(1)
      } else if (e.key === '2') {
        setPeriod(2)
      } else if (e.key === '3') {
        setPeriod(3)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo])

  return (
    <div className="shotmap-screen">
      {/* 1. YLÄPALKKI: Ottelutiedot & navigointi */}
      <header className="shotmap-topbar">
        <button
          type="button"
          className="shotmap-nav-btn"
          onClick={onChangeMatch}
          title="Takaisin pelin valintaan"
        >
          ‹ {match ? 'Vaihda peli' : 'Pelit'}
        </button>

        <div className="shotmap-matchinfo">
          {match ? (
            <>
              <div className="shotmap-matchinfo__teams">
                <span className={match.saipaHome ? 'team-saipa' : ''}>{match.home}</span>
                <span className="team-vs">{match.played ? `${match.scoreHome}–${match.scoreAway}` : 'vs'}</span>
                <span className={!match.saipaHome ? 'team-saipa' : ''}>{match.away}</span>
              </div>
              <div className="shotmap-matchinfo__meta">
                {formatMatchDate(match.date, match.time)}
                {match.venue ? ` · ${match.venue}` : ''}
              </div>
            </>
          ) : (
            <div className="shotmap-matchinfo__teams">
              <span>SaiPa 19 – Harjoitus / Ilman peliä</span>
            </div>
          )}
        </div>

        <div className="shotmap-user-tools">
          {user && (
            <span className="shotmap-username" title={`Kirjautunut: ${user.email}`}>
              👤 {user.displayName || user.email?.replace(/@saipau19\.app$/, '')}
            </span>
          )}
          {onLogout && (
            <button
              type="button"
              className="shotmap-logout-btn"
              onClick={onLogout}
              title="Kirjaudu ulos"
            >
              Ulos
            </button>
          )}
        </div>
      </header>

      {/* 2. ERÄPALKKI: Erän valinta ja eräkohtaiset määrät */}
      <nav className="shotmap-periodbar" aria-label="Erän valinta">
        <span className="shotmap-periodbar__label">ERÄ:</span>
        <div className="shotmap-periodbar__buttons">
          {PERIOD_LIST.map((p) => {
            const count = countForPeriod(p.id)
            const isSelected = period === p.id
            const isPeriodLocked = p.id !== 'all' && lockedPeriods.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                className={`period-btn${isSelected ? ' period-btn--active' : ''}${isPeriodLocked ? ' period-btn--locked' : ''}`}
                onClick={() => setPeriod(p.id)}
                title={isPeriodLocked ? `${p.label}: tallennettu ja lukittu` : undefined}
              >
                <span className="period-btn__title">
                  {p.label}
                  {isPeriodLocked && ' 🔒'}
                </span>
                <span className="period-btn__badge">{count}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 3. KAUKALOALUE: Puhdas, häiriötön ja esteetön piirtoalue */}
      <main className="shotmap-arena">
        <div className="shotmap-rink-wrapper">
          <Rink
            shots={displayedShots}
            onAddShot={handleAddShot}
            renderShot={(shot) => <ShotMarker shot={shot} />}
          />
        </div>
      </main>

      {/* 4. ALAPALKKI: Toiminnot ja suorat erätilastot */}
      <footer className="shotmap-bottombar">
        <div className="shotmap-bottombar__actions">
          <button
            type="button"
            className="action-btn action-btn--undo"
            onClick={handleUndo}
            disabled={displayedShots.length === 0 || isLocked}
            title="Peruuta viimeisin laukaus (Ctrl+Z)"
          >
            ↶ Peruuta ({displayedShots.length})
          </button>
          <button
            type="button"
            className="action-btn action-btn--clear"
            onClick={handleClearPeriod}
            disabled={displayedShots.length === 0 || isLocked}
            title="Tyhjennä nykyisen erän laukaukset"
          >
            Tyhjennä erä
          </button>
          {period !== 'all' && (
            <button
              type="button"
              className={`action-btn action-btn--save ${isLocked ? 'locked' : ''}`}
              onClick={() => {
                if (isLocked) {
                  alert('Tämä erä on jo tallennettu.')
                  return
                }
                if (confirm('Haluatko varmasti tallentaa erän? Tämän jälkeen et voi enää lisätä tai poistaa laukauksia tästä erästä.')) {
                  lockPeriod(period)
                }
              }}
              disabled={isLocked}
              title={isLocked ? "Erä on lukittu" : "Tallenna erä (lukitsee erän)"}
            >
              {isLocked ? '🔒 Erä tallennettu' : '💾 Tallenna erä'}
            </button>
          )}
        </div>

        <div className="shotmap-stats">
          <span className="stat-pill stat-pill--goal">● Maalit: <b>{stats.goals}</b></span>
          <span className="stat-pill stat-pill--save">○ Torjunnat: <b>{stats.saves}</b></span>
          <span className="stat-pill stat-pill--miss">× Ohit: <b>{stats.misses}</b></span>
          <span className="stat-pill stat-pill--block">▲ Blokit: <b>{stats.blocks}</b></span>
          <span className="stat-pill stat-pill--total">Yht: <b>{stats.total}</b></span>
        </div>
      </footer>
    </div>
  )
}

