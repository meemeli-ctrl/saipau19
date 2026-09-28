import { describe, expect, it } from 'vitest'
import { describeFirestoreError } from './firestoreErrors'

describe('describeFirestoreError', () => {
  it('puuttuva käyttöoikeus kerrotaan selvästi (jeren tapaus 26.9.)', () => {
    expect(describeFirestoreError({ code: 'permission-denied' })).toMatch(/käyttöoikeutta/)
  })
  it('tuntematon virhe varoittaa merkintöjen katoamisesta', () => {
    expect(describeFirestoreError({ code: 'jotain-muuta' })).toMatch(/voivat kadota/)
    expect(describeFirestoreError(undefined)).toMatch(/voivat kadota/)
  })
})
