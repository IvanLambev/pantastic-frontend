import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { analyticsService } from "@/services/analyticsService";
import { AnalyticsKPICards } from "@/components/analytics-kpi-cards";
import { RevenueCharts } from "@/components/analytics-revenue-charts";
import { OrderCharts } from "@/components/analytics-order-charts";
import { TopItemsChart } from "@/components/analytics-top-items-chart";
import { CustomerInsightsChart } from "@/components/analytics-customer-insights-chart";
import { Loader2, RefreshCw } from "lucide-react";


type TimeRange = "today" | "week" | "month" | "year";

interface AnalyticsDashboardData {
  realTime: any;
  revenueBreakdown: any;
  orderMetrics: any;
  topItems: any;
  customerInsights: any;
  deliveryStats: any;
}

export default function AdminAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);

  // Calculate date range based on selection
  const getDateRange = (range: TimeRange) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "year":
        startDate.setDate(startDate.getDate() - 365);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async (range: TimeRange) => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(range);
      
      // Determine period for order metrics
      const period = range === "today" ? "week" : range === "week" ? "week" : range === "month" ? "month" : "year";

      // Fetch all data in parallel
      const [realTime, revenueBreakdown, orderMetrics, topItems, customerInsights, deliveryStats] = await Promise.all([
        analyticsService.getRealTimeAnalytics(),
        analyticsService.getRevenueBreakdown(startDate, endDate),
        analyticsService.getOrderMetrics(period),
        analyticsService.getTopItems(10, startDate, endDate),
        analyticsService.getCustomerInsights(startDate, endDate),
        analyticsService.getDeliveryStats(startDate, endDate),
      ]);

      setData({
        realTime,
        revenueBreakdown,
        orderMetrics,
        topItems,
        customerInsights,
        deliveryStats,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnalyticsData(timeRange);
  }, [timeRange]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalyticsData(timeRange);
  };

  // Auto-refresh real-time data every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        analyticsService.getRealTimeAnalytics()
          .then((realTime: any) => {
            setData(prev => prev ? { ...prev, realTime } : null);
          })
          .catch(console.error);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  if (loading && !data) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate AOV from revenue breakdown
  const avgOrderValue = data.revenueBreakdown?.average_order_value || 0;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-2">
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-sm text-muted-foreground">
          Last updated: {new Date(data.realTime.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {/* KPI Cards */}
      <AnalyticsKPICards
        revenueToday={data.realTime.revenue_today}
        ordersToday={data.realTime.orders_today}
        activeOrders={data.realTime.active_orders}
        averageOrderValue={avgOrderValue}
      />

      {/* Revenue Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Revenue Analysis</h3>
        <RevenueCharts data={data.revenueBreakdown} />
      </div>

      {/* Orders Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Order Metrics</h3>
        <OrderCharts data={data.orderMetrics} />
      </div>

      {/* Top Items Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Best Selling Items</h3>
        <TopItemsChart data={data.topItems} />
      </div>

      {/* Customer Insights Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Customer Insights</h3>
        <CustomerInsightsChart data={data.customerInsights} />
      </div>

      {/* Delivery Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Performance</CardTitle>
          <CardDescription>
            Key delivery metrics for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Deliveries</div>
              <div className="text-2xl font-bold">{data.deliveryStats.total_delivery_orders}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Avg Delivery Fee</div>
              <div className="text-2xl font-bold">${data.deliveryStats.avg_delivery_fee.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {data.deliveryStats.delivery_success_rate_percent.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">On-Time Rate</div>
              <div className="text-2xl font-bold text-blue-600">
                {data.deliveryStats.on_time_delivery_rate_percent.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Successful Deliveries:</span>
              <span className="font-medium">{data.deliveryStats.successful_deliveries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Failed Deliveries:</span>
              <span className="font-medium text-destructive">{data.deliveryStats.failed_deliveries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delayed Deliveries:</span>
              <span className="font-medium text-orange-600">{data.deliveryStats.delayed_deliveries}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total Delivery Revenue:</span>
              <span className="font-bold">${data.deliveryStats.total_delivery_revenue.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      {data.realTime.system_health_score && (
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time system performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">System Health Score</div>
                <div className="text-3xl font-bold text-green-600">
                  {data.realTime.system_health_score.toFixed(1)}%
                </div>
              </div>
              {data.realTime.cache_statistics && (
                <>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Cache Hit Rate</div>
                    <div className="text-3xl font-bold">
                      {data.realTime.cache_statistics.hit_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Orders Per Hour</div>
                    <div className="text-3xl font-bold">
                      {data.realTime.orders_per_hour.toFixed(1)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
