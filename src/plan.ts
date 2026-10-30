import { enterosConLaMismaSuma, type Macro, type RepartoDeMacros } from '@/calculo'

export type TipoDeComida = 'desayuno' | 'media-manana' | 'almuerzo' | 'merienda' | 'cena'
export type NumeroDeComidas = 3 | 4 | 5
export type Comida = { tipo: TipoDeComida; porcentaje: number; calorias: number; gramos: Record<Macro, number> }

export const NUMEROS_DE_COMIDAS: NumeroDeComidas[] = [3, 4, 5]
export const COMIDAS_POR_DEFECTO: NumeroDeComidas = 4

const PORCENTAJES_DE_LAS_COMIDAS: Record<NumeroDeComidas, { tipo: TipoDeComida; porcentaje: number }[]> = {
  3: [
    { tipo: 'desayuno', porcentaje: 30 },
    { tipo: 'almuerzo', porcentaje: 40 },
    { tipo: 'cena', porcentaje: 30 },
  ],
  4: [
    { tipo: 'desayuno', porcentaje: 25 },
    { tipo: 'almuerzo', porcentaje: 35 },
    { tipo: 'merienda', porcentaje: 15 },
    { tipo: 'cena', porcentaje: 25 },
  ],
  5: [
    { tipo: 'desayuno', porcentaje: 20 },
    { tipo: 'media-manana', porcentaje: 10 },
    { tipo: 'almuerzo', porcentaje: 35 },
    { tipo: 'merienda', porcentaje: 10 },
    { tipo: 'cena', porcentaje: 25 },
  ],
}

// Reparte los totales ya redondeados, para que las comidas sumen justo lo que se ve del día.
export function planDeComidas(calorias: number, reparto: RepartoDeMacros, numero: NumeroDeComidas): Comida[] {
  const partes = PORCENTAJES_DE_LAS_COMIDAS[numero]
  const repartir = (total: number) =>
    enterosConLaMismaSuma(partes.map(({ porcentaje }) => (total * porcentaje) / 100))

  const caloriasPorComida = repartir(calorias)
  const proteina = repartir(reparto.proteina.gramos)
  const grasa = repartir(reparto.grasa.gramos)
  const carbohidratos = repartir(reparto.carbohidratos.gramos)

  return partes.map(({ tipo, porcentaje }, i) => ({
    tipo,
    porcentaje,
    calorias: caloriasPorComida[i],
    gramos: { proteina: proteina[i], grasa: grasa[i], carbohidratos: carbohidratos[i] },
  }))
}
