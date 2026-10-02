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
import Resumen from '../components/wizard/Resumen.vue'
import { PASOS, useWizardStore } from '../stores/wizard'

const store = useWizardStore()
const componentes = [Regimen, Patrimonio, Familia, Cribado, Estricta, Mejora, Libre, Adjudicacion, Impuesto, Resumen]
</script>

<template>
  <div class="cuaderno">
    <aside class="lomo" aria-hidden="true"><span>Cuaderno sucesorio</span></aside>
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
