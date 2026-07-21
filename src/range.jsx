import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import Range from './pages/Range/Range'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Range />
  </StrictMode>,
)
