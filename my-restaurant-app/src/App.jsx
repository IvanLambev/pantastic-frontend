import { useEffect } from 'react'
import './App.css'
import { Routes, Route, Link, Outlet, useLocation } from 'react-router-dom'
import NotFound from '@/pages/NotFound'
import { CartProvider } from '@/context/CartContext'
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
import Lenis from 'lenis'
import { Footer } from "@/components/Footer"
import Navbar from '@/components/Navbar'

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
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Only hide Navbar on admin pages, show on all others */}
      {!isAdminPage && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<AppWithLenis><MainLayout /></AppWithLenis>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<About />} />
        <Route path="/food" element={<Food />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/restaurant/:id" element={<RestaurantDetails />} />
        <Route path="/admin/restaurant/:id" element={<RestaurantDetailsAdmin />} />
        <Route path="/order-tracking" element={<OrderTrackingV2 />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/item-details/:id" element={<ItemDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
    </CartProvider>
  )
}