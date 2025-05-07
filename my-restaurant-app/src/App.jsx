import { useState } from 'react'
import './App.css'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { useCart } from '@/hooks/use-cart'
import { ShoppingCart, Menu } from 'lucide-react'
import { Toaster } from "@/components/ui/sonner"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { SidebarProvider } from '@/components/ui/sidebar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Footer } from '@/components/Footer'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import About from '@/pages/About'
import Food from '@/pages/Food'
import Admin from '@/pages/Admin'
import Cart from '@/pages/Cart'
import RestaurantDetails from '@/pages/RestaurantDetails'
import OrderTracking from '@/pages/OrderTracking'
import UserDashboardPage from './pages/UserDashboard'

function MainLayout({ children }) {
  const { isLoggedIn, handleLogout } = useAuth()
  const { cartItems } = useCart()
  const [open, setOpen] = useState(false)
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="sticky top-0 w-full border-b bg-background z-50">
        <div className="container">
          <div className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
            <div className="flex items-center">
              <img src="/logo.webp" alt="Logo" className="h-8 w-auto" />
              {/* Show cart on mobile when items exist */}
              {cartItemCount > 0 && (
                <Link to="/cart" className="relative md:hidden ml-4">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </Link>
              )}
            </div>

            <NavigationMenu className="hidden md:flex mx-auto">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/about">About</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link to="/food">Food</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                {isLoggedIn && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/admin">Admin</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative hidden md:inline-flex">
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:flex items-center space-x-2">
                {isLoggedIn ? (
                  <button 
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link 
                      to="/login"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input"
                    >
                      Login
                    </Link>
                    <Link 
                      to="/signup"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <button>
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full flex flex-col">
                  <SheetHeader className="text-center border-b pb-4">
                    <div className="flex justify-center">
                      <img src="/logo.webp" alt="Logo" className="h-8 w-auto object-contain" />
                    </div>
                  </SheetHeader>
                  <div className="flex flex-col items-center gap-6 mt-8">
                    <div className="flex flex-col items-center gap-4">
                      <Link to="/" onClick={() => setOpen(false)} className="text-foreground hover:text-primary">
                        Home
                      </Link>
                      <Link to="/about" onClick={() => setOpen(false)} className="text-foreground hover:text-primary">
                        About
                      </Link>
                      <Link to="/food" onClick={() => setOpen(false)} className="text-foreground hover:text-primary">
                        Food
                      </Link>
                      {isLoggedIn && (
                        <Link to="/admin" onClick={() => setOpen(false)} className="text-foreground hover:text-primary">
                          Admin
                        </Link>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full max-w-[200px] mt-4">
                      {isLoggedIn ? (
                        <button 
                          onClick={() => {
                            handleLogout()
                            setOpen(false)
                          }}
                          className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9"
                        >
                          Logout
                        </button>
                      ) : (
                        <>
                          <Link 
                            to="/login" 
                            onClick={() => setOpen(false)}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input"
                          >
                            Login
                          </Link>
                          <Link 
                            to="/signup"
                            onClick={() => setOpen(false)}
                            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9"
                          >
                            Sign Up
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
      <Footer />
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
      <Route path="/user-dashboard" element={<UserDashboardPage />} />
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