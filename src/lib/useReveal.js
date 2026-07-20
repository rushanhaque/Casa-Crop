import { useEffect } from 'react'
import { initReveal } from './reveal'
import { initPointer } from './pointer'
import { initLouvres } from './louvres'

/**
 * Wires up the page's three pieces of behaviour: scroll reveals,
 * pointer proximity, and the louvre cascade on the range cards.
 *
 * That is the entire runtime cost of this page. Everything else — the
 * entrance sequence, every hover, every scrubbed effect — is CSS the
 * compositor runs without asking the main thread.
 */
export function useReveal() {
  useEffect(() => {
    const stopReveal = initReveal()
    const stopPointer = initPointer()
    const stopLouvres = initLouvres()
    return () => {
      stopReveal()
      stopPointer()
      stopLouvres()
    }
  }, [])
}
