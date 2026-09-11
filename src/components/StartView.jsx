import { useMatches } from '../hooks/useMatches'
import { CATEGORY_NAME } from '../api/tulospalvelu'
import { formatMatchDate } from '../matchFormat'
import { TEAM_NAME } from '../data/team'

function MatchRow({ match, highlight, onSelect }) {
  return (
    <button
      type="button"
      className={`match-row${highlight ? ' match-row--next' : ''}`}
      onClick={() => onSelect(match)}
    >
      <span className="match-row__date">
        {formatMatchDate(match.date, match.time)}
        {highlight && <span className="match-row__badge">Seuraava</span>}
      </span>
      <span className="match-row__teams">
        <span className={match.saipaHome ? 'match-row__saipa' : ''}>{match.home}</span>
        <span className="match-row__vs">
          {match.played ? `${match.scoreHome}–${match.scoreAway}` : '–'}
        </span>
        <span className={!match.saipaHome ? 'match-row__saipa' : ''}>{match.away}</span>
      </span>
      {(match.venue || match.city) && (
        <span className="match-row__venue">
          {[match.venue, match.city].filter(Boolean).join(', ')}
        </span>
      )}
    </button>
  )
}

export default function StartView({ user, onLogout, onSelectMatch, onSkip }) {
  const { upcoming, past, next, loading, error, refresh } = useMatches()

  return (
    <div className="startview">
      <div className="startview__card">
        {user && (
          <div className="user-status-bar">
            <span className="user-status-bar__name">
              👤 <b>{user.displayName || user.email?.replace(/@saipau19\.app$/, '')}</b>
            </span>
            <button type="button" className="user-status-bar__logout" onClick={onLogout}>
              Kirjaudu ulos
            </button>
          </div>
        )}

        <header className="startview__head">
          <h1>{TEAM_NAME}</h1>
          <p className="startview__series">{CATEGORY_NAME}</p>
          <p className="startview__lead">Valitse peli, jonka laukaukset merkitset.</p>
        </header>


        {loading && upcoming.length === 0 && past.length === 0 && (
          <p className="startview__note">Haetaan otteluita tulospalvelusta…</p>
        )}

        {error && (
          <p className="startview__note startview__note--error">
            {error}
            <button type="button" className="link-button" onClick={refresh}>
              Yritä uudelleen
            </button>
          </p>
        )}

        {upcoming.length > 0 && (
          <section>
            <h2 className="startview__subhead">Tulevat pelit</h2>
            <div className="match-list">
              {upcoming.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  highlight={next && m.id === next.id}
                  onSelect={onSelectMatch}
                />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="startview__subhead">Pelatut</h2>
            <div className="match-list">
              {past.slice(0, 6).map((m) => (
                <MatchRow key={m.id} match={m} onSelect={onSelectMatch} />
              ))}
            </div>
          </section>
        )}

        <button type="button" className="startview__skip" onClick={onSkip}>
          Jatka ilman peliä →
        </button>
      </div>
    </div>
  )
}
