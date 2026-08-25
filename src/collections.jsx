import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
/*  Reloads the page once if this bundle is from an older deploy than
    the one the site is now serving. Imported by every entry, because a
    stale build is stale on whichever page the visitor happens to be. */
import './lib/version'
import CollectionsPage from './pages/Collections/CollectionsPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CollectionsPage />
  </StrictMode>,
)
