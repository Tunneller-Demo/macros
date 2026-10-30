// PROTOTIPO: dos direcciones visuales en la misma ruta, con ?variant=A|B.
// A ve todo a la vez en una etiqueta; B guía pregunta a pregunta. Código desechable.
import { useEffect, useState } from 'react'
import { calcular, cambiarUnidades, EJEMPLO, VACIO, type Datos, type NumeroComidas } from './calculo'
import { BarraDeVariantes, type Variante } from './BarraDeVariantes'
import { VarianteA } from './VarianteA'
import { VarianteB } from './VarianteB'

const VARIANTES: Variante[] = [
  { clave: 'A', nombre: 'Etiqueta' },
  { clave: 'B', nombre: 'Paso a paso' },
]

function varianteDeLaUrl() {
  const clave = new URLSearchParams(location.search).get('variant')
  return VARIANTES.some((v) => v.clave === clave) ? clave! : 'A'
}

export function App() {
  const [variante, setVariante] = useState(varianteDeLaUrl)
  const [datos, setDatos] = useState<Datos>(EJEMPLO)
  const [comidas, ponerComidas] = useState<NumeroComidas>(4)
  const [reinicios, setReinicios] = useState(0)

  useEffect(() => {
    const url = new URL(location.href)
    url.searchParams.set('variant', variante)
    history.replaceState(null, '', url)
    window.scrollTo(0, 0)
  }, [variante])

  const reiniciar = (nuevos: Datos) => {
    setDatos(nuevos)
    setReinicios((n) => n + 1)
  }

  const props = {
    datos,
    cambiar: (cambios: Partial<Datos>) => setDatos((d) => ({ ...d, ...cambios })),
    ponerUnidades: (unidades: Datos['unidades']) => setDatos((d) => cambiarUnidades(d, unidades)),
    resultado: calcular(datos),
    comidas,
    ponerComidas,
  }

  return (
    <>
      {variante === 'A' && <VarianteA {...props} />}
      {variante === 'B' && <VarianteB key={reinicios} {...props} />}
      <BarraDeVariantes
        variantes={VARIANTES}
        actual={variante}
        elegir={setVariante}
        rellenar={() => reiniciar(EJEMPLO)}
        vaciar={() => reiniciar(VACIO)}
      />
    </>
  )
}
