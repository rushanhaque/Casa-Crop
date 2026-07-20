import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Connect from './pages/Connect/Connect'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Connect />
  </StrictMode>,
)
