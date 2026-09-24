# SaiPa 19 Laukaisukartta – arkkitehtuuri ja toimintaperiaate

Tämä dokumentti kuvaa miten sovellus toimii ja miten se on rakennettu, jotta
seuraavat kehitystehtävät voi suunnitella (esim. Geminissä) ja antaa AI-koodaus-
avustimelle tarkka, rajattu tehtävä. Tila: 24.9.2026, commit `2d865e0`.

---

## 1. Mitä sovellus tekee

Salibandyvalmentaja merkitsee ottelun aikana SaiPa U19 -joukkueen laukaukset
kaukalokartalle puhelimella tai tabletilla.

1. **Kirjautuminen** – Firebase Auth (sähköposti/salasana tai Google).
2. **Pelin valinta** – SaiPan U19 Pojat 1. divisioonan ottelut haetaan Salibandy-
   liiton tulospalvelusta. Seuraava peli korostetaan. Voi myös jatkaa "ilman peliä".
3. **Laukaisukartta** – valmentaja painaa kaukaloa kohdasta josta laukaus lähti ja
   **vetää sormella suuntaan**, joka kertoo lopputuloksen:

   | Veto | Lopputulos | Merkki |
   |---|---|---|
   | → oikealle | Maali | vihreä täytetty ympyrä |
   | ← vasemmalle | Torjunta | sininen rengas |
   | ↑ ylös | Ohi | keltainen risti |
   | ↓ alas | Blokki | punainen kolmio |

4. **Erät** – 1., 2., 3., JA (jatkoaika) ja Kaikki-näkymä. Jokaisella erällä oma
   laskuri ja tilastot.
5. **Erän tallennus** – lukitsee erän (ei lisäyksiä/poistoja). Lukituksen voi avata.
6. **Päätä ottelu** – näkyy vain JA-erässä. Lukitsee kaikki erät ja tallentaa
   ottelun koosteen (laukaukset + tulospalvelun ottelutiedot) talteen.

---

## 2. Teknologiat

| Osa | Valinta |
|---|---|
| Käyttöliittymä | React 19, pelkät funktiokomponentit ja hookit, ei reititintä |
| Build | Vite 8 |
| Tyylit | Yksi `src/App.css` (glassmorphism), ei CSS-kirjastoa |
| Kaukalo | Käsin kirjoitettu SVG (`Rink.jsx`) |
| Tietokanta | Firebase Firestore, pysyvä IndexedDB-offline-välimuisti |
| Kirjautuminen | Firebase Authentication |
| Julkaisu | Firebase Hosting → https://saipau19.web.app |
| Ottelutiedot | Torneopal / Taso REST API (salibandyn tulospalvelu) |
| Lint | oxlint (`npm run lint`) |
| Testit | **ei yhtään** (ks. kohta 9) |

Jos `.env` puuttuu (ei Firebase-avaimia), sovellus toimii **paikallisessa tilassa**
ja tallentaa kaiken selaimen localStorageen. Tuotannossa Firebase on aina päällä.

---

## 3. Tiedostorakenne

```
src/
├── main.jsx              React-juuri
├── App.jsx               Näkymien vaihto: Login → StartView → ShotMap
├── App.css               Kaikki tyylit (≈900 riviä)
├── index.css             Perustokenit ja body
├── firebase.js           Firebase-alustus + offline-välimuisti
├── matchFormat.js        Päivämäärän muotoilu ("la 12.9. klo 14:00")
├── api/
│   └── tulospalvelu.js   Torneopal-rajapinta: ottelut, ottelun tiedot
├── hooks/
│   ├── useMatches.js     Ottelulista + 10 min localStorage-välimuisti
│   └── useShots.js       Laukaukset, erälukitukset, ottelun päättäminen
├── components/
│   ├── LoginView.jsx     Kirjautumislomake
│   ├── StartView.jsx     Pelin valinta
│   ├── ShotMap.jsx       Päänäkymä: ylä-, erä- ja alapalkki + kaukalo
│   └── Rink.jsx          SVG-kaukalo ja vetoeleen tunnistus
└── data/
    └── team.js           Joukkueen nimi, lopputulosten värit/nimet

firebase.json             Hosting (dist/) + Firestore-sääntöjen sijainti
firestore.rules           Tietokannan käyttöoikeudet
AGENTS.md / CLAUDE.md     AI-avustimien työskentelysäännöt (ks. kohta 7)
.github/workflows/        GitHub Actions CI
```

