# Tietoturva

## Tuetut versiot

Vain `main`-haara ja tuotannossa oleva https://saipau19.web.app.
Vanhoja versioita ei ylläpidetä.

## Haavoittuvuudesta ilmoittaminen

Älä avaa julkista issueta. Käytä GitHubin yksityistä ilmoitusta:
repo → **Security** → **Report a vulnerability**.

Jos se ei ole käytettävissä, ota yhteyttä: meemeli.kahkonen@gmail.com

Kerro mitä löysit, miten sen voi toistaa ja mitä sillä voi tehdä.
Vastaan viikon sisällä. Tämä on vapaaehtoisprojekti, joten korjauksen
aikataulu riippuu löydöksen vakavuudesta.

## Piiriin kuuluu

- Sovelluksen koodi tässä repossa
- Firestore-säännöt (`firestore.rules`) ja kirjautuminen

## Piiriin ei kuulu

- Salibandyliiton tulospalvelu (Torneopal) ja Firebase itse
- Koodissa näkyvät julkiset avaimet (Firebasen selainkonfiguraatio ja
  tulospalvelun lukuavain). Ne ovat tarkoituksella julkisia: pääsy dataan
  on rajattu Firestore-säännöillä ja kirjautumisella, ei avaimilla.
