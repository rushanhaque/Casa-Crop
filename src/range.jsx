import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Range from './pages/Range/Range'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Range />
  </StrictMode>,
)
