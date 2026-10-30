import type { Datos, NivelDeActividad, Objetivo } from '@/datos'

const MULTIPLICADOR_POR_NIVEL_DE_ACTIVIDAD: Record<NivelDeActividad, number> = {
  sedentaria: 1.4,
  moderada: 1.6,
  activa: 1.8,
  'muy-activa': 2,
}

const AJUSTE_POR_OBJETIVO: Record<Objetivo, number> = {
  bajar: -500,
  mantener: 0,
  subir: 400,
}

const PROTEINA_POR_KG: Record<Objetivo, number> = {
  bajar: 1.8,
  mantener: 1.4,
  subir: 1.6,
}

const KCAL_POR_GRAMO: Record<Macro, number> = {
  proteina: 4,
  grasa: 9,
  carbohidratos: 4,
}

const TOPE_DE_PROTEINA = 0.35
const PARTE_DE_GRASA = 0.3

export type Macro = 'proteina' | 'grasa' | 'carbohidratos'

export type Resultado = {
  metabolismoEnReposo: number
  gastoDiario: number
  caloriasObjetivo: number
  gramosDeMacros: Record<Macro, number>
}

export type CifrasDeMacro = { gramos: number; porcentaje: number }
export type RepartoDeMacros = Record<Macro, CifrasDeMacro>

// Calcula sin redondear: las cifras enteras se sacan al final, para mostrarlas.
export function calcular({ objetivo, sexo, edad, peso, talla, actividad }: Datos): Resultado {
  const metabolismoEnReposo = 10 * peso + 6.25 * talla - 5 * edad + (sexo === 'hombre' ? 5 : -161)
  const gastoDiario = metabolismoEnReposo * MULTIPLICADOR_POR_NIVEL_DE_ACTIVIDAD[actividad]
  const caloriasObjetivo = gastoDiario + AJUSTE_POR_OBJETIVO[objetivo]

  const proteina = Math.min(
    PROTEINA_POR_KG[objetivo] * peso,
    (TOPE_DE_PROTEINA * caloriasObjetivo) / KCAL_POR_GRAMO.proteina,
  )
  const grasa = (PARTE_DE_GRASA * caloriasObjetivo) / KCAL_POR_GRAMO.grasa
  const carbohidratos =
    (caloriasObjetivo - proteina * KCAL_POR_GRAMO.proteina - grasa * KCAL_POR_GRAMO.grasa) /
    KCAL_POR_GRAMO.carbohidratos

  return {
    metabolismoEnReposo,
    gastoDiario,
    caloriasObjetivo,
    gramosDeMacros: { proteina, grasa, carbohidratos },
  }
}

// Redondea a enteros sin que cambie la suma: la diferencia va a las cifras con mayor parte decimal.
function enterosConLaMismaSuma(exactos: number[]) {
  const sumar = (cifras: number[]) => cifras.reduce((suma, cifra) => suma + cifra, 0)
  const enteros = exactos.map(Math.floor)
  const parteDecimal = (i: number) => exactos[i] - enteros[i]
  const porParteDecimal = exactos.map((_, i) => i).sort((a, b) => parteDecimal(b) - parteDecimal(a))
  const faltan = Math.round(sumar(exactos)) - sumar(enteros)
  for (const i of porParteDecimal.slice(0, faltan)) enteros[i] += 1
  return enteros
}

export function repartoEnEnteros({ caloriasObjetivo, gramosDeMacros }: Resultado): RepartoDeMacros {
  const macros = Object.keys(KCAL_POR_GRAMO) as Macro[]
  const porcentajes = enterosConLaMismaSuma(
    macros.map((macro) => ((gramosDeMacros[macro] * KCAL_POR_GRAMO[macro]) / caloriasObjetivo) * 100),
  )
  const cifras = macros.map((macro, i) => [
    macro,
    { gramos: Math.round(gramosDeMacros[macro]), porcentaje: porcentajes[i] },
  ])
  return Object.fromEntries(cifras) as RepartoDeMacros
}
