# Käyttäjien lisääminen ja poistaminen

Sovellukseen pääsee vain tunnuksella, jolla on **käyttöoikeus**. Käyttöoikeus
on tietokannassa (`allowed_users`-kokoelma), joten muutos tulee voimaan
**heti** – mitään ei tarvitse julkaista eikä committaa.

Tunnus tarvitsee siis aina kaksi asiaa:
1. **tunnuksen** Firebase Authenticationissa (sähköposti + salasana tai Google)
2. **käyttöoikeuden** `allowed_users`-kokoelmassa

Pelkkä tunnus ilman käyttöoikeutta = käyttäjä pääsee kirjautumaan, mutta näkee
ilmoituksen "Ei käyttöoikeutta" eikä mikään tallennu. (Näin kävi jerelle 26.9.)

---

## Tapa 1: koneelta yhdellä komennolla (nopein)

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

## Tapa 2: puhelimella Firebase-konsolista (ilman konetta)

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

## Google-tilillä kirjautuvat

Uusien tilien luonti sovelluksesta on estetty turvallisuussyistä, joten
Google-käyttäjän tunnus pitää luoda näin:

1. Konsoli → **Authentication → Settings → User actions** → laita
   "Enable create (sign-up)" päälle.
2. Käyttäjä kirjautuu sovellukseen kerran Googlella (näkee "Ei käyttöoikeutta").
3. Laita asetus **heti takaisin pois**.
4. Anna käyttöoikeus: `npm run kayttaja -- lisaa <gmail-osoite>` tai tapa 2 B.

Helpompaa on antaa valmentajalle salasanatunnus (tapa 1).

---

## Hyvä tietää

- **Omistaja** (ylläpitäjän Google-tili) pääsee aina sisään, vaikka
  `allowed_users` tyhjenisi – se on varmistettu myös tietokannan säännöissä.
- Sähköpostiosoitteet ovat vain tietokannassa, eivät tässä julkisessa repossa.
- Käyttöoikeudet sisältyvät varmuuskopioon (`npm run backup`).
