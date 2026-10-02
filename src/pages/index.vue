<script setup lang="ts">
import Regimen from '../components/wizard/Regimen.vue'
import Patrimonio from '../components/wizard/Patrimonio.vue'
import Familia from '../components/wizard/Familia.vue'
import Cribado from '../components/wizard/Cribado.vue'
import Estricta from '../components/wizard/Estricta.vue'
import Mejora from '../components/wizard/Mejora.vue'
import Libre from '../components/wizard/Libre.vue'
import Adjudicacion from '../components/wizard/Adjudicacion.vue'
import Impuesto from '../components/wizard/Impuesto.vue'
import Albacea from '../components/wizard/Albacea.vue'
import Resumen from '../components/wizard/Resumen.vue'
import { PASOS, useWizardStore } from '../stores/wizard'

const store = useWizardStore()
const componentes = [Regimen, Patrimonio, Familia, Cribado, Estricta, Mejora, Libre, Adjudicacion, Impuesto, Albacea, Resumen]
</script>

<template>
  <div class="cuaderno cuaderno-pasos">
    <nav class="menu-pasos" aria-label="Pasos del simulador" data-testid="pasos-barra">
      <div class="menu-pasos-interior">
        <header class="menu-pasos-cabecera">
          <span>Tu recorrido</span>
          <strong>{{ store.paso }}/{{ PASOS.length }}</strong>
        </header>
        <button
          v-for="(nombre, indice) in PASOS"
          :key="nombre"
          type="button"
          class="paso"
          :class="{ activo: store.paso === indice + 1, completo: store.paso > indice + 1 }"
          :aria-current="store.paso === indice + 1 ? 'step' : undefined"
          :disabled="indice + 1 > store.paso"
          @click="store.irA(indice + 1)"
        >
          <span class="num">{{ indice + 1 }}</span>
          <span>{{ nombre }}</span>
        </button>
      </div>
    </nav>
    <main class="hoja">
      <header class="portada">
        <p class="kicker">Simulación orientativa · Derecho común</p>
        <h1>Ordena hoy lo que importa mañana</h1>
        <p class="lede">Un recorrido claro por patrimonio, familia y tercios hereditarios.</p>
      </header>

      <p class="paso-actual"><span>Paso {{ store.paso }} de {{ PASOS.length }}</span><strong>{{ PASOS[store.paso - 1] }}</strong></p>

      <div class="panel-paso">
        <Transition name="paso" mode="out-in">
          <component :is="componentes[store.paso - 1]" :key="store.paso" />
        </Transition>
        <p v-if="store.erroresUi.length" class="aviso" role="alert" data-testid="errores">{{ store.erroresUi[0] }}</p>
        <div class="nav">
          <button v-if="store.paso > 1" type="button" class="secundario" data-testid="atras" @click="store.retroceder">Atrás</button>
          <button v-if="store.paso < PASOS.length" type="button" data-testid="continuar" @click="store.avanzar">
            {{ store.bloqueado && (store.paso === 1 || store.paso === 4) ? 'Solicitar revisión' : 'Continuar' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>
