// Palauttaa varmuuskopion Firestoreen.
//
//   npm run restore -- <tiedosto>              näyttää mitä tehtäisiin (ei muutoksia)
//   npm run restore -- <tiedosto> --vahvista   kirjoittaa oikeasti
//
// Palautus kirjoittaa varmuuskopion dokumentit takaisin samoilla tunnisteilla.
// Se EI poista tietokannasta dokumentteja, joita varmuuskopiossa ei ole –
// uudemmat merkinnät säilyvät.
import { readFileSync } from 'node:fs'
import { accessToken, writeDocument } from './firestore-admin.mjs'

const [file, flag] = process.argv.slice(2)
if (!file) {
  console.error('Anna varmuuskopiotiedosto: npm run restore -- ~/saipau19-varmuuskopio/firestore-....json')
  process.exit(1)
}
const confirmed = flag === '--vahvista'
const backup = JSON.parse(readFileSync(file, 'utf8'))

console.log(`Varmuuskopio: ${backup.createdAt} (projekti ${backup.project})`)
for (const [name, docs] of Object.entries(backup.collections)) {
  console.log(`  ${name.padEnd(18)} ${docs.length} dokumenttia`)
}

if (!confirmed) {
  console.log('\nKuivaharjoitus – mitään ei kirjoitettu. Lisää --vahvista palauttaaksesi.')
  process.exit(0)
}

const token = await accessToken()
let n = 0
for (const [name, docs] of Object.entries(backup.collections)) {
  for (const d of docs) {
    await writeDocument(token, name, d.id, d.fields)
    n++
  }
}
console.log(`\nPalautettu ${n} dokumenttia.`)
