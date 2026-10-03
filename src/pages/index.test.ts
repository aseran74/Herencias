/**
 * @vitest-environment happy-dom
 */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useWizardStore } from '../stores/wizard'
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
    await wrapper.get('[data-testid="tiene-hijos-si"]').setValue()
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
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('El tercio reservado')
    await wrapper.get('[data-testid="estricta-inmueble"]').setValue('inmueble')
    expect(wrapper.text()).toContain('Vivienda')
    for (let paso = 5; paso < 9; paso++) await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Impuesto de sucesiones')
    await wrapper.get('[data-testid="comunidad-isd"]').setValue('madrid')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('¿Nombras albacea?')
    await wrapper.get('[data-testid="albacea-si"]').setValue(true)
    await wrapper.get('[data-testid="albacea-nombre"]').setValue('Luis Ortega')
    expect(wrapper.text()).toContain('cuentas del causante')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Resultado orientativo')
    expect(wrapper.text()).toContain('Luis Ortega')
    expect(wrapper.text()).toContain('Vivienda')
    expect(wrapper.text()).toContain('Inmueble para los legitimarios')
    expect(wrapper.text()).toContain('cuentas del causante')
    expect(wrapper.text()).toContain('700.000,00')
    expect(wrapper.text()).toContain('Resumen')
    expect(wrapper.get('[data-testid="cita-express"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="testamento-urgencia"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pedir cita express')
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

  it('puede abrir una simulación convertida en Proxy por Vue', () => {
    const store = useWizardStore()
    store.input.hijos.push({ id: 'ana', nombre: 'Ana', vive: true, descendientes: [] })

    expect(() => store.cargar(store.input, 3)).not.toThrow()
    expect(store.paso).toBe(3)
    expect(store.input.hijos[0]?.nombre).toBe('Ana')
  })

  it('envía un caso foral al resumen sin reparto', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })

    await wrapper.get('input[value="cataluna"]').setValue()
    await wrapper.get('input[value="soltero"]').setValue()
    await wrapper.get('[data-testid="tiene-hijos-si"]').setValue()
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
    await wrapper.get('[data-testid="tiene-hijos-si"]').setValue()
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
    await wrapper.get('[data-testid="tiene-hijos-si"]').setValue()
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    const consentimiento = wrapper.get<HTMLInputElement>('[data-testid="consentimiento"]')
    expect(consentimiento.element.checked).toBe(false)
    expect(wrapper.get('[data-testid="formulario-lead"] button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('permite a un soltero dejar todo a tres sobrinos', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(IndexPage, { global: { plugins: [pinia] } })

    await wrapper.get('input[value="soltero"]').setValue()
    await wrapper.get('[data-testid="tiene-hijos-no"]').setValue()
    expect(wrapper.get('[data-testid="destino-hermanos"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="destino-ong"]').exists()).toBe(true)
    await wrapper.get('[data-testid="destino-sobrinos"]').setValue(true)
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="anadir-inmueble"]').trigger('click')
    await wrapper.get('[data-testid="inmueble-nombre-0"]').setValue('Vivienda')
    await wrapper.get('[data-testid="inmueble-valor-0"]').setValue('2100000')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('A quién dejas la herencia')
    await wrapper.get('[data-testid="sobrino-nombre-0"]').setValue('Luis')
    await wrapper.get('[data-testid="anadir-sobrino"]').trigger('click')
    await wrapper.get('[data-testid="sobrino-nombre-1"]').setValue('Marta')
    await wrapper.get('[data-testid="anadir-sobrino"]').trigger('click')
    await wrapper.get('[data-testid="sobrino-nombre-2"]').setValue('Elena')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.get('[data-testid="estricta-no-aplica"]').exists()).toBe(true)
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.get('[data-testid="mejora-no-aplica"]').exists()).toBe(true)
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    await wrapper.get('[data-testid="comunidad-isd"]').setValue('madrid')
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    useWizardStore().input.quiereAlbacea = false
    await wrapper.get('[data-testid="continuar"]').trigger('click')
    expect(wrapper.text()).toContain('Libre disposición · sin descendientes')
    expect(wrapper.text()).toContain('Luis')
    expect(wrapper.text()).toContain('Marta')
    expect(wrapper.text()).toContain('Elena')
    expect(wrapper.text()).toContain('700.000,00')
  })
})
