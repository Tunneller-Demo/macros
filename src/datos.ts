import { ERROR_SIN_OPCION, ERRORES_DE_NUMERO } from '@/textos'

export type Objetivo = 'bajar' | 'mantener' | 'subir'
export type Sexo = 'mujer' | 'hombre'
export type NivelDeActividad = 'sedentaria' | 'moderada' | 'activa' | 'muy-activa'
export type Unidades = 'metrico' | 'imperial'

// Lo que la persona ha respondido, tal como lo ha escrito.
// En imperial, la talla está en pies y pulgadas y `talla` queda vacía; en métrico, al revés.
export type Respuestas = {
  objetivo: Objetivo | ''
  sexo: Sexo | ''
  edad: string
  unidades: Unidades
  peso: string
  talla: string
  pies: string
  pulgadas: string
  actividad: NivelDeActividad | ''
}

// Siempre en métrico: kg y cm.
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
  unidades: 'metrico',
  peso: '',
  talla: '',
  pies: '',
  pulgadas: '',
  actividad: '',
}

export type DatoNumerico = 'edad' | 'peso' | 'talla'
type Pregunta = DatoNumerico | 'objetivo' | 'sexo' | 'actividad'

type Rango = { minimo: number; maximo: number; decimales: number }
type Errores = { rango: string; formato: string; bajoElMinimo?: string }

const RANGOS: Record<DatoNumerico, Rango> = {
  edad: { minimo: 18, maximo: 100, decimales: 0 },
  peso: { minimo: 35, maximo: 250, decimales: 1 },
  talla: { minimo: 130, maximo: 220, decimales: 0 },
}
const RANGO_EN_LIBRAS: Rango = { minimo: 78, maximo: 551, decimales: 1 }
// De 4'4" a 7'2".
const RANGO_EN_PULGADAS = { minimo: 52, maximo: 86 }

const KG_POR_LIBRA = 0.45359237
const CM_POR_PULGADA = 2.54
const PULGADAS_POR_PIE = 12
const PULGADAS_MAXIMAS = 11

const NUMERO = /^\d+([.,]\d+)?$/

function aNumero(escrito: string) {
  return Number(escrito.trim().replace(',', '.'))
}

function errorNumerico(escrito: string, { minimo, maximo, decimales }: Rango, { rango, formato, bajoElMinimo = rango }: Errores) {
  const limpio = escrito.trim()
  if (!NUMERO.test(limpio)) return rango
  const numero = aNumero(limpio)
  if (numero < minimo) return bajoElMinimo
  if (numero > maximo) return rango
  const [, parteDecimal = ''] = limpio.split(/[.,]/)
  return parteDecimal.length > decimales ? formato : null
}

// Las pulgadas vacías cuentan como 0.
function pulgadasDe(escrito: string) {
  return escrito.trim() || '0'
}

function pulgadasTotales(pies: string, pulgadas: string) {
  return aNumero(pies) * PULGADAS_POR_PIE + aNumero(pulgadasDe(pulgadas))
}

function errorDeTallaEnPies(pies: string, pulgadas: string) {
  const { rango, formato, pulgadas: fueraDeRango } = ERRORES_DE_NUMERO.tallaEnPies
  const [piesLimpios, pulgadasLimpias] = [pies.trim(), pulgadasDe(pulgadas)]
  if (!NUMERO.test(piesLimpios) || !NUMERO.test(pulgadasLimpias)) return rango
  const total = pulgadasTotales(piesLimpios, pulgadasLimpias)
  if (total < RANGO_EN_PULGADAS.minimo || total > RANGO_EN_PULGADAS.maximo) return rango
  if (aNumero(pulgadasLimpias) > PULGADAS_MAXIMAS) return fueraDeRango
  return /[.,]/.test(piesLimpios + pulgadasLimpias) ? formato : null
}

