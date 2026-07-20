import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Casa from './pages/Casa/Casa'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Casa />
  </StrictMode>,
)
