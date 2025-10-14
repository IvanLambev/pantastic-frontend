import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminAuth } from "@/context/AdminContext"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  const { adminToken, verifyAdminToken } = useAdminAuth()
  const [adminInfo, setAdminInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAdminInfo = async () => {
      if (adminToken) {
        try {
          const result = await verifyAdminToken(adminToken)
          if (result.success) {
            setAdminInfo(result.data)
          }
        } catch (error) {
          console.error("Failed to load admin info:", error)
        }
      }
      setLoading(false)
    }
    
    loadAdminInfo()
  }, [adminToken, verifyAdminToken])
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
        {adminInfo && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Admin: {adminInfo.email}</Badge>
            <Badge variant="outline">ID: {adminInfo.admin_id?.slice(0, 8)}...</Badge>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">€45,231.89</div>
            <p className="text-xs md:text-sm text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">2,345</div>
            <p className="text-xs md:text-sm text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">+573</div>
            <p className="text-xs md:text-sm text-muted-foreground">+201 since last hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Restaurants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">25</div>
            <p className="text-xs md:text-sm text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Debug information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Admin Session Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>Token Present:</strong> {adminToken ? 'Yes' : 'No'}</div>
            <div><strong>Token Length:</strong> {adminToken ? adminToken.length : 'N/A'}</div>
            <div><strong>Admin Info:</strong> {adminInfo ? JSON.stringify(adminInfo, null, 2) : 'Not loaded'}</div>
            <div><strong>Environment Admin Enabled:</strong> {import.meta.env.VITE_ADMIN_ENABLED || 'Not set'}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent orders content */}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Popular Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Popular items content */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}