<script setup lang="ts">
import { FACULTADES_ALBACEA } from '../../content/albacea'
import { useWizardStore } from '../../stores/wizard'

defineProps<{ compacto?: boolean }>()
const store = useWizardStore()

function rellenar(evento: Event) {
  const valor = (evento.target as HTMLSelectElement).value
  if (valor) store.input.nombreAlbacea = valor
}
</script>

<template>
  <section aria-labelledby="titulo-albacea" data-testid="albacea">
    <template v-if="!compacto">
      <p class="kicker">10 · Albacea</p>
      <h2 id="titulo-albacea">¿Nombras albacea?</h2>
      <p class="lede">
        El albacea hace cumplir el testamento. Puedes darle permiso expreso para pedir información de las cuentas y gestionar cobros y pagos de la herencia.
      </p>
    </template>
    <h3 v-else id="titulo-albacea">Nombrar albacea</h3>

    <fieldset class="opciones">
      <legend class="sr-only">Decisión sobre el albacea</legend>
      <label class="opcion">
        <input v-model="store.input.quiereAlbacea" data-testid="albacea-no" type="radio" name="albacea" :value="false">
        <span>No nombrar albacea</span>
      </label>
      <label class="opcion">
        <input v-model="store.input.quiereAlbacea" data-testid="albacea-si" type="radio" name="albacea" :value="true">
        <span>Sí, nombrar albacea</span>
      </label>
    </fieldset>

    <div v-if="store.input.quiereAlbacea" class="rejilla">
      <label v-if="store.descendientes.length">
        Usar un descendiente
        <select data-testid="albacea-lista" @change="rellenar">
          <option value="">Elegir</option>
          <option v-for="persona in store.descendientes" :key="persona.id" :value="persona.nombre">{{ persona.nombre }}</option>
        </select>
      </label>
      <label class="campo-suelto">
        Nombre del albacea
        <input v-model="store.input.nombreAlbacea" data-testid="albacea-nombre" autocomplete="name">
      </label>
    </div>
    <fieldset v-if="store.input.quiereAlbacea" class="facultades-albacea">
      <legend>Permisos que le das</legend>
      <p class="nota">Van al borrador para que el notario los estudie. Puedes quitar los que no quieras.</p>
      <label v-for="facultad in FACULTADES_ALBACEA" :key="facultad.id" class="check">
        <input v-model="store.input.facultadesAlbacea[facultad.id]" type="checkbox">
        {{ facultad.texto }}
      </label>
      <p class="aviso-facultades">
        Esto no entrega contraseñas ni un acceso personal ilimitado. Tampoco autoriza a vender bienes ni a cambiar el reparto. Cada banco y el notario pedirán la documentación correspondiente.
      </p>
    </fieldset>
  </section>
</template>
