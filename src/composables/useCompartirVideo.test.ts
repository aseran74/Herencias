import { describe, expect, it } from 'vitest'
import { nombreArchivoVideo, urlEmail, urlWhatsApp } from './useCompartirVideo'

describe('useCompartirVideo', () => {
  it('arma enlaces de WhatsApp y email', () => {
    expect(urlWhatsApp('Hola', 'https://ejemplo.test/v')).toContain('wa.me')
    expect(urlWhatsApp('Hola', 'https://ejemplo.test/v')).toContain(encodeURIComponent('https://ejemplo.test/v'))
    expect(urlEmail('Asunto', 'Cuerpo')).toContain('mailto:')
    expect(urlEmail('Asunto', 'Cuerpo')).toContain(encodeURIComponent('Asunto'))
  })

  it('genera un nombre de archivo con fecha', () => {
    expect(nombreArchivoVideo('urgencia')).toMatch(/^urgencia-\d{4}-\d{2}-\d{2}\.webm$/)
  })
})
