import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route, Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotFound from '@/pages/NotFound'
import { CartProvider } from '@/context/CartContext'
import { useCart } from '@/hooks/use-cart'
import { ShoppingCart, Menu, User, LogOut } from 'lucide-react'
import { Toaster } from "@/components/ui/sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import About from '@/pages/About'
import Food from '@/pages/Food'
import Admin from '@/pages/Admin'
import Checkout from '@/pages/CheckoutV2'
import RestaurantDetails from '@/pages/RestaurantDetails'
import RestaurantDetailsAdmin from '@/pages/admin/RestaurantDetailsAdmin'
import OrderTrackingV2 from '@/pages/OrderTrackingV2'
import UserDashboard from '@/pages/UserDashboard'
import ItemDetails from '@/pages/ItemDetails'
import Cart from '@/pages/Cart'
import PaymentSuccess from '@/pages/PaymentSuccess'
import Lenis from 'lenis'
import { Footer } from "@/components/Footer"
import DeluxeBox from '@/pages/DeluxeBox'
import 'leaflet/dist/leaflet.css';


function useLenisSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      smooth: true,
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => {
      lenis.destroy()
    }
  }, [])
}

function AppWithLenis({ children }) {
  useLenisSmoothScroll()
  return children
}

function MainLayout() {
  const { isLoggedIn, handleLogout, isAdmin } = useAuth()
  const { cartItems } = useCart()

  // Global redirect from dev domain to production domain
  useEffect(() => {
    const currentUrl = window.location.href
    if (currentUrl.includes('dev.palachinki.store')) {
      const newUrl = currentUrl.replace('dev.palachinki.store', 'palachinki.store')
      console.log('Redirecting from dev domain to production:', newUrl)
      window.location.replace(newUrl)
    }
  }, [])
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  // Only hide navbar for /admin and its subroutes
  const isAdminPage = location.pathname.startsWith('/admin')
  
  // Check if admin functionality is enabled
  const isAdminEnabled = import.meta.env.VITE_ADMIN_ENABLED === 'true'

  // Show navbar on all pages except /admin and its subroutes
  return isAdminPage ? (
    <main className="flex-1">
      <Outlet />
    </main>
  ) : (
    <div className="relative min-h-screen flex flex-col">
      <header className="sticky top-0 w-full border-b bg-background z-50">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <img src="/logo.webp" alt="Logo" className="h-8 w-auto" />
            </div>

            <NavigationMenu className="hidden md:flex">
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
                {isLoggedIn && isAdmin && isAdminEnabled && (
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link to="/admin">Admin</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center gap-4">
              {/* Cart icon for mobile */}
              {cartItemCount > 0 && (
                <Link to="/cart" className="relative md:hidden">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {cartItemCount}
                  </span>
                </Link>
              )}

              {/* Desktop cart and user menu */}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full w-9 h-9 border border-input hover:bg-accent">
                      <User className="h-5 w-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      {isAdmin && isAdminEnabled && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2">
                            <span>Admin</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                        <LogOut className="h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

              {/* Mobile menu button */}
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <button>
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full flex flex-col">
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
                      {isLoggedIn && isAdmin && isAdminEnabled && (
                        <Link to="/admin" onClick={() => setOpen(false)} className="text-foreground hover:text-primary">
                          Admin
                        </Link>
                      )}
                    </div>
                    <div className="w-full border-t pt-4 px-4">
                      {isLoggedIn ? (
                        <div className="flex flex-col gap-4">
                          <Link 
                            to="/dashboard" 
                            onClick={() => setOpen(false)} 
                            className="flex items-center gap-2 text-foreground hover:text-primary"
                          >
                            <User className="h-4 w-4" />
                            <span>Dashboard</span>
                          </Link>
                          <button 
                            onClick={() => {
                              handleLogout();
                              setOpen(false);
                            }} 
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Log out</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <Link 
                            to="/login" 
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input w-full"
                          >
                            Login
                          </Link>
                          <Link 
                            to="/signup" 
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 w-full"
                          >
                            Sign Up
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div> {/* end flex items-center gap-4 */}
          </div> {/* end flex h-16 items-center justify-between */}
        </div> {/* end container */}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route element={<AppWithLenis><MainLayout /></AppWithLenis>}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<About />} />
          <Route path="/food" element={<Food />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/restaurant/:id" element={<RestaurantDetails />} />
          <Route path="/restaurants/:restaurantId/items/:itemId" element={<ItemDetails />} />
          <Route path="/order-tracking" element={<OrderTrackingV2 />} />
          <Route path="/order-tracking-v2/:orderId" element={<OrderTrackingV2 />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/deluxe-box" element={<DeluxeBox />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
      
    </CartProvider>
  )
}