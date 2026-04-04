import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode removed — it causes Supabase auth lock contention in dev
// by mounting components twice, triggering "lock not released within 5000ms".
// The app behaves identically; re-add StrictMode only if you need its
// double-render checks and are okay with the console warning.
createRoot(document.getElementById('root')).render(
  <App />
)
