import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CollectionsPage from './pages/Collections/CollectionsPage'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CollectionsPage />
  </StrictMode>,
)
