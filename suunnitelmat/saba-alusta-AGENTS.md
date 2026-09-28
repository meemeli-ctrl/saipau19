# Agent Guidelines: saba-alusta

Salibandyjoukkueen valmennussovellus: React 19 + Vite + TypeScript SPA,
taustajärjestelmänä Firebase (Auth, Firestore, Hosting).

Lue ennen muutoksia:
- [docs/architecture.md](docs/architecture.md): periaatteet, kerrokset, `src/`-rakenne
- [docs/firestore-data-model.md](docs/firestore-data-model.md): kokoelmat ja kentät
- [docs/auth-and-roles.md](docs/auth-and-roles.md): roolit, reittisuojat, säännöt
- [docs/roadmap.md](docs/roadmap.md): mitä on tehty ja missä järjestyksessä edetään

## Komennot

- **Kehityspalvelin:** `npm run dev`
- **Build + tyyppitarkistus:** `npm run build` (`tsc -b && vite build`)
- **Lint:** `npm run lint`
- **Emulaattorit:** `firebase emulators:start --project demo-saba-alusta`
  (Auth 9099, Firestore 8080, UI; vaatii Javan). Aseta `.env.local`-tiedostoon
  `VITE_USE_EMULATORS=true`. Ilman `VITE_FIREBASE_PROJECT_ID`-muuttujaa sovellus
  käyttää projektia `demo-saba-alusta`. Sähköpostilinkit näkyvät emulaattorin
  lokissa.
- **Deploy:** `npm run build && firebase deploy`. Säännöt ja indeksit erikseen:
  `firebase deploy --only firestore:rules,firestore:indexes`.
- Paketinhallinta on **npm** (`package-lock.json`). Älä käytä yarnia tai pnpm:ää.
- **Sääntötestit:** `npm run test:rules`. Komento käynnistää Firestore-emulaattorin
  (`firebase emulators:exec`, vaatii Javan) ja ajaa `vitest run tests/rules`.
  - `tests/rules/setup.ts`: testiympäristö, kontekstit (owner/coach Google,
    coach sähköpostilinkillä, player `p1`, toinen pelaaja, kutsuttu,
    kirjautumaton) ja alustusdata (`withSecurityRulesDisabled`).
  - `tests/rules/current.test.ts`: nykyisten sääntöjen odotettu käytös. Näiden
    pitää mennä läpi.
  - `tests/rules/knownGaps.test.ts`: tunnetut aukot, merkitty `it.fails`.
    Kun korjaat säännön, testi alkaa epäonnistua. Vaihda se silloin
    `it`-testiksi ja siirrä tiedostoon `current.test.ts`.
  - Testit tyhjentävät emulaattorin (`clearFirestore`). Jos
    `firebase emulators:start` on jo käynnissä portissa 8080, `test:rules`
    ei käynnisty ("port taken"). **Älä sammuta käyttäjän emulaattoria** äläkä
    aja testejä sitä vasten, koska se tuhoaisi käyttäjän testidatan. Käytä
    erillistä konfiguraatiota muissa porteissa (`firebase --config <tiedosto>
    emulators:exec …`), tai pyydä käyttäjää sammuttamaan emulaattori.
  - Sähköpostilinkillä kirjautuneen tokenissa `sign_in_provider` on `password`.
- Uusi sääntö tai kokoelma vaatii testin samassa muutoksessa: sallittu
  tapaus ja vähintään yksi hylätty tapaus.

Aja `npm run build`, `npm run lint` ja (kun muutat `firestore.rules`-tiedostoa)
`npm run test:rules` ennen kuin ilmoitat muutoksen valmiiksi.

## Arkkitehtuurisäännöt

- **Kerrokset:** `app → features → shared → domain`. Riippuvuudet kulkevat vain
  tähän suuntaan.
- **`domain/`** ei importtaa Reactia eikä Firebase SDK:ta (poikkeus:
  `domain/converters`). Päivämäärät ovat domain-tyypeissä `Date`-tyyppiä.
- **Feature ei importtaa toisen featuren sisäisiä tiedostoja**, vain sen
  `index.ts`:n. Poikkeus: `src/app/router.tsx` lazy-importtaa
  `features/*/routes/*`-moduulit suoraan, ja jokainen reittimoduuli exportaa
  `Component`-komponentin.
- **Reititys:** react-router v8. `RouterProvider` importataan paketista
  `react-router/dom`, muu paketista `react-router`. Oikeuksia vaativat reitit
  sijoitetaan `RequireAuth`-, `TeamLayout`- ja `RequireCoach`-suojien alle
  (docs/auth-and-roles.md).
