import { useState, useEffect } from "react"
import { useAdminAuth } from "@/context/AdminContext"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import AdminStats from "@/components/admin/AdminStats"
import RevenueChart from "@/components/admin/RevenueChart"
import { fetchDataAvailability, fetchRevenueByPeriod } from "@/services/adminApi"

export default function Dashboard() {
  const { adminToken, verifyAdminToken } = useAdminAuth()
  const [adminInfo, setAdminInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataAvailability, setDataAvailability] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState("week")

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

  // Fetch data availability
  useEffect(() => {
    const loadDataAvailability = async () => {
      try {
        const data = await fetchDataAvailability()
        setDataAvailability(data)
        console.log("Data availability:", data)
      } catch (error) {
        console.error("Failed to fetch data availability:", error)
      }
    }

    if (adminToken) {
      loadDataAvailability()
    }
  }, [adminToken])

  // Fetch revenue data based on time period
  useEffect(() => {
    const loadRevenueData = async () => {
      setRevenueLoading(true)
      try {
        const data = await fetchRevenueByPeriod(timePeriod)
        setRevenueData(data)
        console.log("Revenue data:", data)
      } catch (error) {
        console.error("Failed to fetch revenue data:", error)
      } finally {
        setRevenueLoading(false)
      }
    }

    if (adminToken) {
      loadRevenueData()
    }
  }, [adminToken, timePeriod])

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

  // Prepare stats data from revenue response
  const statsData = revenueData?.restaurants?.[0] ? {
    total_revenue: revenueData.restaurants.reduce((sum, r) => sum + r.total_revenue, 0),
    order_count: revenueData.restaurants.reduce((sum, r) => sum + r.order_count, 0),
    average_order_value: revenueData.restaurants.reduce((sum, r) => sum + r.average_order_value, 0) / revenueData.restaurants.length,
    comparison: revenueData.comparison
  } : null;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
          {adminInfo && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">Admin: {adminInfo.email}</Badge>
              <Badge variant="outline">ID: {adminInfo.admin_id?.slice(0, 8)}...</Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStats data={statsData} loading={revenueLoading} />

      {/* Revenue Chart */}
      <div className="mt-6">
        <RevenueChart data={revenueData} loading={revenueLoading} timePeriod={timePeriod} />
      </div>

      {/* Data Availability Info */}
      {dataAvailability && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Data Availability</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Orders</p>
              <p className="font-medium">{dataAvailability.all_orders?.total_orders || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid Orders</p>
              <p className="font-medium">{dataAvailability.paid_orders?.total_orders || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Days of Data</p>
              <p className="font-medium">{dataAvailability.all_orders?.days_of_data || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}