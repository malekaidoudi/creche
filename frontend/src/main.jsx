import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/responsive-fixes.css'
import './styles/form-fixes.css'
import './styles/flowbite-datepicker.css'
import 'flowbite'
import 'flowbite-datepicker'
import App from './App.jsx'

// Providers
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { DialogProvider } from './contexts/DialogContext.jsx'

// Configuration i18n
import './i18n/config.js'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Création du client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Listener pour les tests de responsivité (dev only)
import { initTestAuthListener } from './utils/testAuthListener.js'
initTestAuthListener()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LanguageProvider>
              <DialogProvider>
                <App />
              </DialogProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryClientProvider>
      </div>
    </BrowserRouter>
  </StrictMode>
)
