import type { NivelDeActividad, Objetivo, Sexo } from '@/datos'

export const MARCA = 'Macros'

export type Opcion<V extends string = string> = { valor: V; nombre: string; descripcion?: string }

export const OBJETIVOS: Opcion<Objetivo>[] = [
  { valor: 'bajar', nombre: 'Bajar' },
  { valor: 'mantener', nombre: 'Mantener' },
  { valor: 'subir', nombre: 'Subir' },
]

export const SEXOS: Opcion<Sexo>[] = [
  { valor: 'mujer', nombre: 'Mujer' },
  { valor: 'hombre', nombre: 'Hombre' },
]

export const NIVELES_DE_ACTIVIDAD: Opcion<NivelDeActividad>[] = [
  { valor: 'sedentaria', nombre: 'Sedentaria', descripcion: 'Trabajo sentado y poco movimiento' },
  { valor: 'moderada', nombre: 'Moderada', descripcion: 'Caminas a diario o trabajas de pie' },
  { valor: 'activa', nombre: 'Activa', descripcion: 'Trabajo físico o ejercicio habitual' },
  { valor: 'muy-activa', nombre: 'Muy activa', descripcion: 'Trabajo duro o entrenamiento intenso casi a diario' },
]

export const PREGUNTAS = {
  objetivo: '¿Qué quieres hacer con tu peso?',
  sexo: '¿Cuál es tu sexo?',
  edad: '¿Cuántos años tienes?',
  peso: '¿Cuánto pesas?',
  talla: '¿Cuánto mides?',
  actividad: '¿Cómo es tu día a día?',
}

export const NOTA_SEXO = 'Se usa solo porque la fórmula lo requiere'
