import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './app/App.jsx'
import { useInitPageMetrics } from './shared/hooks/useUsabilityMetrics'

function Root() {
  // init basic page metrics for the whole SPA
  useInitPageMetrics('app-root');
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
