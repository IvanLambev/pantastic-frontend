import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./context/AuthContext"
import './index.css'
import App from './App.jsx'
import { SpeedInsights } from "@vercel/speed-insights/react"
import SonnerToasterRoot from './components/ui/SonnerToasterRoot'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
        <App />
        <SonnerToasterRoot />
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
