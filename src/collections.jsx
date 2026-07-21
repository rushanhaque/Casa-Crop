import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import CollectionsPage from './pages/Collections/CollectionsPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CollectionsPage />
  </StrictMode>,
)
