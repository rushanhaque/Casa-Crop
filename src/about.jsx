import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import About from './pages/About/About'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <About />
  </StrictMode>,
)
