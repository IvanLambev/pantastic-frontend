import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { fetchWithAdminAuth } from "@/utils/adminAuth"
import { API_URL } from "@/config/api"

export default function Analytics() {
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

  // Sample data for charts in Recharts format
  const salesData = [
    { month: "Jan", sales: 30 },
    { month: "Feb", sales: 40 },
    { month: "Mar", sales: 45 },
    { month: "Apr", sales: 50 },
    { month: "May", sales: 49 },
    { month: "Jun", sales: 60 }
  ]

  const ordersData = [
    { day: "Mon", orders: 31 },
    { day: "Tue", orders: 40 },
    { day: "Wed", orders: 28 },
    { day: "Thu", orders: 51 },
    { day: "Fri", orders: 42 },
    { day: "Sat", orders: 109 },
    { day: "Sun", orders: 100 }
  ]

  const chartConfig = {
    sales: {
      label: "Sales",
      theme: {
        light: "hsl(var(--primary))",
        dark: "hsl(var(--primary))"
      }
    }
  }

  return (
    <div className="container px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">Analytics</h1>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Sales Overview</CardTitle>
            <CardDescription>Monthly sales performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] md:h-[400px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip content={(props) => <ChartTooltipContent {...props} />} />
                    <Bar dataKey="sales" fill="var(--color-sales)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Orders Analysis</CardTitle>
            <CardDescription>Weekly order trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] md:h-[400px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={(props) => <ChartTooltipContent {...props} />} />
                    <Line type="monotone" dataKey="orders" stroke="var(--color-sales)" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

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