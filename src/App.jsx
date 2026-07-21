import { useEffect } from 'react'
import Threshold from './components/Threshold/Threshold'
import { initPointer } from './lib/pointer'
import { initSpecular } from './lib/specular'

export default function App() {
  /*  The threshold is otherwise inert — these are the only two
      behaviours it runs, and both gate themselves off on touch
      devices and under reduced motion. */
  useEffect(() => {
    const stopPointer = initPointer()
    const stopSpecular = initSpecular()
    return () => {
      stopPointer()
      stopSpecular()
    }
  }, [])

  return <Threshold />
}
