# SPEC: Simulador sucesorio (derecho común español)

> Fuente de verdad del proyecto. Si código y spec discrepan, se corrige el código o se actualiza este documento; nunca se improvisa.
> Los artículos del Código Civil citados deben ser validados por el despacho antes de publicar.

## 1. Objetivo y alcance

Wizard web de reparto orientativo y captación de leads. No sustituye asesoramiento jurídico.

Incluye en v1: régimen común, causante con descendientes, caudal, tercios, estirpes, disposiciones, adjudicación de inmuebles, diferencias, detección de revisión obligatoria, estimación orientativa del impuesto de sucesiones según la comunidad de residencia habitual y la pregunta de si se nombra albacea.

Fuera de v1: derecho foral, ascendientes, cónyuge sin hijos, valoración del usufructo viudal, desheredación, colación detallada, empresa familiar y bienes extranjeros. La estimación del ISD no sustituye la liquidación: omite vivienda habitual, discapacidad, patrimonio preexistente y edad.

## 2. Reglas de negocio

- **R1 (art. 818 CC):** caudal = bienes − deudas/cargas + donaciones colacionables.
- **R2 (arts. 806-808 CC):** con hijos, legítima larga = 2/3: estricta 1/3 + mejora 1/3; libre = 1/3.
- **R3 (art. 808 CC):** estricta a partes iguales entre estirpes.
- **R4 (art. 823 CC):** mejora solo a descendientes, en la proporción elegida.
- **R5 (art. 806 CC):** libre a cualquier persona o entidad.
- **R6 (arts. 761, 814 CC):** descendientes de hijo premuerto ocupan su estirpe y dividen por igual.
- **R7:** premuerto sin descendientes no forma estirpe.
- **R8:** mejora y/o libre no dispuestas se reparten por igual entre estirpes.
- **R9 (art. 834 CC):** cónyuge viudo no separado con descendientes: usufructo legal sobre el tercio de mejora. Se muestra la base total y su desglose por descendiente, pero v1 no valora económicamente el usufructo.
- **R10 (art. 1392 CC):** en bienes gananciales, la mitad neta del cónyuge queda fuera de la herencia y solo la mitad del causante integra el caudal. Los bienes pueden marcarse como gananciales, privativos u otra titularidad.
- **R11 (arts. 841 ss., 1062 CC):** compensación por indivisibilidad solo informativa.
- **R12:** aplica la vecindad civil, no la residencia.

## 3. Dinero

- Importes enteros en céntimos; porcentajes en puntos básicos (`10000 = 100 %`).
- Los restos se asignan de uno en uno en orden de entrada.
- `tercio = floor(caudal / 3)`; el resto de dividir entre tres va al libre.
- Formateo únicamente en UI.

## 4. Arquitectura

```text
src/domain/succession/
  types.ts
  money.ts
  hotCases.ts
  validate.ts
  calcular.ts
  adjudicacion.ts
  __tests__/
src/composables/useSuccession.ts
src/components/wizard/
src/stores/wizard.ts
```

El dominio es TypeScript puro, sin Vue, Pinia ni UI.

## 5. Modelo

