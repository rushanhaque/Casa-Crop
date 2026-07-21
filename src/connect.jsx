import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import Connect from './pages/Connect/Connect'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Connect />
  </StrictMode>,
)
