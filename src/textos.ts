import type { Macro, ReglaDeProteccion } from '@/calculo'
import type { NivelDeActividad, Objetivo, Sexo } from '@/datos'
import type { TipoDeComida } from '@/plan'

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

export const MACROS: Opcion<Macro>[] = [
  { valor: 'proteina', nombre: 'Proteína' },
  { valor: 'grasa', nombre: 'Grasa' },
  { valor: 'carbohidratos', nombre: 'Carbohidratos' },
]

export const NOMBRES_DE_COMIDA: Record<TipoDeComida, string> = {
  desayuno: 'Desayuno',
  'media-manana': 'Media mañana',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
}

export const MENSAJES_DE_REGLA: Record<ReglaDeProteccion, string> = {
  'bajo-peso':
    'Con tu peso y tu talla no proponemos bajar: estas son las calorías que lo mantienen. Si quieres perder peso, consúltalo con un profesional sanitario.',
  'gasto-bajo':
    'Tu gasto diario ya es bajo, así que no proponemos recortarlo: estas son las calorías que mantienen tu peso.',
  'suelo-de-calorias': 'Hemos limitado el recorte para no proponerte menos de 1200 kcal al día.',
}
