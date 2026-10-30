import { useEffect } from 'react'

export type Variante = { clave: string; nombre: string }

type Props = {
  variantes: Variante[]
  actual: string
  elegir: (clave: string) => void
  rellenar: () => void
  vaciar: () => void
}

export function BarraDeVariantes({ variantes, actual, elegir, rellenar, vaciar }: Props) {
  const indice = variantes.findIndex((v) => v.clave === actual)
  const mover = (paso: number) =>
    elegir(variantes[(indice + paso + variantes.length) % variantes.length].clave)

  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.matches('input, textarea, [contenteditable]')) return
      if (e.key === 'ArrowLeft') mover(-1)
      if (e.key === 'ArrowRight') mover(1)
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  })

  if (import.meta.env.PROD) return null

  const boton = 'rounded-full px-2.5 py-1 hover:bg-white/15'
  return (
    <div className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-black px-2 py-1.5 font-sans text-xs text-white shadow-[0_4px_20px_rgba(0,0,0,.45)] ring-2 ring-white">
      <button className={boton} onClick={() => mover(-1)} aria-label="Variante anterior">←</button>
      <span className="px-1 font-semibold">{actual} — {variantes[indice].nombre}</span>
      <button className={boton} onClick={() => mover(1)} aria-label="Variante siguiente">→</button>
      <span className="mx-1 h-4 w-px bg-white/30" />
      <button className={boton} onClick={rellenar}>Ejemplo</button>
      <button className={boton} onClick={vaciar}>Vaciar</button>
    </div>
  )
}