Koko lähdekoodi on ≈1 450 riviä. Pieni sovellus – yksi tehtävä kerrallaan on
realistista kuvata tarkasti.

---

## 4. Näkymät ja tilanhallinta

`App.jsx` päättää mitä näytetään, kolmen tilamuuttujan perusteella:

```
authReady = false         → "Ladataan sovellusta…"
user = null               → LoginView
selected = null           → StartView   (pelin valinta)
muuten                    → ShotMap     (laukaisukartta)
```

- `selected` alkaa **aina** `null`:ina – jokaisen kirjautumisen tai sivun
  latauksen jälkeen valitaan peli uudestaan (tarkoituksellinen, estää merkinnät
  väärään otteluun). Uloskirjautuminen nollaa valinnan.
- Ei globaalia tilaa (ei Reduxia/Contextia). Data kulkee propseina ja hookeista.

### ShotMap.jsx:n rakenne

```
┌ Yläpalkki:   ‹ Vaihda peli │ SaiPa vs Welhot, pvm │ käyttäjä, Ulos
├ Eräpalkki:   1. erä │ 2. erä │ 3. erä │ JA │ Kaikki   (laskuri + 🔒)
├ Kaukalo:     Rink.jsx
└ Alapalkki:   Peruuta │ Tyhjennä erä │ Tallenna erä / Avaa lukitus │ [JA:] Päätä ottelu
               + tilastot: Maalit, Torjunnat, Ohit, Blokit, Yht
```

Pikanäppäimet: `Ctrl/Cmd+Z` peruuta, `1`/`2`/`3` vaihda erää.

---

## 5. Kaukalo ja vetoeleen tunnistus (`Rink.jsx`)

- SVG, `viewBox="0 0 200 200"` = kaukalon **hyökkäyspää** (20 m × 20 m, 10 px/m).
  Maali yläpäädyssä, hyökkäyssuunta ylöspäin.
- Maaliviiva y=30. Maali 16×7 viivan takana. Maalivahdin alue 50×40 ja
  maalialue 25×10, molemmat maaliviivalta keskustaan päin.
- **Laukaus tallennetaan prosentteina** (`x`, `y` välillä 0–100) → skaalautuu
  mihin tahansa näyttöön.
- **Kriittinen yksityiskohta:** kosketuspiste muunnetaan kaukalon koordinaateiksi
  SVG:n omalla `getScreenCTM().inverse()`-matriisilla, **ei** `getBoundingClientRect()`:lla.
  Syy: `preserveAspectRatio` jättää reunukset, ja vanha tapa heitti merkkiä jopa
  173 px. Älä muuta tätä.
- Pointer Events + `setPointerCapture` → veto saa päättyä kaukalon ulkopuolelle.
- Veto alle 30 px ohitetaan. Merkki piirtyy **vedon alkupisteeseen**.
- Suunta: `atan2`-kulma neljään 90°:n sektoriin.

---

## 6. Data

### 6.1 Ottelut – Torneopal API (`src/api/tulospalvelu.js`)

| Asia | Arvo |
|---|---|
| Osoite | `https://salibandy-api.torneopal.net/taso/rest` |
| Avain | `Accept: json/<avain>` -otsakkeessa (ei query-parametrina!) |
| Sarja | `competition_id=sb2026`, `category_id=580` (U19 Pojat 1. div.) |
| SaiPa | `team_id=29558` |
| Kutsut | `getMatches` (ottelulista), `getMatch` (yhden ottelun tiedot) |

⚠️ `competition_id` on **kausikohtainen** (`sb2026` = kausi 2026–27). Vaihdettava
joka kausi. Kaikki tunnisteet voi ohittaa `.env`:ssä (`VITE_TORNEOPAL_*`).
Avain on sama julkinen lukuavain jota virallinen tulospalvelu käyttää selaimessa.

### 6.2 Firestore-kokoelmat

**`shots`** – yksi dokumentti per laukaus (dokumentti-id automaattinen)

