// Käyttäjien hallinta. Käyttöoikeus on joko
//   allowed_users/{uid}     – salasanatunnukset
//   allowed_emails/{email}  – Google-käyttäjät (osoite etukäteen, pääsee sisään
//                             suoraan ensimmäisellä Google-kirjautumisella)
// Muutos tulee voimaan heti, sääntöjä ei tarvitse julkaista.
//
//   npm run kayttaja -- lista
//   npm run kayttaja -- lisaa-google <gmail-osoite>
//   npm run kayttaja -- lisaa <sähköposti> [salasana]
//   npm run kayttaja -- poista <sähköposti>
//   npm run kayttaja -- salasana <sähköposti> [uusi salasana]
//
// Jos salasanaa ei anneta, arvotaan helposti luettava salasana.
import { randomInt } from 'node:crypto'
import {
  accessToken,
  listCollection,
  createUser,
  deleteDocument,
  findUserByEmail,
  getDocument,
  listUsers,
  setPassword,
  writeDocument,
} from './firestore-admin.mjs'

const APP_URL = 'https://saipau19.web.app'
const [command, rawEmail, givenPassword] = process.argv.slice(2)
const email = rawEmail?.trim().toLowerCase()

function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789' // ei sekoittuvia (l, 1, o, 0)
  const part = () => Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join('')
  return `saipa-${part()}-${part()}`
}

function usage(message) {
  if (message) console.error(`${message}\n`)
  console.error(`Käyttö:
  npm run kayttaja -- lista
  npm run kayttaja -- lisaa-google <gmail-osoite>
  npm run kayttaja -- lisaa <sähköposti> [salasana]
  npm run kayttaja -- poista <sähköposti>
  npm run kayttaja -- salasana <sähköposti> [uusi salasana]`)
  process.exit(1)
}

const token = await accessToken()

if (command === 'lista') {
  const users = await listUsers(token)
  const emailDocs = await listCollection(token, 'allowed_emails')
  const allowedEmails = new Set(emailDocs.map((d) => decodeURIComponent(d.name.split('/').pop())))
  console.log('Sähköposti                        Kirjautumistapa   Käyttöoikeus')
  for (const u of users) {
    const email = (u.email ?? '').toLowerCase()
    const byUid = await getDocument(token, 'allowed_users', u.localId)
    const byEmail = u.emailVerified && allowedEmails.has(email)
    const via = (u.providerUserInfo ?? []).map((p) => (p.providerId === 'google.com' ? 'Google' : 'salasana')).join(', ')
    console.log(`${(u.email ?? '-').padEnd(34)}${via.padEnd(18)}${byUid || byEmail ? 'kyllä' : 'EI'}`)
    allowedEmails.delete(email)
  }
  for (const email of allowedEmails) {
    console.log(`${email.padEnd(34)}${'(ei vielä kirj.)'.padEnd(18)}kyllä – pääsee sisään Googlella`)
  }
  process.exit(0)
}

if (!email || !email.includes('@')) usage('Anna sähköpostiosoite.')

if (command === 'lisaa-google') {
  await writeDocument(token, 'allowed_emails', email, {
    addedAt: { timestampValue: new Date().toISOString() },
  })
  console.log(`Käyttöoikeus annettu: ${email}. Voimassa heti.\n`)
  console.log('Lähetä käyttäjälle:')
  console.log(`  Avaa ${APP_URL} ja valitse "Kirjaudu Googlella" tilillä ${email}.`)
  process.exit(0)
}

if (command === 'lisaa') {
  let user = await findUserByEmail(token, email)
  let password = null
  if (!user) {
    password = givenPassword || generatePassword()
    if (password.length < 6) usage('Salasanan pitää olla vähintään 6 merkkiä.')
    const created = await createUser(token, email, password)
    user = { localId: created.localId, email }
    console.log(`Luotiin uusi tunnus: ${email}`)
  } else {
    console.log(`Tunnus on jo olemassa: ${email}`)
  }
  await writeDocument(token, 'allowed_users', user.localId, {
    email: { stringValue: email },
    addedAt: { timestampValue: new Date().toISOString() },
  })
  console.log(`Käyttöoikeus annettu. Voimassa heti.\n`)
  console.log(`Lähetä käyttäjälle:`)
  console.log(`  Osoite:     ${APP_URL}`)
  console.log(`  Tunnus:     ${email}`)
  if (password) console.log(`  Salasana:   ${password}`)
  else console.log(`  Salasana:   ennallaan (tai Google-kirjautuminen)`)
  process.exit(0)
}

if (command === 'poista') {
  const user = await findUserByEmail(token, email)
  const byEmail = await getDocument(token, 'allowed_emails', email)
  if (!user && !byEmail) usage(`Osoitteella ${email} ei ole tunnusta eikä käyttöoikeutta.`)
  if (user) await deleteDocument(token, 'allowed_users', user.localId)
  if (byEmail) await deleteDocument(token, 'allowed_emails', email)
  console.log(`Käyttöoikeus poistettu: ${email}. Tunnus jää, mutta ei näe eikä tallenna dataa.`)
  process.exit(0)
}

if (command === 'salasana') {
  const user = await findUserByEmail(token, email)
  if (!user) usage(`Tunnusta ${email} ei ole.`)
  const password = givenPassword || generatePassword()
  if (password.length < 6) usage('Salasanan pitää olla vähintään 6 merkkiä.')
  await setPassword(token, user.localId, password)
  console.log(`Uusi salasana tunnukselle ${email}: ${password}`)
  process.exit(0)
}

usage(`Tuntematon komento: ${command ?? '(puuttuu)'}`)
