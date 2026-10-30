import { ERROR_DE_MENORES, ERROR_SIN_OPCION, ERRORES_DE_NUMERO } from '@/textos'

export type Objetivo = 'bajar' | 'mantener' | 'subir'
export type Sexo = 'mujer' | 'hombre'
export type NivelDeActividad = 'sedentaria' | 'moderada' | 'activa' | 'muy-activa'

// Lo que la persona ha respondido, tal como lo ha escrito.
export type Respuestas = {
  objetivo: Objetivo | ''
  sexo: Sexo | ''
  edad: string
  peso: string
  talla: string
  actividad: NivelDeActividad | ''
}

export type Datos = {
  objetivo: Objetivo
  sexo: Sexo
  edad: number
  peso: number
  talla: number
  actividad: NivelDeActividad
}

export const SIN_RESPUESTAS: Respuestas = {
  objetivo: '',
  sexo: '',
  edad: '',
  peso: '',
  talla: '',
  actividad: '',
}

type CampoNumerico = 'edad' | 'peso' | 'talla'

const RANGOS: Record<CampoNumerico, { minimo: number; maximo: number; decimales: number }> = {
  edad: { minimo: 18, maximo: 100, decimales: 0 },
  peso: { minimo: 35, maximo: 250, decimales: 1 },
  talla: { minimo: 130, maximo: 220, decimales: 0 },
}

function aNumero(escrito: string) {
  return Number(escrito.trim().replace(',', '.'))
}

function errorNumerico(campo: CampoNumerico, escrito: string) {
  const { minimo, maximo, decimales } = RANGOS[campo]
  const { rango, formato } = ERRORES_DE_NUMERO[campo]
  const limpio = escrito.trim()
  if (!/^\d+([.,]\d+)?$/.test(limpio)) return rango
  const numero = aNumero(limpio)
  if (campo === 'edad' && numero < minimo) return ERROR_DE_MENORES
  if (numero < minimo || numero > maximo) return rango
  const [, parteDecimal = ''] = limpio.split(/[.,]/)
  return parteDecimal.length > decimales ? formato : null
}

// El mensaje que explica qué corregir en un campo, o null si el dato vale.
export function errorDe(campo: keyof Respuestas, escrito: string) {
  if (campo === 'edad' || campo === 'peso' || campo === 'talla') return errorNumerico(campo, escrito)
  return escrito ? null : ERROR_SIN_OPCION
}

export function leerDatos({ objetivo, sexo, edad, peso, talla, actividad }: Respuestas): Datos | null {
  if (!objetivo || !sexo || !actividad) return null
  if (errorDe('edad', edad) ?? errorDe('peso', peso) ?? errorDe('talla', talla)) return null
  return { objetivo, sexo, edad: aNumero(edad), peso: aNumero(peso), talla: aNumero(talla), actividad }
}
