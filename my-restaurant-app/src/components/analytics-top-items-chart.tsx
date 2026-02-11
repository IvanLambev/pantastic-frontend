import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { Crown } from "lucide-react";
import { safeToFixed, formatCurrency, formatCurrencyBGN } from "@/lib/utils";

interface TopItem {
  item_id: string;
  name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
}

interface TopAddon {
  addon: string;
  times_ordered: number;
}

interface TopItemsData {
  items: TopItem[];
  total_items_analyzed: number;
  top_addons: TopAddon[];
}

interface TopItemsChartProps {
  data: TopItemsData;
}

const ITEM_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  quantity_sold: {
    label: "Quantity Sold",
    color: "hsl(var(--chart-1))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-2))",
  },
};

export function TopItemsChart({ data }: TopItemsChartProps) {
  // Format data for horizontal bar chart
  const topItems = data.items.slice(0, 10);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Top Items by Quantity - Horizontal Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Best Selling Items</CardTitle>
          <CardDescription>
            Top {topItems.length} items by quantity sold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig}>
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={90}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as TopItem;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-sm">
                        <div className="font-semibold mb-2">{item.name}</div>
                        <div className="grid gap-1 text-sm">
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium">{item.category}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Quantity:</span>
                            <span className="font-bold">{item.quantity_sold}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Revenue:</span>
                            <span className="font-bold">{formatCurrencyBGN(item.revenue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="quantity_sold" radius={[0, 4, 4, 0]}>
                {topItems.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={ITEM_COLORS[index % ITEM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="h-4 w-4" />
            Analyzed {data.total_items_analyzed} total items
          </div>
        </CardContent>
      </Card>

      {/* Top Addons and Revenue Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Revenue Items</CardTitle>
          <CardDescription>
            Highest earning items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topItems.slice(0, 5).map((item, index) => (
              <div key={item.item_id} className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                  style={{ backgroundColor: ITEM_COLORS[index % ITEM_COLORS.length] }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrencyBGN(item.revenue, 0)}</div>
                  <div className="text-xs text-muted-foreground">{item.quantity_sold} sold</div>
                </div>
              </div>
            ))}
          </div>

          {data.top_addons && data.top_addons.length > 0 && (
            <>
              <div className="mt-6 mb-3 text-sm font-semibold">Popular Add-ons</div>
              <div className="space-y-2">
                {data.top_addons.slice(0, 5).map((addon, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{addon.addon}</span>
                    <span className="text-sm font-medium">{addon.times_ordered}×</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
