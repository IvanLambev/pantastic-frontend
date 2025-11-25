import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route, Link, Outlet, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import NotFound from '@/pages/NotFound'
import { CartProvider } from '@/context/CartContext'
import { useCart } from '@/hooks/use-cart'
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider } from '@/components/ui/sidebar'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import About from '@/pages/About'
import Food from '@/pages/Food'
import Admin from '@/pages/Admin'
import Checkout from '@/pages/CheckoutV2'
import CheckoutLogin from '@/pages/CheckoutLogin'
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

  // COMMENTED OUT: Global redirect from dev domain to production domain
  // This was preventing dev.palachinki.store from working
  // useEffect(() => {
  //   const currentUrl = window.location.href
  //   if (currentUrl.includes('dev.palachinki.store')) {
  //     const newUrl = currentUrl.replace('dev.palachinki.store', 'www.palachinki.store')
  //     console.log('Redirecting from dev domain to production:', newUrl)
  //     window.location.replace(newUrl)
  //   }
  // }, [])
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
      <Navbar />

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/food" element={<Food />} />
          <Route path="/checkout-login" element={<CheckoutLogin />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout-v2" element={<Checkout />} />
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