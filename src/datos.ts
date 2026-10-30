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

export function esNumero(valor: string) {
  return valor.trim() !== '' && Number.isFinite(Number(valor))
}

export function leerDatos({ objetivo, sexo, edad, peso, talla, actividad }: Respuestas): Datos | null {
  if (!objetivo || !sexo || !actividad) return null
  if (![edad, peso, talla].every(esNumero)) return null
  return { objetivo, sexo, edad: Number(edad), peso: Number(peso), talla: Number(talla), actividad }
}
