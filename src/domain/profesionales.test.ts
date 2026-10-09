import { describe, expect, it } from 'vitest'
import { guiaAbogadoONotaria } from './profesionales'

describe('guiaAbogadoONotaria', () => {
  it('recomienda abogado si hay revisión obligatoria o errores', () => {
    expect(guiaAbogadoONotaria('revision_obligatoria', 0, 0).recomendacion).toBe('abogado')
    expect(guiaAbogadoONotaria('error', 0, 1).recomendacion).toBe('abogado')
  })

  it('permite notaría cuando el reparto está claro', () => {
    expect(guiaAbogadoONotaria('ok', 0, 0).recomendacion).toBe('notaria')
  })

  it('ofrece ambos cuando hay avisos', () => {
    expect(guiaAbogadoONotaria('ok_con_avisos', 1, 0).recomendacion).toBe('ambos')
  })
})
