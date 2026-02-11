import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { safeToFixed, formatCurrency, formatCurrencyBGN } from "@/lib/utils";

interface RevenueBreakdownData {
  total_revenue: number;
  subtotal: number;
  delivery_fees: number;
  discounts_given: number;
  revenue_after_discounts: number;
  average_order_value: number;
  order_count: number;
  payment_method_distribution: {
    cash: number;
    card: number;
    cash_percentage: number;
    card_percentage: number;
  };
}

interface RevenueChartsProps {
  data: RevenueBreakdownData;
  timeSeriesData?: Array<{
    date: string;
    total_revenue: number;
    subtotal: number;
    delivery_fees: number;
  }>;
}

const chartConfig = {
  total_revenue: {
    label: "Total Revenue",
    color: "hsl(var(--chart-1))",
  },
  subtotal: {
    label: "Subtotal",
    color: "hsl(var(--chart-2))",
  },
  delivery_fees: {
    label: "Delivery Fees",
    color: "hsl(var(--chart-3))",
  },
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

export function RevenueCharts({ data, timeSeriesData }: RevenueChartsProps) {
  // Format payment method data for pie chart
  const paymentData = [
    { name: 'Cash', value: data.payment_method_distribution.cash },
    { name: 'Card', value: data.payment_method_distribution.card },
  ];

  // If no time series data provided, create a simple breakdown
  const areaData = timeSeriesData || [
    {
      date: 'Current Period',
      total_revenue: data.total_revenue,
      subtotal: data.subtotal,
      delivery_fees: data.delivery_fees,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Stacked Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
          <CardDescription>
            Subtotal + Delivery Fees = Total Revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <AreaChart
              data={areaData}
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
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `${value} лв`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="subtotal"
                stackId="1"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="delivery_fees"
                stackId="1"
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
          <div className="mt-4 flex items-center gap-2 font-medium leading-none">
            <TrendingUp className="h-4 w-4" />
            Total: {formatCurrency(data.total_revenue)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            After discounts: {formatCurrency(data.revenue_after_discounts)}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Distribution by payment type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${safeToFixed((percent || 0) * 100, 0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {paymentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value;
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <span className="font-medium">{payload[0].name}:</span>
                          <span className="font-bold">{formatCurrencyBGN(numValue)}</span>
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
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Cash</div>
              <div className="text-2xl font-bold">{formatCurrency(data.payment_method_distribution.cash)}</div>
              <div className="text-muted-foreground">{safeToFixed(data.payment_method_distribution.cash_percentage, 1)}%</div>
            </div>
            <div>
              <div className="font-medium">Card</div>
              <div className="text-2xl font-bold">{formatCurrency(data.payment_method_distribution.card)}</div>
              <div className="text-muted-foreground">{safeToFixed(data.payment_method_distribution.card_percentage, 1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
