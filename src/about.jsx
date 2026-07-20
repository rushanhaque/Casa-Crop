import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import About from './pages/About/About'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <About />
  </StrictMode>,
)
