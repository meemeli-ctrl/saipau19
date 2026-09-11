// Firebase-alustus. Sovellus toimii myös ilman konfiguraatiota:
// tällöin tiedot tallennetaan selaimen localStorageen.
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
)

let app = null
let db = null
let auth = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  try {
    // Pysyvä IndexedDB-välimuisti: jo synkronoidut laukaukset ja erälukitukset
    // pysyvät näkyvissä vaikka nettiyhteys katkeaa tai sivu ladataan uudelleen
    // offline-tilassa (esim. kaukalon laidalla huonolla yhteydellä). Uudet
    // kirjoitukset jonottuvat automaattisesti ja lähtevät kun yhteys palaa.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  } catch (err) {
    console.warn(
      'Firestoren pysyvä välimuisti ei käynnistynyt – käytetään väliaikaista muistivälimuistia.',
      err,
    )
    db = getFirestore(app)
  }
  auth = getAuth(app)
} else {
  console.info(
    'Firebase-konfiguraatio puuttuu – käytetään paikallista tallennusta (localStorage). ' +
      'Kopioi .env.example -> .env ja täytä arvot ottaaksesi Firebasen käyttöön.',
  )
}

export { app, db, auth }

