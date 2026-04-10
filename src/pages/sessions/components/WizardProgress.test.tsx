/**
 * Tests para WizardProgress
 *
 * ¿QUÉ testea este archivo?
 * El componente muestra 4 pasos: Entrada → Fase 1 → Fase 2 → Tests
 * Dependiendo del paso actual (currentStep), los pasos se ven diferente:
 *   - El paso actual: resaltado en primario
 *   - Pasos anteriores: completados (color muted)
 *   - Pasos futuros: apagados (baja opacidad)
 *
 * No testeamos clases CSS de Tailwind — eso es frágil y cambia seguido.
 * Testeamos COMPORTAMIENTO: que los textos correctos aparecen en la pantalla.
 */

import { render, screen } from '@testing-library/react'
import { WizardProgress } from './WizardProgress'

// "describe" agrupa tests relacionados. Es como una carpeta de tests.
// Primer argumento: nombre del grupo. Segundo: función con los tests adentro.
describe('WizardProgress', () => {

  // "test" o "it" define un caso específico a verificar.
  // Primer argumento: descripción de qué debería pasar.
  // Segundo: la función que hace la verificación.
  test('muestra los 4 pasos siempre', () => {
    // render() monta el componente en un DOM virtual (no en el browser real)
    render(<WizardProgress currentStep={0} />)

    // screen.getByText() busca un elemento que tenga ese texto.
    // Si NO lo encuentra, el test falla automáticamente.
    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Fase 1')).toBeInTheDocument()
    expect(screen.getByText('Fase 2')).toBeInTheDocument()
    expect(screen.getByText('Tests')).toBeInTheDocument()
  })

  test('en el paso 0 (Entrada), muestra todos los pasos', () => {
    render(<WizardProgress currentStep={0} />)

    // Todos los pasos deben estar visibles — no importa si están activos o no
    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Fase 1')).toBeInTheDocument()
    expect(screen.getByText('Fase 2')).toBeInTheDocument()
    expect(screen.getByText('Tests')).toBeInTheDocument()
  })

  test('en el paso 2 (Fase 2), muestra todos los pasos', () => {
    render(<WizardProgress currentStep={2} />)

    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Fase 1')).toBeInTheDocument()
    expect(screen.getByText('Fase 2')).toBeInTheDocument()
    expect(screen.getByText('Tests')).toBeInTheDocument()
  })

  test('en el último paso (Tests), muestra todos los pasos', () => {
    render(<WizardProgress currentStep={3} />)

    expect(screen.getByText('Entrada')).toBeInTheDocument()
    expect(screen.getByText('Fase 1')).toBeInTheDocument()
    expect(screen.getByText('Fase 2')).toBeInTheDocument()
    expect(screen.getByText('Tests')).toBeInTheDocument()
  })
})