```ts
export type Regimen =
  | 'comun'
  | 'cataluna'
  | 'navarra'
  | 'pais_vasco'
  | 'galicia'
  | 'aragon'
  | 'baleares'
export type RegimenEconomico = 'gananciales' | 'separacion_bienes' | 'soltero_viudo'
export type SituacionConyugal =
  | 'conyuge_vivo'
  | 'viudo'
  | 'soltero'
  | 'separado_divorciado'
export type ComunidadIsd =
  | 'andalucia' | 'aragon' | 'asturias' | 'baleares' | 'canarias' | 'cantabria'
  | 'castilla_la_mancha' | 'castilla_y_leon' | 'cataluna' | 'ceuta' | 'extremadura'
  | 'galicia' | 'madrid' | 'melilla' | 'murcia' | 'navarra' | 'pais_vasco'
  | 'la_rioja' | 'valencia'

export interface Descendiente { id: string; nombre: string }
export interface Hijo {
  id: string
  nombre: string
  vive: boolean
  descendientes: Descendiente[]
}
export interface Inmueble {
  id: string
  nombre: string
  naturaleza: 'ganancial' | 'privativo' | 'otra'
  valorCent: number
  porcentajeCausanteBps: number
  cargasCent: number
}
export interface OtroActivo {
  id: string
  tipo: 'fondo' | 'deposito' | 'cuenta' | 'otro'
  naturaleza: 'ganancial' | 'privativo' | 'otra'
  valorCent: number
  porcentajeCausanteBps: number
}
export interface Donacion { beneficiarioId: string; valorCent: number }
export interface Reparto { herederoId: string; bps: number }
export interface BeneficiarioLibre {
  id: string
  nombre: string
  tipo: 'persona' | 'entidad'
  parentesco?: 'descendiente' | 'cercano' | 'ajeno'
}
export interface Disposiciones {
  mejora: Reparto[] | null
  libre: Reparto[] | null
}
export interface Adjudicacion { inmuebleId: string; herederoId: string; bps: number }
export interface Input {
  regimen: Regimen
  situacionConyugal: SituacionConyugal | null
  regimenEconomico: RegimenEconomico
  inmuebles: Inmueble[]
  otrosActivos: OtroActivo[]
  deudasCent: number
  donaciones: Donacion[]
  hijos: Hijo[]
  beneficiariosLibre: BeneficiarioLibre[]
  conyugeViudo: boolean
  disposiciones: Disposiciones
  adjudicaciones: Adjudicacion[]
  comunidadIsd: ComunidadIsd | null
  quiereAlbacea: boolean | null
  nombreAlbacea: string
  flags: {
    testamentoAnterior: boolean
    hijoConDiscapacidad: boolean
    desheredacion: boolean
    empresaFamiliar: boolean
    bienesExtranjero: boolean
    pactoSucesorio: boolean
  }
}
```

Errores: `CAUDAL_NO_POSITIVO`, `SIN_HIJOS`, `MEJORA_BPS_NO_SUMA_100`, `LIBRE_BPS_NO_SUMA_100`, `MEJORA_SOLO_DESCENDIENTES`, `HEREDERO_INEXISTENTE`, `ADJUDICACION_EXCEDE_100`.

Estados: `ok`, `ok_con_avisos`, `revision_obligatoria`, `error`.

El resultado contiene estado, errores, avisos, motivos, caudal, tercios, desglose por heredero (`estricta`, `mejora`, `libre`, `total`) y adjudicación (`derechoCent`, `adjudicadoCent`, `diferenciaCent`).

## 6. Algoritmo

1. Detectar casos bloqueantes; devolver revisión obligatoria sin reparto y con caudal si puede calcularse.
2. Caudal: activos y cargas ponderados por participación del causante, menos deudas, más donaciones.
3. Calcular tercios y asignar resto al libre.
4. Formar estirpes: hijos vivos y premuertos con descendientes.
5. Repartir estricta entre estirpes y dentro de la estirpe premuerta entre descendientes.
6. Mejora: `null` usa el reparto por estirpes; en otro caso validar descendientes y 10.000 bps.
7. Libre: `null` usa el reparto por estirpes; en otro caso validar beneficiarios y 10.000 bps.
8. Sumar capas por beneficiario.
9. Calcular adjudicación neta y diferencia. Mostrar patrimonio pendiente de adjudicar.
10. Estado `ok_con_avisos` si hay avisos; de lo contrario `ok`.

## 7. Casos calientes

Bloquean reparto: régimen distinto de común; desheredación, discapacidad, empresa familiar, bienes extranjeros, pacto sucesorio, testamento anterior o donaciones previas.

Avisan sin bloquear: representación por premoriencia, cónyuge viudo, gananciales y diferencias de adjudicación.

El CTA aparece siempre; en casos bloqueantes es el único resultado.

## 8. Wizard

1. Régimen: vecindad civil; situación conyugal explícita (cónyuge vivo, viudo, soltero o separado/divorciado); y régimen económico cuando hubo matrimonio.
2. Patrimonio: inmuebles, participación, cargas, otros activos y deudas.
3. Familia: hijos, premoriencia y descendientes. La situación del cónyuge ya se recoge en el paso 1.
4. Cribado: flags sí/no.
5. Legítima estricta: automática y visual.
6. Mejora: porcentajes a descendientes, suma validada en vivo.
7. Libre: personas o entidades.
8. Adjudicación: arrastrar inmueble a beneficiarios y mostrar diferencias.
9. Impuesto: comunidad de residencia habitual del causante y coste orientativo por heredero.
10. Albacea: sí o no; si es sí, un descendiente u otra persona.
11. Resumen: barras, impuesto, borrador orientativo de testamento abierto para el notario, avisos, texto legal y lead. El borrador solo se redacta si hay reparto; no es escritura.

