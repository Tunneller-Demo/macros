// PROTOTIPO: cálculo de las Decisiones de calorías y de macros, sin tests.
// La validación es la mínima para poder juzgar el aspecto; la real se decide aparte.

export type Sexo = 'mujer' | 'hombre'
export type Unidades = 'metrico' | 'imperial'
export type Actividad = 'sedentaria' | 'moderada' | 'activa' | 'muy-activa'
export type Objetivo = 'bajar' | 'mantener' | 'subir'
export type NumeroComidas = 3 | 4 | 5

export type Datos = {
  edad: string
  sexo: Sexo | ''
  unidades: Unidades
  peso: string
  talla: string
  pulgadas: string
  actividad: Actividad | ''
  objetivo: Objetivo | ''
}

export const VACIO: Datos = {
  edad: '',
  sexo: '',
  unidades: 'metrico',
  peso: '',
  talla: '',
  pulgadas: '',
  actividad: '',
  objetivo: '',
}

export const EJEMPLO: Datos = {
  edad: '35',
  sexo: 'mujer',
  unidades: 'metrico',
  peso: '65',
  talla: '165',
  pulgadas: '',
  actividad: 'sedentaria',
  objetivo: 'bajar',
}

export const ACTIVIDADES: { valor: Actividad; nombre: string; descripcion: string; factor: number }[] = [
  { valor: 'sedentaria', nombre: 'Sedentaria', descripcion: 'Trabajo sentado y poco movimiento', factor: 1.4 },
  { valor: 'moderada', nombre: 'Moderada', descripcion: 'Caminas a diario o trabajas de pie', factor: 1.6 },
  { valor: 'activa', nombre: 'Activa', descripcion: 'Trabajo físico o ejercicio habitual', factor: 1.8 },
  { valor: 'muy-activa', nombre: 'Muy activa', descripcion: 'Trabajo duro o entrenamiento intenso casi a diario', factor: 2 },
]

export const OBJETIVOS: { valor: Objetivo; nombre: string; ajuste: number; proteina: number }[] = [
  { valor: 'bajar', nombre: 'Bajar', ajuste: -500, proteina: 1.8 },
  { valor: 'mantener', nombre: 'Mantener', ajuste: 0, proteina: 1.4 },
  { valor: 'subir', nombre: 'Subir', ajuste: 400, proteina: 1.6 },
]

const PLANES: Record<NumeroComidas, [string, number][]> = {
  3: [['Desayuno', 30], ['Almuerzo', 40], ['Cena', 30]],
  4: [['Desayuno', 25], ['Almuerzo', 35], ['Merienda', 15], ['Cena', 25]],
  5: [['Desayuno', 20], ['Media mañana', 10], ['Almuerzo', 35], ['Merienda', 10], ['Cena', 25]],
}

const LB_POR_KG = 2.20462
const CM_POR_PULGADA = 2.54

export type Macro = { nombre: string; gramos: number; porcentaje: number }
export type ComidaDelPlan = { nombre: string; peso: number; calorias: number; proteina: number; grasa: number; carbohidratos: number }
export type Resultado = {
  caloriasObjetivo: number
  metabolismoEnReposo: number
  gastoDiario: number
  proteina: Macro
  grasa: Macro
  carbohidratos: Macro
}

function aMetrico(d: Datos) {
  const peso = Number(d.peso)
  const talla = Number(d.talla)
  if (d.unidades === 'metrico') return { kg: peso, cm: talla }
  return { kg: peso / LB_POR_KG, cm: (talla * 12 + Number(d.pulgadas || 0)) * CM_POR_PULGADA }
}

export function cambiarUnidades(d: Datos, unidades: Unidades): Datos {
  if (unidades === d.unidades) return d
  const conPeso = d.peso !== ''
  const conTalla = d.talla !== ''
  const { kg, cm } = aMetrico(d)
  if (unidades === 'metrico') {
    return { ...d, unidades, peso: conPeso ? String(Math.round(kg)) : '', talla: conTalla ? String(Math.round(cm)) : '', pulgadas: '' }
  }
  const totalPulgadas = Math.round(cm / CM_POR_PULGADA)
  return {
    ...d,
    unidades,
    peso: conPeso ? String(Math.round(kg * LB_POR_KG)) : '',
    talla: conTalla ? String(Math.floor(totalPulgadas / 12)) : '',
    pulgadas: conTalla ? String(totalPulgadas % 12) : '',
  }
}

export function calcular(d: Datos): Resultado | null {
  const edad = Number(d.edad)
  const { kg, cm } = aMetrico(d)
  const actividad = ACTIVIDADES.find((a) => a.valor === d.actividad)
  const objetivo = OBJETIVOS.find((o) => o.valor === d.objetivo)
  if (!actividad || !objetivo || !d.sexo || edad < 18 || !(kg > 0) || !(cm > 0)) return null

  const reposo = 10 * kg + 6.25 * cm - 5 * edad + (d.sexo === 'hombre' ? 5 : -161)
  const gasto = reposo * actividad.factor
  const calorias = gasto + objetivo.ajuste

  const proteina = Math.min(objetivo.proteina * kg, (0.35 * calorias) / 4)
  const grasa = (0.3 * calorias) / 9
  const carbohidratos = (calorias - proteina * 4 - grasa * 9) / 4
  const macro = (nombre: string, gramos: number, kcalPorGramo: number): Macro => ({
    nombre,
    gramos: Math.round(gramos),
    porcentaje: Math.round(((gramos * kcalPorGramo) / calorias) * 100),
  })

  return {
    caloriasObjetivo: Math.round(calorias),
    metabolismoEnReposo: Math.round(reposo),
    gastoDiario: Math.round(gasto),
    proteina: macro('Proteína', proteina, 4),
    grasa: macro('Grasa', grasa, 9),
    carbohidratos: macro('Carbohidratos', carbohidratos, 4),
  }
}

// Reparte un total entero entre pesos sin que se pierda ni sobre nada al redondear.
function repartir(total: number, pesos: number[]) {
  const exactos = pesos.map((p) => (total * p) / 100)
  const partes = exactos.map(Math.floor)
  const orden = exactos.map((e, i) => [e - partes[i], i]).sort((a, b) => b[0] - a[0])
  const faltan = total - partes.reduce((a, b) => a + b, 0)
  for (let i = 0; i < faltan; i++) partes[orden[i][1]] += 1
  return partes
}

export function planDeComidas(r: Resultado, comidas: NumeroComidas): ComidaDelPlan[] {
  const plan = PLANES[comidas]
  const pesos = plan.map(([, peso]) => peso)
  const calorias = repartir(r.caloriasObjetivo, pesos)
  const proteina = repartir(r.proteina.gramos, pesos)
  const grasa = repartir(r.grasa.gramos, pesos)
  const carbohidratos = repartir(r.carbohidratos.gramos, pesos)
  return plan.map(([nombre, peso], i) => ({
    nombre,
    peso,
    calorias: calorias[i],
    proteina: proteina[i],
    grasa: grasa[i],
    carbohidratos: carbohidratos[i],
  }))
}

export type PropsVariante = {
  datos: Datos
  cambiar: (cambios: Partial<Datos>) => void
  ponerUnidades: (unidades: Unidades) => void
  resultado: Resultado | null
  comidas: NumeroComidas
  ponerComidas: (comidas: NumeroComidas) => void
}

export const AVISO_PROVISIONAL =
  'Resultado orientativo, no es un consejo médico. No está pensado para menores ni para el embarazo o la lactancia.'
