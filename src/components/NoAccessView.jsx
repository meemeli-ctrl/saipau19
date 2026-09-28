// Näytetään, kun tunnus on olemassa, mutta sille ei ole annettu käyttöoikeutta.
export default function NoAccessView({ user, onLogout }) {
  return (
    <div className="startview">
      <div className="startview__card">
        <header className="startview__head">
          <h1>Ei käyttöoikeutta</h1>
          <p className="startview__lead">
            Tunnuksella <b>{user?.email}</b> ei ole vielä käyttöoikeutta laukaisukarttaan.
            Merkinnät eivät tallentuisi.
          </p>
          <p className="startview__lead">
            Pyydä ylläpitäjää lisäämään tunnuksesi. Kun oikeus on annettu, kirjaudu
            ulos ja uudelleen sisään.
          </p>
        </header>
        <button type="button" className="startview__skip" onClick={onLogout}>
          Kirjaudu ulos
        </button>
      </div>
    </div>
  )
}
