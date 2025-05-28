import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
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
import OrderTrackingV2 from '@/pages/OrderTrackingV2'
import UserDashboard from '@/pages/UserDashboard'
import Lenis from 'lenis'

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
              </Link>              <div className="hidden md:flex items-center space-x-2">
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
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}

function App() {
  return (
    <AppWithLenis>
      <CartProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/food" element={<Food />} />
            <Route path="/login" element={<Login />} />            <Route path="/signup" element={<SignUp />} />
            <Route path="/cart" element={<Checkout />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/restaurant/:id" element={<RestaurantDetails />} />
            <Route path="/order-tracking-v2/:orderId" element={<OrderTrackingV2 />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </CartProvider>
    </AppWithLenis>
  )
}

export default App