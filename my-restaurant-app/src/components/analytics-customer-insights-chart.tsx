import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp } from "lucide-react";
import { safeToFixed, formatCurrency, formatCurrencyBGN } from "@/lib/utils";

interface TopCustomer {
  customer_id: string;
  name: string;
  spend_in_period: number;
  lifetime_orders: number;
  lifetime_spent: number;
}

interface CustomerInsightsData {
  new_customers: number;
  returning_customers: number;
  avg_order_value: number;
  top_customers: TopCustomer[];
  guest_vs_registered: {
    guest_orders: number;
    registered_orders: number;
    guest_percentage: number;
  };
  customer_lifetime_value_distribution: {
    [key: string]: number;
  };
}

interface CustomerInsightsChartProps {
  data: CustomerInsightsData;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];
const CLV_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  new_customers: {
    label: "New Customers",
    color: "hsl(var(--chart-1))",
  },
  returning_customers: {
    label: "Returning Customers",
    color: "hsl(var(--chart-2))",
  },
};

export function CustomerInsightsChart({ data }: CustomerInsightsChartProps) {
  // Customer type data
  const customerTypeData = [
    { name: 'New', value: data.new_customers, fill: 'hsl(var(--chart-1))' },
    { name: 'Returning', value: data.returning_customers, fill: 'hsl(var(--chart-2))' },
  ];

  // Guest vs Registered data
  const guestData = [
    { name: 'Guest Orders', value: data.guest_vs_registered.guest_orders },
    { name: 'Registered Orders', value: data.guest_vs_registered.registered_orders },
  ];

  // CLV Distribution data
  const clvData = Object.entries(data.customer_lifetime_value_distribution).map(([range, count]) => ({
    range: `${range} лв`,
    count,
  }));

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* New vs Returning Customers - Stacked Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Types</CardTitle>
          <CardDescription>
            New vs returning customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              data={customerTypeData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {customerTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-4 flex items-center gap-2">
            <Users className="h-4 w-4" />
            <div className="text-sm">
              <span className="font-medium">Total: </span>
              <span className="text-muted-foreground">
                {data.new_customers + data.returning_customers} customers
              </span>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {safeToFixed(((data.returning_customers / (data.new_customers + data.returning_customers)) * 100), 1)}% 
            are returning customers
          </div>
        </CardContent>
      </Card>

      {/* Guest vs Registered - Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Guest vs Registered</CardTitle>
          <CardDescription>
            Order distribution by user type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <PieChart>
              <Pie
                data={guestData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name.split(' ')[0]}: ${safeToFixed((percent || 0) * 100, 0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {guestData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            </PieChart>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Guest Orders</div>
              <div className="text-xl font-bold">{data.guest_vs_registered.guest_orders}</div>
              <div className="text-xs text-muted-foreground">
                {safeToFixed(data.guest_vs_registered.guest_percentage, 1)}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Registered</div>
              <div className="text-xl font-bold">{data.guest_vs_registered.registered_orders}</div>
              <div className="text-xs text-muted-foreground">
                {safeToFixed((100 - data.guest_vs_registered.guest_percentage), 1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Lifetime Value Distribution - Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Lifetime Value</CardTitle>
          <CardDescription>
            Distribution by spending range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Customers", color: "hsl(var(--chart-3))" } }}>
            <BarChart
              data={clvData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {clvData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CLV_COLORS[index % CLV_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <div className="text-sm">
              <span className="font-medium">Avg Order Value: </span>
              <span className="text-muted-foreground">{formatCurrency(data.avg_order_value)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers Leaderboard - Full Width */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>
            Highest spenders in this period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.top_customers.slice(0, 6).map((customer, index) => (
              <div
                key={customer.customer_id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-primary-foreground"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{customer.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.lifetime_orders} lifetime orders
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-xl font-bold">
                      {formatCurrency(customer.spend_in_period)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      this period
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Lifetime: {formatCurrency(customer.lifetime_spent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
