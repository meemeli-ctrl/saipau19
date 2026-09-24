// Varmuuskopioi koko Firestoren tiedostoon ~/saipau19-varmuuskopio/.
// Käyttö: npm run backup
//
// Tiedosto on repon ulkopuolella tarkoituksella: se sisältää käyttäjien
// sähköpostiosoitteet, eikä sitä saa viedä julkiseen GitHub-repoon.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BACKUP_DIR, COLLECTIONS, PROJECT, accessToken, listCollection } from './firestore-admin.mjs'

const token = await accessToken()
const backup = { project: PROJECT, createdAt: new Date().toISOString(), collections: {} }

for (const name of COLLECTIONS) {
  const docs = await listCollection(token, name)
  backup.collections[name] = docs.map((d) => ({
    id: d.name.split('/').pop(),
    fields: d.fields ?? {},
    updateTime: d.updateTime,
  }))
  console.log(`${name.padEnd(18)} ${docs.length} dokumenttia`)
}

mkdirSync(BACKUP_DIR, { recursive: true })
// Tiedostonimeen paikallinen aika (Suomi), ei UTC.
const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
const file = join(BACKUP_DIR, `firestore-${stamp}.json`)
writeFileSync(file, JSON.stringify(backup, null, 2))
console.log(`\nTallennettu: ${file}`)