// El mensaje que explica qué corregir en una pregunta, o null si el dato vale.
export function errorDe(pregunta: Pregunta, respuestas: Respuestas) {
  const enImperial = respuestas.unidades === 'imperial'
  switch (pregunta) {
    case 'edad':
      return errorNumerico(respuestas.edad, RANGOS.edad, ERRORES_DE_NUMERO.edad)
    case 'peso':
      return enImperial
        ? errorNumerico(respuestas.peso, RANGO_EN_LIBRAS, ERRORES_DE_NUMERO.pesoEnLibras)
        : errorNumerico(respuestas.peso, RANGOS.peso, ERRORES_DE_NUMERO.peso)
    case 'talla':
      return enImperial
        ? errorDeTallaEnPies(respuestas.pies, respuestas.pulgadas)
        : errorNumerico(respuestas.talla, RANGOS.talla, ERRORES_DE_NUMERO.talla)
    default:
      return respuestas[pregunta] ? null : ERROR_SIN_OPCION
  }
}

export function leerDatos(respuestas: Respuestas): Datos | null {
  const { objetivo, sexo, edad, unidades, peso, talla, pies, pulgadas, actividad } = respuestas
  if (!objetivo || !sexo || !actividad) return null
  if (errorDe('edad', respuestas) ?? errorDe('peso', respuestas) ?? errorDe('talla', respuestas)) return null
  const enImperial = unidades === 'imperial'
  return {
    objetivo,
    sexo,
    edad: aNumero(edad),
    peso: enImperial ? aNumero(peso) * KG_POR_LIBRA : aNumero(peso),
    talla: enImperial ? pulgadasTotales(pies, pulgadas) * CM_POR_PULGADA : aNumero(talla),
    actividad,
  }
}

function conUnDecimal(numero: number) {
  return numero.toLocaleString('es', { maximumFractionDigits: 1, useGrouping: false })
}

function limitar(numero: number, { minimo, maximo }: Pick<Rango, 'minimo' | 'maximo'>) {
  return Math.min(Math.max(numero, minimo), maximo)
}

function aImperial(respuestas: Respuestas): Partial<Respuestas> {
  const { peso, talla } = respuestas
  // Los rangos métrico e imperial no coinciden en los extremos: un dato válido se ajusta para seguir siéndolo,
  // porque la persona puede estar ya en otra pregunta y no vería su error.
  const libras = aNumero(peso) / KG_POR_LIBRA
  const librasAjustadas = errorDe('peso', respuestas) ? libras : limitar(libras, RANGO_EN_LIBRAS)
  const pulgadas = Math.round(aNumero(talla) / CM_POR_PULGADA)
  const pulgadasAjustadas = errorDe('talla', respuestas) ? pulgadas : limitar(pulgadas, RANGO_EN_PULGADAS)
  const tallaLegible = NUMERO.test(talla.trim())
  return {
    unidades: 'imperial',
    peso: NUMERO.test(peso.trim()) ? conUnDecimal(librasAjustadas) : '',
    talla: '',
    pies: tallaLegible ? String(Math.floor(pulgadasAjustadas / PULGADAS_POR_PIE)) : '',
    pulgadas: tallaLegible ? String(pulgadasAjustadas % PULGADAS_POR_PIE) : '',
  }
}

function aMetrico(respuestas: Respuestas): Partial<Respuestas> {
  const { peso, pies, pulgadas } = respuestas
  const tallaLegible = NUMERO.test(pies.trim()) && NUMERO.test(pulgadasDe(pulgadas))
  return {
    unidades: 'metrico',
    peso: NUMERO.test(peso.trim()) ? conUnDecimal(aNumero(peso) * KG_POR_LIBRA) : '',
    talla: tallaLegible ? String(Math.round(pulgadasTotales(pies, pulgadas) * CM_POR_PULGADA)) : '',
    pies: '',
    pulgadas: '',
  }
}

// Los cambios que dejan lo ya escrito en las unidades nuevas. Lo que no se entiende queda vacío.
export function cambiarUnidades(respuestas: Respuestas, unidades: Unidades) {
  return unidades === 'imperial' ? aImperial(respuestas) : aMetrico(respuestas)
}

// El peso y la talla como se muestran, en las unidades que eligió la persona.
export function medidasDe({ unidades, peso, talla, pies, pulgadas }: Respuestas) {
  if (unidades === 'imperial') {
    return { peso: `${conUnDecimal(aNumero(peso))} lb`, talla: `${aNumero(pies)}'${aNumero(pulgadasDe(pulgadas))}"` }
  }
  return { peso: `${conUnDecimal(aNumero(peso))} kg`, talla: `${aNumero(talla)} cm` }
}
