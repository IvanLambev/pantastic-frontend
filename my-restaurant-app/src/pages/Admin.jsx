import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Route, Routes } from "react-router-dom"
import { AdminProvider } from "@/context/AdminContext"
import AdminProtectedRoute from "@/components/AdminProtectedRoute"
import AdminLogin from "./admin/AdminLogin"
import Dashboard from "./admin/Dashboard"
import Analytics from "./admin/Analytics"
import Projects from "./admin/Projects"
import Team from "./admin/Team"
import Restaurant from "./admin/Restaurant"
import OrderManagement from "./admin/OrderManagement"
import RestaurantDetailsAdmin from "./admin/RestaurantDetailsAdmin"

function AdminDashboard() {
  return (
    <div className="min-h-screen">
      <SidebarProvider>
        <div className="flex">
          <AppSidebar className="border-r border-gray-200" />
          <div className="flex-1">
            <SiteHeader className="border-b border-gray-200" />
            <main className="flex-1 space-y-4 p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/team" element={<Team />} />
                <Route path="/restaurant" element={<Restaurant />} />
                <Route path="/restaurant/:restaurantId" element={<RestaurantDetailsAdmin />} />
                <Route path="/orders" element={<OrderManagement />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default function Page() {
  return (
    <AdminProvider>
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/*" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
      </Routes>
    </AdminProvider>
  )
}
