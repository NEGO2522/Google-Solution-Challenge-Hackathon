import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.jsx'

// Register the PWA service worker.
// autoUpdate: true in vite.config.js means the SW updates silently in the
// background. We hook onNeedRefresh to optionally prompt the user, but for
// field volunteers a silent auto-update is the best default.
registerSW({
  onNeedRefresh() {
    // A new version is available — the SW will activate on next reload.
    console.info('[PWA] New version available — will update on next page load.')
  },
  onOfflineReady() {
    console.info('[PWA] VolunteerBridge is ready for offline use.')
  },
  onRegistered(swRegistration) {
    console.info('[PWA] Service worker registered:', swRegistration)
  },
  onRegisterError(error) {
    console.error('[PWA] Service worker registration failed:', error)
  },
})

// StrictMode removed — it causes Supabase auth lock contention in dev
// by mounting components twice, triggering "lock not released within 5000ms".
createRoot(document.getElementById('root')).render(
  <App />
)
