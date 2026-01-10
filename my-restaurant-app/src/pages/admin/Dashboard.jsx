import { useState, useEffect } from "react"
import { useAdminAuth } from "@/context/AdminContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download } from "lucide-react"
import AdminStats from "@/components/admin/AdminStats"
import RevenueChart from "@/components/admin/RevenueChart"
import { fetchDataAvailability, fetchRevenueByPeriod, fetchRestaurants } from "@/services/adminApi"
import { fetchWithAdminAuth } from "@/utils/adminAuth"
import { API_URL } from "@/config/api"

export default function Dashboard() {
  const { adminToken, verifyAdminToken } = useAdminAuth()
  const [adminInfo, setAdminInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataAvailability, setDataAvailability] = useState(null)
  const [revenueData, setRevenueData] = useState(null)
  const [revenueLoading, setRevenueLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState("week")
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState("all")
  const [restaurantsLoading, setRestaurantsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)

  // Generate month options for the last 12 months
  const generateMonthOptions = () => {
    const options = []
    const currentDate = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const value = `${year}-${month}`
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }

    return options
  }

  const monthOptions = generateMonthOptions()

  const handleDownloadReport = async () => {
    if (!selectedMonth) {
      return
    }

    setIsDownloading(true)

    try {
      const response = await fetchWithAdminAuth(
        `${API_URL}/restaurant/admin/reports/monthly?month=${selectedMonth}`
      )

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.status}`)
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `monthly-report-${selectedMonth}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Close dialog
      setIsDialogOpen(false)
      setSelectedMonth("")
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

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

  // Fetch restaurants list
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await fetchRestaurants()
        setRestaurants(data)
        console.log("Restaurants loaded:", data)
      } catch (error) {
        console.error("Failed to fetch restaurants:", error)
      } finally {
        setRestaurantsLoading(false)
      }
    }

    if (adminToken) {
      loadRestaurants()
    }
  }, [adminToken])

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

  // Fetch revenue data based on time period and selected restaurant
  useEffect(() => {
    const loadRevenueData = async () => {
      setRevenueLoading(true)
      try {
        const restaurantId = selectedRestaurant === "all" ? null : selectedRestaurant
        const data = await fetchRevenueByPeriod(timePeriod, restaurantId)
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
  }, [adminToken, timePeriod, selectedRestaurant])

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
    comparison: revenueData.comparison,
    total_restaurants: revenueData.total_restaurants || revenueData.restaurants.length,
    restaurants: revenueData.restaurants
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

        <div className="flex items-center gap-2 flex-wrap">
          {/* Download Report Button */}
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Report
          </Button>

          {/* Restaurant Selector */}
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant} disabled={restaurantsLoading}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant.restaurant_id} value={restaurant.restaurant_id}>
                  {restaurant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Time Period Selector */}
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

      {/* Download Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Download Monthly Report</DialogTitle>
            <DialogDescription>
              Select a month to download the .xlsx report
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false)
                setSelectedMonth("")
              }}
              disabled={isDownloading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownloadReport}
              disabled={!selectedMonth || isDownloading}
            >
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}