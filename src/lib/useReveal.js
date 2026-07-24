import { useEffect } from 'react'
import { initReveal } from './reveal'
import { initPointer } from './pointer'
import { initLouvres } from './louvres'
import { initSpecular } from './specular'
import { initMotionFallback } from './motion-fallback'

/**
 * Wires up the page's four pieces of behaviour: scroll reveals,
 * pointer proximity, the louvre cascade on the range cards, and the
 * lagged pointer specular.
 *
 * That is the entire runtime cost of this page. Everything else — the
 * entrance sequence, every hover, every scrubbed effect — is CSS the
 * compositor runs without asking the main thread.
 */
export function useReveal() {
  useEffect(() => {
    /*  FIRST, deliberately. The reveal understudy's hidden poses are
        applied at import time (before paint, to avoid a flash); the
        Observer that REMOVES them lives in initMotionFallback. Building
        it before the other inits means that even if one of them threw,
        the page could never be left hidden with no one to reveal it —
        the fail-open guarantee survives. No-ops entirely where the CSS
        scroll timelines are supported. See motion-fallback.js. */
    const stopMotionFallback = initMotionFallback()
    const stopReveal = initReveal()
    const stopPointer = initPointer()
    const stopLouvres = initLouvres()
    const stopSpecular = initSpecular()
    return () => {
      stopMotionFallback()
      stopReveal()
      stopPointer()
      stopLouvres()
      stopSpecular()
    }
  }, [])
}
