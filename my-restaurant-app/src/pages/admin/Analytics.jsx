import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

export default function Analytics() {
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
      <h1 className="text-xl md:text-2xl font-bold mb-6">Analytics</h1>
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
    </div>
  )
}