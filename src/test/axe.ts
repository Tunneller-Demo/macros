import axe from 'axe-core'

// jsdom no calcula colores: el contraste se comprueba en un navegador real.
export async function infraccionesDeAxe() {
  const { violations } = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })
  return violations.map(({ id, nodes }) => `${id}: ${nodes.map((nodo) => nodo.html).join(' | ')}`)
}
