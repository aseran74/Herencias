/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import IndexPage from './index.vue'

describe('wizard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('recorre los nueve pasos y muestra un reparto', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })

    expect(wrapper.text()).toContain('Derecho común')
    await wrapper.get('input[value="soltero"]').setValue()
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Patrimonio que entra')
    await wrapper.get('[data-testid="anadir-inmueble"]').trigger('click')
    await wrapper.get('[data-testid="inmueble-nombre-0"]').setValue('Vivienda')
    await wrapper.get('[data-testid="inmueble-valor-0"]').setValue('2100000')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="anadir-hijo"]').trigger('click')
    await wrapper.get('[data-testid="hijo-nombre-0"]').setValue('Ana')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Cribado jurídico')
    for (let paso = 4; paso < 9; paso++) await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Impuesto de sucesiones')
    await wrapper.get('[data-testid="comunidad-isd"]').setValue('madrid')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('¿Nombras albacea?')
    await wrapper.get('[data-testid="albacea-si"]').setValue(true)
    await wrapper.get('[data-testid="albacea-nombre"]').setValue('Luis Ortega')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Resultado orientativo')
    expect(wrapper.text()).toContain('Luis Ortega')
    expect(wrapper.text()).toContain('700.000,00')
    expect(wrapper.text()).toContain('Resumen')
  })

  it('pregunta si el cónyuge vive antes de avanzar', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })

    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Indica la situación conyugal')
    await wrapper.get('input[value="conyuge_vivo"]').setValue()
    expect(wrapper.text()).toContain('Régimen económico del matrimonio')
    await wrapper.get('input[value="gananciales"]').setValue()
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Patrimonio que entra')
  })

  it('envía un caso foral al resumen sin reparto', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })

    await wrapper.get('input[value="cataluna"]').setValue()
    await wrapper.get('input[value="soltero"]').setValue()
    expect(wrapper.get('[data-testid="aviso-foral"]').exists()).toBe(true)
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.get('[data-testid="resumen-bloqueante"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('derecho foral')
    expect(wrapper.text()).not.toContain('Reparto por heredero')
  })

  it('acepta un importe pegado con formato español', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })

    await wrapper.get('input[value="soltero"]').setValue()
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="anadir-inmueble"]').trigger('click')
    await wrapper.get('[data-testid="inmueble-nombre-0"]').setValue('Vivienda')
    await wrapper.get('[data-testid="inmueble-valor-0"]').setValue('2.100.000,00')
    await wrapper.get('[data-testid="continuar"]').trigger('click')

    expect(wrapper.text()).toContain('Descendientes y ramas familiares')
  })

  it('no premarca el consentimiento RGPD', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })
    await wrapper.get('input[value="navarra"]').setValue()
    await wrapper.get('input[value="soltero"]').setValue()
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    const consentimiento = wrapper.get<HTMLInputElement>('[data-testid="consentimiento"]')
    expect(consentimiento.element.checked).toBe(false)
    expect(wrapper.get('[data-testid="formulario-lead"] button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
