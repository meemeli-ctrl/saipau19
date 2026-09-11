# SaiPa 19 – Joukkuesovellus

Moderni React + Vite -sovellus salibandyjoukkueen tueksi. Alkunäkymässä
valitaan **peli** salibandyn tulospalvelusta, minkä jälkeen avautuu
**laukaisukartta**, johon merkitään laukaukset kaukalokartalle.

## Ominaisuudet

- **Pelin valinta alkunäkymässä**: SaiPan ottelut *U19 Pojat 1. divisioonasta*
  haetaan suoraan Salibandyliiton tulospalvelusta (Torneopal). Seuraava peli on
  korostettu. Voit myös jatkaa "ilman peliä".
- Kunkin pelin laukaukset tallentuvat omaan koriinsa (`matchId`), joten eri
  ottelut eivät sekoitu.
- Interaktiivinen SVG-salibandykaukalo (20 m × 40 m mittakaavassa)
- Laukauksen lisäys vetämällä: vedon suunta määrää lopputuloksen
  (maali / torjunta / ohi / blokattu)
- Tallennus **Firebase Firestoreen** – ilman konfiguraatiota tiedot menevät selaimen localStorageen

## Tulospalvelurajapinta

Sovellus käyttää Salibandyliiton julkista Torneopal/Taso-rajapintaa
(`salibandy-api.torneopal.net`) samalla julkisella avaimella kuin virallinen
`tulospalvelu.salibandy.fi`. Toimii ilman konfiguraatiota.

Kausikohtainen sarjatunnus vaihtuu vuosittain – ensi kaudeksi päivitä
[`src/api/tulospalvelu.js`](src/api/tulospalvelu.js):n `COMPETITION_ID` tai
aseta `.env`-tiedostoon:

```
VITE_TORNEOPAL_COMPETITION_ID=sb2027
VITE_TORNEOPAL_CATEGORY_ID=580
VITE_TORNEOPAL_TEAM_ID=29558
```

## Kehitys

```bash
npm install
npm run dev
```

Sovellus avautuu osoitteeseen http://localhost:5173

## Firebase-käyttöönotto

1. Luo projekti [Firebase-konsolissa](https://console.firebase.google.com/) ja ota **Firestore Database** käyttöön.
2. Kopioi web-sovelluksen asetukset: `cp .env.example .env`
3. Täytä `.env`-tiedoston `VITE_FIREBASE_*`-arvot Firebase-konsolista.
4. Käynnistä `npm run dev` uudelleen.

Laukaukset tallennetaan `shots`-kokoelmaan. Kehitysvaiheen Firestore-säännöt:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shots/{doc} {
      allow read, write: if true; // kiristä ennen tuotantoa
    }
  }
}
```

## Rakenne

| Polku | Kuvaus |
| --- | --- |
| `src/data/team.js` | Joukkueen pelaajalista ja lopputulosmääritykset – **muokkaa tähän oma joukkueesi** |
| `src/api/tulospalvelu.js` | Rajapinta salibandyn tulospalveluun (sarja + joukkue) |
| `src/hooks/useMatches.js` | Otteluiden haku ja välimuisti |
| `src/components/StartView.jsx` | Alkunäkymä: pelin valinta |
| `src/components/Rink.jsx` | Kaukalon SVG-piirto |
| `src/components/ShotMap.jsx` | Laukaisukartan käyttöliittymä |
| `src/hooks/useShots.js` | Laukausten tila per peli (Firestore / localStorage) |
| `src/firebase.js` | Firebase-alustus |

## Teknologiat

Vite 8 · React 19 · Firebase 12
