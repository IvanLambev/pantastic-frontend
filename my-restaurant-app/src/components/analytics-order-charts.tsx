import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity } from "lucide-react";
import { safeToFixed } from "@/lib/utils";

interface OrderMetricsData {
  period: string;
  total_orders: number;
  orders_by_status: {
    Pending: number;
    "In Progress": number;
    Ready: number;
    Delivered: number;
    Canceled: number;
  };
  orders_by_delivery_method: {
    delivery: number;
    pickup: number;
  };
  avg_preparation_time_minutes: number;
  avg_delivery_delay_minutes: number;
  cancellation_rate_percent: number;
  scheduled_vs_asap: {
    scheduled: number;
    asap: number;
    scheduled_percentage: number;
  };
  cutlery_request_rate_percent: number;
}

interface OrderChartsProps {
  data: OrderMetricsData;
  timeSeriesData?: Array<{
    date: string;
    total_orders: number;
    avg_preparation_time: number;
  }>;
}

const STATUS_COLORS = {
  'Pending': 'var(--chart-1)',
  'In Progress': 'var(--chart-2)',
  'Ready': 'var(--chart-3)',
  'Delivered': 'var(--chart-4)',
  'Canceled': 'var(--chart-5)',
};

const chartConfig = {
  total_orders: {
    label: "Total Orders",
    color: "var(--chart-1)",
  },
  avg_preparation_time: {
    label: "Avg Prep Time (min)",
    color: "var(--chart-2)",
  },
};

export function OrderCharts({ data, timeSeriesData }: OrderChartsProps) {
  // Format status data for donut chart
  const statusData = Object.entries(data.orders_by_status).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Line chart data
  const lineData = timeSeriesData || [
    {
      date: 'Current Period',
      total_orders: data.total_orders,
      avg_preparation_time: data.avg_preparation_time_minutes,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Orders Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Order Trends</CardTitle>
          <CardDescription>
            Order volume and preparation time over {data.period}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <LineChart
              data={lineData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  if (value === 'Current Period') return value;
                  return new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total_orders"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-1)" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avg_preparation_time"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ fill: "var(--chart-2)" }}
              />
            </LineChart>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Total Orders</div>
              <div className="text-2xl font-bold">{data.total_orders}</div>
            </div>
            <div>
              <div className="font-medium">Avg Prep Time</div>
              <div className="text-2xl font-bold">{safeToFixed(data.avg_preparation_time_minutes, 1)} min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Status Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Distribution</CardTitle>
          <CardDescription>
            Breakdown by current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => 
                  percent > 0.05 ? `${name}: ${safeToFixed((percent || 0) * 100, 0)}%` : ''
                }
              >
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="font-medium">{payload[0].name}:</span>
                          <span className="font-bold">{payload[0].value} orders</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ChartContainer>
          <div className="mt-4 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <div className="text-sm">
              <span className="font-medium">Cancellation Rate: </span>
              <span className={data.cancellation_rate_percent > 5 ? "text-destructive" : "text-muted-foreground"}>
                {safeToFixed(data.cancellation_rate_percent, 2)}%
              </span>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Delivery</div>
              <div className="font-bold">{data.orders_by_delivery_method.delivery}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Pickup</div>
              <div className="font-bold">{data.orders_by_delivery_method.pickup}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