```js
{ x: 42.5, y: 31.2,            // prosentteina
  outcome: 'goal'|'save'|'miss'|'block',
  period: 1|2|3|'ja',
  matchId: '938971' | null,    // null = "ilman peliä"
  userId, userEmail,           // kuka merkitsi
  playerNumber: null, playerName: 'Penkki',   // ei vielä käytössä
  createdAt: serverTimestamp }
```

**`locked_periods`** – id: `{matchId|default}_{period}_{uid}`

```js
{ matchId, userId, period, lockedAt }
```

**`completed_matches`** – id: `{matchId}_{uid}`

```js
{ matchId, userId, userEmail, matchInfo, shots: [...], apiData, completedAt }
```

### 6.3 Tärkeät datasäännöt

- **Kaikki on käyttäjäkohtaista.** Jokainen valmentaja näkee, lukitsee ja
  tyhjentää vain omat merkintänsä. Suodatus tehdään selaimessa (`userId === user.uid`).
- **Hook lukee koko `shots`-kokoelman** ja suodattaa muistissa. Toimii nyt, mutta
  hidastuu kun dataa kertyy satoja otteluita (ks. kohta 9).
- Offline: `persistentLocalCache` – synkronoitu data säilyy verkkokatkoksessa ja
  sivun uudelleenlatauksessa, kirjoitukset jonottuvat kunnes yhteys palaa.
- Tietokanta tyhjennettiin 12.9.2026 (kaikki oli testidataa).

### 6.4 Käyttöoikeudet (`firestore.rules`)

Kaikkiin kolmeen kokoelmaan: luku ja kirjoitus sallittu **vain sallittujen
sähköpostien listalla oleville** (`isAllowedUser()`). Uusi käyttäjä lisätään
kirjoittamalla sähköposti listaan ja julkaisemalla säännöt.

---

## 7. Kehitysputki: paikallinen → GitHub → Firebase

```
 Paikallinen työkopio          GitHub                    Firebase (tuotanto)
 /Users/junas/saipau19   ──►   meemeli-ctrl/saipau19 ──►  saipau19.web.app
 muokkaus, npm run dev         git commit + git push       npm run build
                               (oma käsky)                 firebase deploy
                                                           (eri käsky)
```

### Säännöt (AGENTS.md, koskee kaikkia AI-avustimia)

1. **Muokkaus paikallisesti** – aina vapaasti.
2. **Commit + push GitHubiin** – vain käyttäjän nimenomaisesta käskystä.
3. **Firebase-julkaisu** – vain **erillisestä** käskystä, ja se tehdään siitä mitä
   GitHubissa on (paikallinen = GitHub ennen deployta).

Työtilassa on ollut samaan aikaan käytössä Claude Code, Antigravity ja GitHub
Copilot. Ne ovat kirjoittaneet toistensa päälle (tiedostoja on palautunut
kesken työn useita kertoja). Tästä syystä: **yksi avustin kerrallaan per tehtävä,
ja commit heti kun jokin toimii.**

### Komennot

```bash
npm run dev -- --host          # kehityspalvelin, näkyy myös puhelimelle samassa wifissä
npm run build                  # tuotantobuild dist/-kansioon
npm run lint                   # oxlint
git status / git diff          # mitä on muuttunut viimeisen commitin jälkeen
git add -A && git commit -m "…" && git push origin main
npx firebase-tools deploy --only hosting,firestore:rules
```

Salaisuudet: `.env` (Firebase-avaimet) ja `ohje.md` (tunnukset) ovat
`.gitignore`:ssa – eivät koskaan GitHubiin.

---

## 8. Ulkoasu

- **Värit:** SaiPan viralliset (vahvistettu saipa.fi:n omasta CSS:stä):
  kelta `#ffe900`, musta `#000000`, valkoinen. Tummempi kelta `#e6d200`.
  **Ei sinistä.**
- **Poikkeus:** laukaustulosten värit (vihreä/sininen/keltainen/punainen) ovat
  tiedon koodausta, eivät brändiä – niitä ei pakoteta kelta-mustiksi.
- **Glassmorphism** vain ylä-, erä- ja alapalkeissa. Kaukalo on tarkoituksella
  umpinainen ja terävä. Ensisijaiset napit ovat umpinaisia, eivät lasisia.
