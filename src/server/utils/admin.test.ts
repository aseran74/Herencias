import { describe, expect, it } from 'vitest'
import { emailsAdmin, slugifyId } from './admin'

describe('admin utils', () => {
  it('parsea la lista de administradores', () => {
    expect(emailsAdmin('admin@example.com, Otro@Demo.es')).toEqual(['admin@example.com', 'otro@demo.es'])
  })

  it('genera un id slug a partir del nombre', () => {
    const id = slugifyId('Bufete Soler', 'abogado')
    expect(id.startsWith('ab-bufete-soler-')).toBe(true)
  })
})
