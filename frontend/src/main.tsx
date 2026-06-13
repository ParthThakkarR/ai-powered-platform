import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import './App.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e2e8f0',
          fontFamily: "'Inter', sans-serif",
        },
      }}
      richColors
      closeButton
    />
  </>
)
