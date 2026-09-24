// Yhteiset apufunktiot varmuuskopiointiin ja palautukseen.
//
// Tunnistautuminen käyttää koneelle jo kirjautunutta Firebase CLI:tä
// (`npx firebase-tools login`). Ylläpitäjän tunnus ohittaa firestore.rules-
// säännöt, joten skriptit näkevät ja voivat kirjoittaa kaiken datan.
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const PROJECT = 'saipau19'
export const COLLECTIONS = ['shots', 'locked_periods', 'completed_matches']
export const BACKUP_DIR = join(homedir(), 'saipau19-varmuuskopio')

const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`

// Firebase CLI:n oma, julkinen OAuth-asiakas (sama arvo on firebase-tools-
// paketin avoimessa lähdekoodissa). Ei salaisuus.
const CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'

export async function accessToken() {
  let refreshToken
  try {
    const cfg = JSON.parse(
      readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'),
    )
    refreshToken = cfg.tokens?.refresh_token
  } catch {
    /* käsitellään alla */
  }
  if (!refreshToken) {
    throw new Error('Firebase CLI ei ole kirjautunut. Aja ensin: npx firebase-tools login')
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: CLI_CLIENT_ID,
      client_secret: CLI_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Kirjautuminen epäonnistui (${res.status}). Aja: npx firebase-tools login`)
  return (await res.json()).access_token
}

async function api(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) throw new Error(`Firestore ${init.method ?? 'GET'} ${res.status}: ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

export async function listCollection(token, collection) {
  const docs = []
  let pageToken
  do {
    const q = new URLSearchParams({ pageSize: '300', ...(pageToken ? { pageToken } : {}) })
    const page = await api(token, `${DOCS}/${collection}?${q}`)
    docs.push(...(page.documents ?? []))
    pageToken = page.nextPageToken
  } while (pageToken)
  return docs
}

// Kirjoittaa dokumentin täsmälleen varmuuskopion mukaiseksi (sama id ja kentät).
export async function writeDocument(token, collection, id, fields) {
  return api(token, `${DOCS}/${collection}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

export async function deleteDocument(token, collection, id) {
  return api(token, `${DOCS}/${collection}/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