## 9. Leads e InsForge

Tabla `leads(id, created_at, nombre, email, telefono, consentimiento_rgpd, consentimiento_at, estado_resultado, input_json, resultado_json)`.

- Consentimiento no premarcado con enlace a privacidad.
- No persistir antes del envío.
- El navegador envía a `POST /api/leads`; Nitro valida, recalcula y persiste con credencial administrativa.
- RLS bloquea acceso directo público a `leads`; la lectura queda reservada al despacho.

## 10. Perfil y simulaciones guardadas

- El simulador sigue siendo público; la cuenta solo es obligatoria para guardar y recuperar escenarios.
- Acceso mediante correo y contraseña con verificación por código, o mediante Google OAuth.
- El perfil muestra nombre, correo y avatar cuando el proveedor lo aporta, y permite cerrar sesión.
- El usuario guarda copias manuales con un título; puede abrirlas, renombrarlas y eliminarlas.
- Tabla `simulaciones_guardadas(id, user_id, titulo, input_json, paso, version, created_at, updated_at)`.
- `user_id` referencia `auth.users(id)`. RLS limita todas las operaciones a `auth.uid() = user_id`; no hay acceso anónimo.
- Si el usuario inicia sesión desde el resumen, la simulación pendiente solo se conserva temporalmente en `sessionStorage` durante la redirección.

## 11. Casos de prueba

- **T1:** 3 hijos, caudal 2.100.000 €, sin disposiciones: tercios 700.000 €; cada capa se reparte 233.333,34 + 233.333,33 + 233.333,33.
- **T2:** caudal 100 céntimos: tercios 33, 33 y 34.
- **T3:** T1 + mejora 100 % A + libre 50 % ONG / 50 % nieto: A 933.333,34 €; ONG y nieto 350.000 €; B y C 233.333,33 €.
- **T4:** T1 con deudas 300.000 €: caudal 1.800.000 €, tercios 600.000 €.
- **T5:** 3 hijos, uno premuerto con 2 nietos: tres estirpes; la rama divide por igual y aparece aviso R6.
- **T6:** premuerto sin descendientes: dos estirpes, estricta 350.000 € cada una.
- **T7:** mejora 60 % + 30 %: `MEJORA_BPS_NO_SUMA_100`.
- **T8:** mejora a ONG: `MEJORA_SOLO_DESCENDIENTES`.
- **T9:** Cataluña: revisión obligatoria y sin reparto.
- **T10:** gananciales, activos 2.100.000 € al 50 %: caudal 1.050.000 €, tercios 350.000 € y aviso R10.
- **T11:** deudas mayores que activos: `CAUDAL_NO_POSITIVO`.
- **T12:** cónyuge viudo: aviso R9 sin variar importes.
- **T13:** inmuebles 1.200.000 € a hijo 1 y 900.000 € al 50 % a hijos 2 y 3: diferencias +500.000 / −250.000 / −250.000.
- **T14:** donaciones previas: revisión obligatoria.
- **T15:** ID inexistente en disposiciones: `HEREDERO_INEXISTENTE`.
- **T16:** para cualquier entrada válida, la suma de totales por heredero es el caudal.

## 11. Reglas de implementación

- Cero imports de Vue/Pinia/UI en `src/domain/succession`.
- Nunca usar floats para dinero; puntos básicos para porcentajes.
- Las reglas de negocio devuelven errores tipados, no lanzan excepciones.
- Cada R1-R12 tendrá un test cuyo nombre contenga el ID.
- Actualizar este spec antes de cambiar reglas.
- Textos legales visibles en `src/content/legal.ts`.
- No añadir derecho foral hasta recibir reglas validadas.

## 12. Orden

1. Tipos/dinero.
2. Cálculo.
3. Validación/hot cases.
4. Adjudicación y propiedad T16.
5. Composable/store.
6. Wizard.
7. InsForge.

## 13. Pendiente del despacho

Validar artículos, criterio de donaciones, legítimas forales, avisos legales y eventual valoración del usufructo viudal.
