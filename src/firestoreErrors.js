// Firestore-virheet käyttäjälle ymmärrettäviksi viesteiksi.
//
// Tärkein tapaus: tunnus on olemassa, mutta sillä ei ole käyttöoikeutta.
// Offline-tilassa tallennus näyttää onnistuvan, ja hylkäys tulee vasta kun
// yhteys palaa – siksi virhe pitää näyttää, ei niellä hiljaa.
export function describeFirestoreError(err) {
  switch (err?.code) {
    case 'permission-denied':
      return 'Tunnuksellasi ei ole käyttöoikeutta. Merkinnät eivät tallennu. Pyydä ylläpitäjää lisäämään tunnuksesi.'
    case 'unauthenticated':
      return 'Kirjautuminen on vanhentunut. Kirjaudu ulos ja uudelleen sisään.'
    case 'resource-exhausted':
      return 'Tietokannan käyttöraja on täynnä. Yritä hetken kuluttua uudelleen.'
    default:
      return 'Tallennus pilveen epäonnistui. Tarkista yhteys – merkinnät voivat kadota.'
  }
}
