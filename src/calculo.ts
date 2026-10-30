import type { Datos, NivelDeActividad, Objetivo } from '@/datos'

const FACTOR_DE_ACTIVIDAD: Record<NivelDeActividad, number> = {
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

export type Resultado = {
  metabolismoEnReposo: number
  gastoDiario: number
  caloriasObjetivo: number
}

// Calcula sin redondear: redondear es cosa de quien muestra las cifras.
export function calcular({ objetivo, sexo, edad, peso, talla, actividad }: Datos): Resultado {
  const metabolismoEnReposo = 10 * peso + 6.25 * talla - 5 * edad + (sexo === 'hombre' ? 5 : -161)
  const gastoDiario = metabolismoEnReposo * FACTOR_DE_ACTIVIDAD[actividad]
  return {
    metabolismoEnReposo,
    gastoDiario,
    caloriasObjetivo: gastoDiario + AJUSTE_POR_OBJETIVO[objetivo],
  }
}
