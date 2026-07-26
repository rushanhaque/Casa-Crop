import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import Admin from './pages/Admin/Admin'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Admin />
  </StrictMode>,
)
