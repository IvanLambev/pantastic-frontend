import './App.css'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from "./context/AuthContext"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { SidebarProvider } from '@/components/ui/sidebar'
import Home from './pages/home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import About from './pages/About'
import Food from './pages/Food'
import Admin from './pages/Admin'
import RestaurantDetails from './pages/RestaurantDetails'

function MainLayout({ children }) {
  const { isLoggedIn, handleLogout } = useAuth()

  return (
    <div className="relative flex min-h-screen flex-col">
      <NavigationMenu className="flex items-center justify-between px-8 py-4 shadow-sm bg-white min-w-[1200px]">
        {/* Logo */}
        <div className="flex items-start">
          <img src="/logo.webp" alt="Logo" className="h-12 w-auto" />
        </div>

        {/* Navigation Links */}
        <NavigationMenuList className="flex gap-8 px-8 justify-center">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/" className="text-gray-800 hover:text-primary">Home</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/about" className="text-gray-800 hover:text-primary">About</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link to="/food" className="text-gray-800 hover:text-primary">Food</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          {isLoggedIn && (
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/admin" className="text-gray-800 hover:text-primary">Admin</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>

        {/* User Status and Auth Buttons */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-gray-800 hover:text-primary px-4 py-2 border border-gray-200 rounded-md hover:border-primary transition-colors"
            >
              Logout
            </button>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-gray-800 hover:text-primary px-4 py-2 border border-gray-200 rounded-md hover:border-primary transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </NavigationMenu>

      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

function App() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const isAdminPage = location.pathname.startsWith('/admin')

  const content = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/about" element={<About />} />
      <Route path="/food" element={<Food />} />
      <Route path="/restaurant/:id" element={<RestaurantDetails />} />
      {isLoggedIn && <Route path="/admin/*" element={<Admin />} />}
    </Routes>
  )

  return (
    <SidebarProvider>
      {isAdminPage ? content : <MainLayout>{content}</MainLayout>}
    </SidebarProvider>
  )
}

export default App