# Käyttäjien lisääminen ja poistaminen

Kuka tahansa voi kirjautua sovellukseen Googlella, mutta **dataan pääsee vain,
jolle on annettu käyttöoikeus**. Muut näkevät ilmoituksen "Ei käyttöoikeutta",
eikä mikään tallennu. Käyttöoikeus on tietokannassa, joten muutos tulee
voimaan **heti** – mitään ei tarvitse julkaista eikä committaa.

---

## Google-käyttäjä (helpoin – suositus valmentajille)

Annat käyttöoikeuden **sähköpostiosoitteella etukäteen**. Valmentaja avaa
sovelluksen, painaa "Kirjaudu Googlella" ja pääsee suoraan käyttämään.

**Puhelimella tai koneella Firebase-konsolista:**
1. Avaa https://console.firebase.google.com/project/saipau19/firestore/databases/-default-/data/~2Fallowed_emails
   (jos kokoelmaa ei näy, valitse juuresta **Start collection** ja nimeksi
   `allowed_emails`).
2. **Add document**
3. **Document ID:** valmentajan Gmail-osoite **pienillä kirjaimilla**,
   esim. `valkku.virtanen@gmail.com`.
4. Lisää yksi kenttä muistin tueksi, esim. nimi `nimi`, tyyppi *string*, arvo
   "Valkku Virtanen". (Kentän sisällöllä ei ole väliä.)
5. **Save**. Valmis – ilmoita valmentajalle osoite https://saipau19.web.app.

**Tai koneelta:**

```bash
npm run kayttaja -- lisaa-google valkku.virtanen@gmail.com
```

**Poistaminen:** poista dokumentti `allowed_emails`-kokoelmasta, tai
`npm run kayttaja -- poista valkku.virtanen@gmail.com`.

> Toimii vain Google-kirjautumisella (Google on vahvistanut osoitteen). Jos
> joku luo samalla osoitteella salasanatunnuksen, se ei pääse sisään.

---

## Salasanatunnus (jos valmentajalla ei ole Google-tiliä)

Käyttöoikeus on tunnuksen UID:llä kokoelmassa `allowed_users`.

### Koneelta yhdellä komennolla (nopein)

Avaa Pääte (Terminal) ja aja repon kansiossa:

```bash
cd /Users/junas/saipau19
npm run kayttaja -- lisaa etunimi@esimerkki.fi
```

Komento luo tunnuksen, arpoo salasanan (esim. `saipa-k7mq-x3vd`), antaa
käyttöoikeuden ja tulostaa viestin, jonka voit lähettää käyttäjälle:

```
  Osoite:     https://saipau19.web.app
  Tunnus:     etunimi@esimerkki.fi
  Salasana:   saipa-k7mq-x3vd
```

Jos tunnus on jo olemassa (esim. luotu konsolista), komento vain antaa sille
käyttöoikeuden eikä muuta salasanaa.

Muut komennot:

```bash
npm run kayttaja -- lista                          # kaikki tunnukset ja oikeudet
npm run kayttaja -- salasana etunimi@esimerkki.fi  # uusi salasana (unohtunut)
npm run kayttaja -- poista etunimi@esimerkki.fi    # poistaa käyttöoikeuden
```

Vaatii, että Firebase CLI on kirjautunut koneella (`npx firebase-tools login`).

---

### Puhelimella Firebase-konsolista

Toimii selaimessa missä tahansa, esim. kaukalon laidalla.

**A. Luo tunnus**
1. Avaa https://console.firebase.google.com/project/saipau19/authentication/users
2. **Add user** → sähköposti ja salasana (vähintään 6 merkkiä) → **Add user**.
3. Kopioi listasta uuden rivin **User UID** (pitkä merkkijono, esim.
   `Ab3dEf6hIj9kLm2nOp5qRs8tUv1w`).

**B. Anna käyttöoikeus**
1. Avaa https://console.firebase.google.com/project/saipau19/firestore/databases/-default-/data/~2Fallowed_users
2. **Add document**
3. **Document ID:** liitä kohdassa A kopioitu **User UID** (täsmälleen, ei
   sähköpostia – tämä on yleisin virhe).
4. Lisää kenttä: nimi `email`, tyyppi *string*, arvo käyttäjän sähköposti
   (vain muistin tueksi, ei pakollinen).
5. **Save**.

Käyttäjä voi kirjautua heti. Jos hän oli jo kirjautuneena, hän kirjautuu ulos
ja uudelleen sisään.

**Poistaminen:** poista käyttäjän dokumentti `allowed_users`-kokoelmasta.

---

## Hyvä tietää

- **Omistaja** (ylläpitäjän Google-tili) pääsee aina sisään, vaikka
  käyttöoikeuslistat tyhjenisivät – se on varmistettu tietokannan säännöissä.
- `npm run kayttaja -- lista` näyttää kaikki tunnukset ja käyttöoikeudet, myös
  lisätyt Google-osoitteet, jotka eivät ole vielä kirjautuneet.
- Tunnuksia voi syntyä vieraille (kuka tahansa voi kirjautua Googlella). Ne
  eivät näe eivätkä tallenna mitään. Turhat tunnukset voi poistaa konsolista:
  Authentication → Users.
- Sähköpostiosoitteet ovat vain tietokannassa, eivät tässä julkisessa repossa.
- Käyttöoikeudet sisältyvät varmuuskopioon (`npm run backup`).
