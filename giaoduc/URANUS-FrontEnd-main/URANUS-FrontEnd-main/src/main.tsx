import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { HelmetProvider } from 'react-helmet-async'

import { applyColorTheme, readStoredColorTheme } from './utils/colorThemes'
import { startScrollReveal } from './utils/scrollReveal'

const storedTheme = localStorage.getItem('uranus-theme');
const prefersDark =
  storedTheme === 'dark' ||
  (storedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
if (prefersDark) document.documentElement.classList.add('dark');

applyColorTheme(readStoredColorTheme());

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

async function boot() {
  // Bản demo gửi khách: API chạy giả lập trong trình duyệt, không cần backend
  if (import.meta.env.VITE_DEMO === 'true') {
    const [{ installDemoApi }, { default: api }] = await Promise.all([import('./demo/mockServer'), import('./services/api')]);
    installDemoApi(api);
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
  )
}
boot();
startScrollReveal();

