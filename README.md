# SaiPa 19 – Joukkuesovellus

Moderni React + Vite -sovellus salibandyjoukkueen tueksi. Alkunäkymässä
valitaan **peli** salibandyn tulospalvelusta, minkä jälkeen avautuu
**laukaisukartta**, johon merkitään laukaukset kaukalokartalle.

> **Useampi AI-avustin muokkaa tätä repoa (Claude Code, Antigravity, Copilot).**
> Kaikkien pitää noudattaa tiedostoa [AGENTS.md](AGENTS.md): muokkaus
> paikallisesti vapaasti, mutta GitHub-push ja Firebase-julkaisu vain
> erillisestä, nimenomaisesta pyynnöstä.

Tarkempi kuvaus rakenteesta, datamallista ja kehitysputkesta:
[ARKKITEHTUURI.md](ARKKITEHTUURI.md).

## Ominaisuudet

- **Pelin valinta alkunäkymässä**: SaiPan ottelut *U19 Pojat 1. divisioonasta*
  haetaan suoraan Salibandyliiton tulospalvelusta (Torneopal). Seuraava peli on
  korostettu. Voit myös jatkaa "ilman peliä".
- Kunkin pelin laukaukset tallentuvat omaan koriinsa (`matchId`), joten eri
  ottelut eivät sekoitu.
- SVG-kaukalon hyökkäyspää mittakaavassa (20 m × 20 m)
- Laukauksen lisäys vetämällä: vedon suunta määrää lopputuloksen
  (→ maali, ← torjunta, ↑ ohi, ↓ blokki)
- Erät (1., 2., 3., JA), erän tallennus ja lukituksen avaus, "Päätä ottelu" JA-erässä
- Tallennus **Firebase Firestoreen**, toimii myös ilman verkkoa (offline-välimuisti).
  Ilman Firebase-konfiguraatiota tiedot menevät selaimen localStorageen.

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
npm run dev -- --host   # näkyy myös puhelimelle samassa wifissä
npm test                # testit (Vitest)
npm run lint            # oxlint
npm run build           # tuotantobuild dist/-kansioon
```

Sovellus avautuu osoitteeseen http://localhost:5173. GitHub Actions ajaa lintin,
testit ja buildin jokaisella pushilla.

## Firebase-käyttöönotto

1. Luo projekti [Firebase-konsolissa](https://console.firebase.google.com/) ja ota **Firestore Database** käyttöön.
2. Kopioi web-sovelluksen asetukset: `cp .env.example .env`
3. Täytä `.env`-tiedoston `VITE_FIREBASE_*`-arvot Firebase-konsolista.
4. Käynnistä `npm run dev` uudelleen.

Tietokannan käyttöoikeudet ovat tiedostossa [`firestore.rules`](firestore.rules):
dataan pääsevät vain siellä luetellut tilit. Uusien tilien luonti on estetty
Firebase Authissa, joten uusi käyttäjä pitää luoda konsolista **ja** lisätä
sääntöihin, minkä jälkeen säännöt julkaistaan:

```bash
npx firebase-tools deploy --only firestore:rules
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
