import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import Casa from './pages/Casa/Casa'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Casa />
  </StrictMode>,
)
