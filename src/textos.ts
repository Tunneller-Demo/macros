import type { Macro, ReglaDeProteccion } from '@/calculo'
import type { NivelDeActividad, Objetivo, Sexo, Unidades } from '@/datos'
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

export const UNIDADES: Opcion<Unidades>[] = [
  { valor: 'metrico', nombre: 'Métricas' },
  { valor: 'imperial', nombre: 'Imperiales' },
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
export const NOTA_OBJETIVO = 'Orientativa y para personas adultas. No apta para embarazo ni lactancia.'

export const ERROR_SIN_OPCION = 'Elige una opción para seguir'
const ERROR_DE_MENORES ='Esta calculadora es para personas adultas, a partir de 18 años'
export const ERRORES_DE_NUMERO = {
  edad: {
    rango: 'Introduce una edad entre 18 y 100 años',
    formato: 'Introduce una edad entre 18 y 100 años, sin decimales',
    bajoElMinimo: ERROR_DE_MENORES,
  },
  peso: {
    rango: 'Introduce un peso entre 35 y 250 kg',
    formato: 'Introduce un peso entre 35 y 250 kg, con un decimal como máximo',
  },
  talla: {
    rango: 'Introduce una talla entre 130 y 220 cm',
    formato: 'Introduce una talla entre 130 y 220 cm, sin decimales',
  },
  pesoEnLibras: {
    rango: 'Introduce un peso entre 78 y 551 lb',
    formato: 'Introduce un peso entre 78 y 551 lb, con un decimal como máximo',
  },
  tallaEnPies: {
    rango: `Introduce una talla entre 4'4" y 7'2"`,
    formato: `Introduce una talla entre 4'4" y 7'2", sin decimales`,
    pulgadas: `Introduce una talla entre 4'4" y 7'2", con pulgadas de 0 a 11`,
  },
}

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

export const MARGEN_DE_ERROR =
  'Es una estimación: tu gasto real puede variar unas 300 kcal arriba o abajo. Si tu peso no evoluciona como esperabas, ajusta.'

export const AVISO_ORIENTATIVO =
  'Este resultado es orientativo y no sustituye el consejo de un profesional sanitario. La calculadora está pensada para personas adultas: no sirve para menores ni durante el embarazo o la lactancia. Si tienes alguna enfermedad o dudas sobre tu alimentación, consulta a un profesional.'

export const CONSTRUIDA_CON = 'Construida con Tunneller'
