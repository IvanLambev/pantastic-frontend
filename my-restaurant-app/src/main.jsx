import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./context/AuthContext"
import './index.css'
import App from './App.jsx'
import { SpeedInsights } from "@vercel/speed-insights/react"
import SonnerToasterRoot from './components/ui/SonnerToasterRoot'
import { GoogleOAuthProvider } from '@react-oauth/google';

// Use a placeholder if not configured to prevent errors
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-client-id'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <SonnerToasterRoot />
          <SpeedInsights/>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
