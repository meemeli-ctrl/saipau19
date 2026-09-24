// Vedon suunta -> lopputulos. Näytön y-akseli kasvaa alaspäin.
// Ylös: -90°, Oikea: 0°, Alas: 90°, Vasemmalle: 180° tai -180°
export function resolveOutcome(deltaX, deltaY) {
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  if (angle > -45 && angle < 45) {
    return 'goal' // Oikealle = maali
  } else if (angle >= 45 && angle < 135) {
    return 'block' // Alas = blokki
  } else if (angle > -135 && angle <= -45) {
    return 'miss' // Ylös = ohi
  } else {
    return 'save' // Vasemmalle = torjunta
  }
}
