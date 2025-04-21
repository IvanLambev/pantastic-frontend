declare module '@/config/api' {
  export const API_URL: string
}

declare module '@/context/AuthContext' {
  export interface AuthContextType {
    isLoggedIn: boolean
    handleLogout: () => void
  }
  export function useAuth(): AuthContextType
}

declare module '@/pages/*' {
  const component: React.ComponentType
  export default component
}

declare module '*.jsx' {
  const component: React.ComponentType
  export default component
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}