import './App.css'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { useCart } from '@/hooks/use-cart'
import { ShoppingCart } from 'lucide-react'
import { Toaster } from "@/components/ui/sonner"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { SidebarProvider } from '@/components/ui/sidebar'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import About from '@/pages/About'
import Food from '@/pages/Food'
import Admin from '@/pages/Admin'
import Cart from '@/pages/Cart'
import RestaurantDetails from '@/pages/RestaurantDetails'
import OrderTracking from '@/pages/OrderTracking'

function MainLayout({ children }) {
  const { isLoggedIn, handleLogout } = useAuth()
  const { cartItems } = useCart()
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="relative flex min-h-screen flex-col">
      <NavigationMenu className="flex items-center justify-between px-8 py-4 shadow-sm bg-white min-w-[1200px]">
        <div className="flex items-start">
          <img src="/logo.webp" alt="Logo" className="h-12 w-auto" />
        </div>

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

        <div className="flex items-center gap-4">
          <Link to="/cart" className="text-gray-800 hover:text-primary relative">
            <ShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
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
      <Route path="/cart" element={<Cart />} />
      <Route path="/restaurant/:id" element={<RestaurantDetails />} />
      <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
      {isLoggedIn && <Route path="/admin/*" element={<Admin />} />}
    </Routes>
  )

  return (
    <CartProvider>
      <SidebarProvider>
        {isAdminPage ? content : <MainLayout>{content}</MainLayout>}
        <Toaster />
      </SidebarProvider>
    </CartProvider>
  )
}

export default App