- Painikkeiden minimikorkeus 44 px (kosketus kaukalon laidalla).
- Prioriteetit kaikessa kehityksessä: **1. käytettävyys, 2. nopeus,
  3. käyttövarmuus/datan tallennus, 4. näyttävyys.**

---

## 9. Tunnetut ongelmat ja tekninen velka

Järjestetty vakavuuden mukaan. Nämä ovat hyviä seuraavia tehtäviä.

1. **Tietoturva – kunnossa (24.9.).** Uusien tilien luonti on estetty Firebase
   Authissa, ja Firestore-säännöt päästävät dataan vain sallitut tilit. Repo on
   julkinen, joten henkilökohtaiset osoitteet ovat säännöissä uid:nä, eivät
   sähköpostina. Julkinen yhteysosoite: meemeli.kahkonen@gmail.com.
2. **CI on rikki joka pushilla.** `.github/workflows/node.js.yml` ajaa `npm test`,
   mutta testiskriptiä ei ole. Lisäksi Node 18 on matriisissa, vaikka Vite 8
   vaatii uudemman Noden.
3. **Ei yhtään testiä.** Kriittisimmät testattavat: vetoeleen suunnantunnistus ja
   koordinaattimuunnos (`Rink.jsx`), erälukituksen logiikka (`useShots.js`).
4. **Käyttäjät:** sallitut tilit on lueteltu `firestore.rules`:ssa (uid- tai
   sähköpostilista). Koska uusien tilien luonti on estetty, uusi käyttäjä pitää
   sekä luoda Firebase Authiin konsolista että lisätä sääntöihin.
5. **Koko `shots`-kokoelma luetaan aina.** Pitäisi kysyä Firestoresta suoraan
   `where('matchId','==',…)` ja `where('userId','==',…)`. Myös `clearShots`
   hakee kaiken ennen poistoa.
6. **Pelaajatieto puuttuu.** `playerNumber`/`playerName` ovat kentissä, mutta
   kaikki merkinnät ovat "Penkki". `team.js`:ssä on paikkamerkkipelaajat.
7. **Valmentajanäkymä puuttuu.** `completed_matches` tallentuu, mutta mikään ei
   vielä lue tai näytä sitä.
8. **`SECURITY.md`** on GitHubin pohja muuttamattomana (väärät versionumerot).
9. **JS-paketti 838 kB** – Firebase on iso. Koodin pilkkominen auttaisi
   ensilatausta huonolla yhteydellä.
10. Yksi harmiton lint-varoitus `useShots.js:59` (setState effectissä).

---

## 10. Miten kirjoittaa hyvä prompti tälle projektille

Mallipohja jonka voi täyttää Geminissä:

```
Tehtävä: <yksi asia, esim. "Lisää pelaajan valinta ennen vetoa">
Miksi: <käyttäjän tarve kaukalon laidalla>
Rajaus: koske vain tiedostoihin <X, Y>. Älä muuta <Rink.jsx:n koordinaattimuunnosta /
        värejä / muuta>.
Hyväksymiskriteerit:
  - <mitä pitää voida tehdä>
  - <mikä ei saa rikkoutua>
Prioriteetit: käytettävyys > nopeus > käyttövarmuus > näyttävyys.
Värit: vain SaiPan kelta #ffe900 / musta / valkoinen.
Tee muutos paikallisesti. Älä committaa äläkä julkaise ennen kuin pyydän.
```

Vinkit:
- **Yksi tehtävä per prompti.** Tämän projektin historia osoittaa, että laajat
  pyynnöt ja rinnakkaiset avustimet tuottavat päällekkäisiä muutoksia.
- **Nimeä tiedostot** kohdan 3 kartasta – nopeuttaa ja rajaa.
- **Kerro mitä ei saa muuttaa.** Erityisesti kaukalon koordinaattimuunnos,
  käyttäjäkohtainen datamalli ja julkaisusäännöt.
- **Pyydä todennus**: "testaa selaimessa ja näytä kuva" on tuottanut luotettavimmat
  tulokset.
- **Datamuutos = tietokantamuutos.** Jos uusi ominaisuus lisää kenttiä tai
  kokoelmia, mainitse että myös `firestore.rules` pitää päivittää ja julkaista –
  muuten ominaisuus epäonnistuu tuotannossa äänettömästi (näin kävi kerran).
