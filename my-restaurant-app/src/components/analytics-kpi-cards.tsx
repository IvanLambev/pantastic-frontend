import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Clock, TrendingUp } from "lucide-react";

interface KPICardsProps {
  revenueToday: number;
  ordersToday: number;
  activeOrders: number;
  averageOrderValue: number;
}

export function AnalyticsKPICards({
  revenueToday,
  ordersToday,
  activeOrders,
  averageOrderValue,
}: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${revenueToday.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total revenue for today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{ordersToday}</div>
          <p className="text-xs text-muted-foreground">
            Total orders received today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeOrders}</div>
          <p className="text-xs text-muted-foreground">
            Currently being processed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average per order
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
