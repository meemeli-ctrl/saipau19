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

// Tilastopillerit. Kaikki-näkymässä ne toimivat myös suodattimena.
const STAT_PILLS = [
  { id: 'goal', label: '● Maalit', key: 'goals' },
  { id: 'save', label: '○ Torjunnat', key: 'saves' },
  { id: 'miss', label: '× Ohit', key: 'misses' },
  { id: 'block', label: '▲ Blokit', key: 'blocks' },
  { id: 'total', label: 'Yht', key: 'total' },
]

function ShotMarker({ shot }) {
  const outcome = outcomeById(shot.outcome)
  const common = { stroke: '#000000', strokeWidth: 1 }
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
  const { shots, completedBy, addShot, removeShot, clearShots, clearPeriodShots, lockedPeriods, lockPeriod, unlockPeriod, endMatch } = useShots(match?.id ?? null, user)
  const [period, setPeriod] = useState(1)
  // Lopputulossuodatin (Maalit / Torjunnat / Ohit / Blokit / Yht) – vain Kaikki-näkymässä.
  const [outcomeFilter, setOutcomeFilter] = useState('all')

  const selectPeriod = useCallback((p) => {
    setPeriod(p)
    setOutcomeFilter('all')
  }, [])

  // Jonkun toisen päättämä ottelu: näytetään hänen karttansa, mutta vain katseltavana.
  const readOnly = completedBy.length > 0 && !completedBy.some((c) => c.userId === user?.uid)
  const completerNames = completedBy
    .map((c) => c.userEmail?.replace(/@saipau19\.app$/, '') || 'tuntematon')
    .join(', ')

  // "Kaikki"-näkymässä lisätty laukaus kirjautuu 1. erälle (ks. handleAddShot),
  // joten lukitus tarkistetaan sen todellisen erän mukaan johon merkintä menisi
  // – muuten 1. erän lukitus olisi kierrettävissä "Kaikki"-näkymän kautta.
  const isLocked = useMemo(() => {
    const effectivePeriod = period === 'all' ? 1 : period
    return lockedPeriods.includes(effectivePeriod)
  }, [period, lockedPeriods])

  // Suodatetaan näytettävät laukaukset valitun erän mukaan
  const displayedShots = useMemo(() => {
    if (period === 'all') return shots
    return shots.filter((s) => (s.period ?? 1) === period)
  }, [shots, period])

  // Kaukalolle piirrettävät: Kaikki-näkymässä lisäksi lopputulossuodatin.
  const rinkShots = useMemo(() => {
    if (period !== 'all' || outcomeFilter === 'all') return displayedShots
    return displayedShots.filter((s) => s.outcome === outcomeFilter)
  }, [displayedShots, period, outcomeFilter])

  // Peruuta ja Tyhjennä koskevat vain omia merkintöjä, ei muiden päättämiä.
  const ownDisplayedShots = useMemo(() => displayedShots.filter((s) => s.mine), [displayedShots])

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
      if (readOnly) {
        alert('Tämä ottelu on päätetty. Laukaisukartta on vain katseltavana.')
        return
      }
      if (isLocked) {
        alert('Erä on tallennettu. Avaa lukitus alapalkista jos haluat lisätä laukauksia.')
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
    [addShot, period, isLocked, readOnly],
  )

  const handleUndo = useCallback(() => {
    if (isLocked) {
      alert('Erä on tallennettu. Avaa lukitus alapalkista jos haluat muokata sitä.')
      return
    }
    if (ownDisplayedShots.length > 0) {
      removeShot(ownDisplayedShots[ownDisplayedShots.length - 1].id)
    }
  }, [ownDisplayedShots, removeShot, isLocked])

  const handleClearPeriod = useCallback(() => {
    if (isLocked) {
      alert('Erä on tallennettu. Avaa lukitus alapalkista jos haluat tyhjentää sen.')
      return
    }
    if (ownDisplayedShots.length === 0) return
    const desc = period === 'all' ? 'kaikki ottelun laukaukset' : `${period === 'ja' ? 'jatkoajan' : `${period}. erän`} laukaukset`
    if (confirm(`Haluatko varmasti poistaa: ${desc}?`)) {
      if (period === 'all') {
        clearShots()
      } else {
        clearPeriodShots(period)
      }
    }
  }, [ownDisplayedShots.length, period, clearShots, clearPeriodShots, isLocked])

  // Erän tallennus ja lukituksen avaus samassa napissa: lukitus suojaa
  // vahinkomerkinnöiltä, mutta virheen sattuessa sen saa auki.
  const handleTogglePeriodLock = useCallback(() => {
    if (isLocked) {
      if (confirm('Avataanko erän lukitus? Erään voi sen jälkeen taas lisätä ja poistaa laukauksia.')) {
        unlockPeriod(period)
      }
      return
    }
    if (
      confirm(
        'Tallennetaanko erä?\n\nErä lukitaan, eikä siihen voi lisätä laukauksia ennen kuin lukitus avataan.',
      )
    ) {
      lockPeriod(period)
    }
  }, [isLocked, period, lockPeriod, unlockPeriod])

  // "Päätä ottelu" näkyy VAIN JA-erällä (ks. renderöinti alla) – näin siihen ei
  // voi osua vahingossa kesken 1./2./3. erän merkintöjä. Tekee kaiken kerralla:
  // lukitsee jokaisen erän ja tallentaa ottelun tiedot talteen.
  const handleEndMatch = useCallback(async () => {
    if (!match) return
    if (
      !confirm(
        'Päätetäänkö ottelu?\n\nKaikki erät lukitaan ja ottelun tiedot tallennetaan talteen.',
      )
    ) {
      return
    }
    await Promise.all([1, 2, 3, 'ja'].map((p) => lockPeriod(p)))
    await endMatch(match)
    alert('Ottelu päätetty ja tiedot tallennettu.')
    onChangeMatch()
  }, [match, lockPeriod, endMatch, onChangeMatch])

  // Pikanäppäimet
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleUndo()
      } else if (e.key === '1') {
        selectPeriod(1)
      } else if (e.key === '2') {
        selectPeriod(2)
      } else if (e.key === '3') {
        selectPeriod(3)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, selectPeriod])

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
                onClick={() => selectPeriod(p.id)}
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
            shots={rinkShots}
            onAddShot={handleAddShot}
            renderShot={(shot) => <ShotMarker shot={shot} />}
          />
        </div>
      </main>

      {/* 4. ALAPALKKI: Toiminnot ja suorat erätilastot */}
      <footer className="shotmap-bottombar">
        {readOnly ? (
          <div className="shotmap-readonly" role="status">
            👁 Päätetty ottelu · merkinnyt {completerNames} · vain katselu
          </div>
        ) : (
        <div className="shotmap-bottombar__actions">
          <button
            type="button"
            className="action-btn action-btn--undo"
            onClick={handleUndo}
            disabled={ownDisplayedShots.length === 0 || isLocked}
            title="Peruuta viimeisin laukaus (Ctrl+Z)"
          >
            ↶ Peruuta ({ownDisplayedShots.length})
          </button>
          <button
            type="button"
            className="action-btn action-btn--clear"
            onClick={handleClearPeriod}
            disabled={ownDisplayedShots.length === 0 || isLocked}
            title="Tyhjennä nykyisen erän laukaukset"
          >
            Tyhjennä erä
          </button>
          {period !== 'all' && (
            <button
              type="button"
              className={`action-btn ${isLocked ? 'action-btn--unlock' : 'action-btn--save'}`}
              onClick={handleTogglePeriodLock}
              title={isLocked ? 'Avaa erän lukitus' : 'Tallenna erä (lukitsee erän)'}
            >
              {isLocked ? '🔓 Avaa lukitus' : '💾 Tallenna erä'}
            </button>
          )}
          {period === 'ja' && match && (
            <button
              type="button"
              className="action-btn action-btn--end-match"
              onClick={handleEndMatch}
              title="Päätä ottelu: lukitsee kaikki erät ja tallentaa tiedot"
            >
              🏁 Päätä ottelu
            </button>
          )}
        </div>
        )}

        <div className="shotmap-stats" role={period === 'all' ? 'group' : undefined} aria-label={period === 'all' ? 'Näytä kaukalolla' : undefined}>
          {STAT_PILLS.map(({ id, label, key }) =>
            period === 'all' ? (
              <button
                key={id}
                type="button"
                className={`stat-pill stat-pill--${id} stat-pill--filter${outcomeFilter === (id === 'total' ? 'all' : id) ? ' stat-pill--active' : ''}`}
                aria-pressed={outcomeFilter === (id === 'total' ? 'all' : id)}
                onClick={() => setOutcomeFilter(id === 'total' ? 'all' : id)}
                title={id === 'total' ? 'Näytä kaikki laukaukset' : `Näytä vain: ${label.toLowerCase()}`}
              >
                {label}: <b>{stats[key]}</b>
              </button>
            ) : (
              <span key={id} className={`stat-pill stat-pill--${id}`}>
                {label}: <b>{stats[key]}</b>
              </span>
            ),
          )}
        </div>
      </footer>
    </div>
  )
}

