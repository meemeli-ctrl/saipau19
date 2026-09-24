/**
 * Salibandykaukalo SVG:nä. Kaukalo on 20 m x 40 m, piirretään mittakaavassa
 * 10 px / m => viewBox 200 x 400. Näkyvissä on vain hyökkäyspää (yläpuolisko),
 * joten viewBox on 200 x 200. Pelisuunta ylöspäin (hyökätään yläpäätyyn).
 *
 * Laukaukset tallennetaan prosentteina (x, y välillä 0–100) kaukalon koosta,
 * joten ne skaalautuvat näytön koosta riippumatta.
 */
import { useRef } from 'react'
import { resolveOutcome } from './resolveOutcome'

const W = 200
const H = 400

/**
 * Muuntaa näytön koordinaatit (clientX/clientY) kaukalon viewBox-koordinaateiksi.
 *
 * TÄRKEÄ: älä laske tätä getBoundingClientRect():n avulla. SVG-elementin laatikko
 * ei ole sama kuin piirtoalue, koska preserveAspectRatio="xMidYMid meet" jättää
 * reunukset kun elementti ei ole neliö. SVG:n oma muunnosmatriisi huomioi
 * viewBoxin, reunukset, sivun vierityksen ja mahdolliset CSS-muunnokset tarkasti.
 */
function clientToRink(svg, clientX, clientY) {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const point = svg.createSVGPoint ? svg.createSVGPoint() : new DOMPoint()
  point.x = clientX
  point.y = clientY
  return point.matrixTransform(ctm.inverse())
}

// Ohjetekstien yhtenäinen tyyli – kaikki neljä samannäköisiä ja skaalautuvat
// kaukalon mukana, koska ne piirretään SVG:n sisään.
const HINT = {
  fontSize: 10,
  fontWeight: 700,
  fill: '#1a1a1a',
  opacity: 0.45,
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

function GoalEnd() {
  // Maaliviiva ~2.85 m päätyseinästä.
  const goalLineY = 30

  return (
    <g stroke="#000" strokeWidth="1.5" fill="none">
      {/* Maalivahdin alue (5 m x 4 m) - maaliviivalta keskustaan päin */}
      <rect x={W / 2 - 25} y={goalLineY} width={50} height={40} />
      {/* Maalialue (2.5 m x 1 m) maaliviivan edessä */}
      <rect x={W / 2 - 12.5} y={goalLineY} width={25} height={10} />
      {/* Maaliviiva */}
      <line x1={W / 2 - 25} y1={goalLineY} x2={W / 2 + 25} y2={goalLineY} />
      {/* Maali (1.6 m leveä) maaliviivan takana */}
      <rect x={W / 2 - 8} y={goalLineY - 7} width={16} height={7} fill="#000" />
    </g>
  )
}

export default function Rink({ shots = [], onAddShot, renderShot }) {
  // useRef, ei tavallinen olio: eleen aloituskohdan on säilyttävä myös silloin
  // kun komponentti renderöityy uudelleen kesken vedon.
  const svgRef = useRef(null)
  const touchStart = useRef({ x: 0, y: 0, time: 0, active: false })

  function addShotFromGesture(e) {
    const start = touchStart.current
    if (!onAddShot || !svgRef.current) return
    const deltaX = e.clientX - start.x
    const deltaY = e.clientY - start.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Vaatii vähintään 30 pikselin liikkeen
    if (distance < 30) return

    const outcome = resolveOutcome(deltaX, deltaY)

    // Merkki piirtyy siihen mistä veto alkoi, ei siihen mihin se päättyi.
    const local = clientToRink(svgRef.current, start.x, start.y)
    if (!local) return

    const x = (local.x / W) * 100
    const y = (local.y / (H / 2)) * 100

    // Kaukalon ulkopuolelta (reunusten päältä) alkaneita vetoja ei kirjata.
    if (x < 0 || x > 100 || y < 0 || y > 100) return
    onAddShot({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), outcome })
  }

  function handlePointerDown(e) {
    if (!onAddShot || !e.isPrimary) return
    touchStart.current = { x: e.clientX, y: e.clientY, time: Date.now(), active: true }
    // Pointer capture: veto saa päättyä kaukalon ulkopuolelle (esim. "Maali →"
    // reunan lähellä) ilman että laukaus katoaa.
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function handlePointerUp(e) {
    if (!touchStart.current.active) return
    touchStart.current.active = false
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    addShotFromGesture(e)
  }

  function handlePointerCancel() {
    touchStart.current.active = false
  }

  return (
    <svg
      ref={svgRef}
      className="rink"
      viewBox={`0 0 ${W} ${H / 2}`}
      role="img"
      aria-label="Salibandykaukalo"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Kaukalon pinta - vain puolet */}
      <rect
        x="1"
        y="1"
        width={W - 2}
        height={H / 2 - 2}
        rx="28"
        fill="#eef4ff"
        stroke="#000"
        strokeWidth="2"
      />

      {/* Keskiviiva (alalaidassa) */}
      <line
        x1="20"
        y1={H / 2 - 1}
        x2={W - 20}
        y2={H / 2 - 1}
        stroke="#000"
        strokeWidth="1.5"
        strokeDasharray="5,5"
      />

      {/* Maali ja maalivahdin alue */}
      <GoalEnd />

      {/* Ohjetekstit – kaikki neljä samannäköisiä */}
      {/* "Ohi" ylälaidassa, maalin takana (päätyseinän ja maalin välissä) */}
      <text x={W / 2} y="12" textAnchor="middle" {...HINT}>↑ Ohi</text>
      <text x={W / 2} y={H / 2 - 14} textAnchor="middle" {...HINT}>Blokki ↓</text>
      <text x="10" y={H / 4} textAnchor="start" {...HINT}>← Torjunta</text>
      <text x={W - 10} y={H / 4} textAnchor="end" {...HINT}>Maali →</text>

      {/* Laukaukset */}
      {shots.map((shot) => {
        const marker = renderShot?.(shot)
        if (!marker) return null
        return (
          <g
            key={shot.id}
            transform={`translate(${(shot.x / 100) * W} ${(shot.y / 100) * (H / 2)})`}
          >
            {marker}
          </g>
        )
      })}
    </svg>
  )
}