- **Kirjautumistieto:** `useAuth()` ja `useMembership()` featuresta
  `@/features/auth`. Valmentajan tarkistus tehdään aina `isCoach`-arvolla,
  ei pelkällä `member.role`-kentällä.
- **Firestore-kutsut vain `features/*/api/`-kansioissa.** Komponentit käyttävät
  hookeja.
- **Kenttäkoordinaatit ovat aina 0–1.** Muunnos pikseleiksi tehdään vain
  `shared/rink`-kansiossa.
- **Kaikki data on `teams/{teamId}`-dokumentin alla** (poikkeukset: `users`,
  `publicViews`).
- **Pelaaja ≠ käyttäjä:** `players/{id}` on urheilija, `members/{uid}` on tili.
  Älä sekoita ID:itä.

## Tietoturva ja tietosuoja

- **`firestore.rules` on varsinainen suojaus.** Reittisuojat ovat vain
  käyttökokemusta. Jokainen uusi kokoelma tai polku vaatii säännön samassa
  muutoksessa.
- **Älä koskaan lisää teams-tasolle rekursiivista `match /{c}/{d=**}`-sääntöä.**
  Säännöt yhdistetään TAI-ehdolla, joten se avaisi health-datan kaikille
  jäsenille.
- **Terveystieto** (diagnoosi, toipuminen, kipu, wellness) kuuluu vain
  kokoelmiin `players/{id}/health` ja `wellness`, ja niitä lukee vain
  `features/health` (ja `player-portal` omalta osaltaan). Muualla käytetään
  `players/{id}.availability`-kenttää. Terveystietoa ei koskaan kopioida
  `publicViews`-payloadiin, lokeihin tai analytiikkaan.
- **Valmentajaoikeudet** edellyttävät roolia `owner`/`coach` **ja**
  Google-kirjautumista.
- **`VITE_`-muuttujat ovat julkisia.** Salaisuudet (esim. MyClub-API-avain)
  kuuluvat vain Cloud Functions -secreteihin.
- Collection group -kyselyissä (esim. `lineups`) on aina oltava
  `where('teamId', '==', …)`.
- Jokainen kirjoitussääntö validoi kentät (keys().hasOnly, tyypit, arvoalueet),
  polusta johdettavat kentät (teamId, eventId, uid) tarkistetaan polkua vasten,
  ja jokaiselle säännölle kirjoitetaan testi. Päällekkäiset säännöt
  yhdistetään TAI-ehdolla: tarkista, ettei polkuun osu löysempää sääntöä.

## Tietomallin muutokset

Uusi kokoelma tai kenttä vaatii **samassa muutoksessa**:
1. tyypin `src/domain/types/`-kansioon (ja exportin `index.ts`:ään)
2. zod-skeeman `src/domain/schemas/`-kansioon ja converterin
   `src/domain/converters/`-kansioon
3. säännön `firestore.rules`-tiedostoon ja tarvittaessa indeksin
   `firestore.indexes.json`-tiedostoon
4. päivityksen `docs/firestore-data-model.md`-dokumenttiin

Firestoresta luettu data validoidaan zodilla. Älä luota tyyppimuunnokseen
(`as Player`).

## Koodityyli

- TypeScript, React-funktiokomponentit, **named exportit** (poikkeus: reittien
  lazy-moduulit exportaavat `Component`).
- **Ei `enum`-tyyppejä** (`erasableSyntaxOnly`). Käytä union-tyyppejä ja
  `as const` -olioita.
- Tyypit importataan `import type` -muodossa (`verbatimModuleSyntax`).
- Muotoilu kuten Vite-pohjassa: 2 välilyöntiä, yksinkertaiset lainausmerkit, ei
  puolipisteitä.
- **Nimeäminen:**
  - kansiot kebab-case (`tactics-board`)
  - komponentit PascalCase (`LineupEditor.tsx`)
  - hookit `useX.ts`
  - muut moduulit camelCase (`practicePlan.ts`)
- **Kieli:** koodi, tunnisteet ja commit-viestit englanniksi. UI-tekstit ja
  `docs/` suomeksi.
- **Mobile first:** kosketusalueet vähintään 44 × 44 px. Juoksutus- ja
  pelaajanäkymät suunnitellaan ensin puhelimelle.
- Tarkista `package.json` ennen uuden kirjaston lisäämistä. Suositellut
  kirjastot on listattu tiedostossa `docs/architecture.md`.

## Dokumentaatio

Päivitä `docs/`-kansion dokumentit samassa muutoksessa, kun muutat
tietomallia, reittejä, rooleja tai arkkitehtuuria. Merkitse valmistuneet kohdat
tiedostoon `docs/roadmap.md`.
