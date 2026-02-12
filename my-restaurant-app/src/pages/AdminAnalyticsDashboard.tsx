import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyticsService } from "@/services/analyticsService";
import { safeToFixed, formatCurrency } from "@/lib/utils";
import { AnalyticsKPICards } from "@/components/analytics-kpi-cards";
import { RevenueCharts } from "@/components/analytics-revenue-charts";
import { OrderCharts } from "@/components/analytics-order-charts";
import { TopItemsChart } from "@/components/analytics-top-items-chart";
import { CustomerInsightsChart } from "@/components/analytics-customer-insights-chart";
import { Loader2, RefreshCw, Activity, AlertCircle, CheckCircle2 } from "lucide-react";


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

  // Sunmi device status state
  const [sunmiData, setSunmiData] = useState<any>(null);
  const [sunmiLoading, setSunmiLoading] = useState(false);
  const [sunmiError, setSunmiError] = useState<string | null>(null);
  const [sunmiPollingInterval, setSunmiPollingInterval] = useState<string>("manual");

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

  // Fetch Sunmi device heartbeats
  const fetchSunmiData = async () => {
    try {
      setSunmiLoading(true);
      setSunmiError(null);
      const data = await analyticsService.getSunmiHeartbeats();
      setSunmiData(data);
    } catch (err) {
      setSunmiError(err instanceof Error ? err.message : "Failed to fetch Sunmi data");
      console.error("Sunmi fetch error:", err);
    } finally {
      setSunmiLoading(false);
    }
  };

  // Initial Sunmi data fetch
  useEffect(() => {
    fetchSunmiData();
  }, []);

  // Sunmi polling effect
  useEffect(() => {
    if (sunmiPollingInterval === "manual") {
      return;
    }

    const intervalMs = {
      "5s": 5000,
      "10s": 10000,
      "30s": 30000,
      "1min": 60000,
      "5min": 300000,
    }[sunmiPollingInterval];

    if (!intervalMs) return;

    const interval = setInterval(() => {
      fetchSunmiData();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [sunmiPollingInterval]);

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
              <div className="text-2xl font-bold">{formatCurrency(data.deliveryStats.avg_delivery_fee)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {safeToFixed(data.deliveryStats.delivery_success_rate_percent, 1)}%
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">On-Time Rate</div>
              <div className="text-2xl font-bold text-blue-600">
                {safeToFixed(data.deliveryStats.on_time_delivery_rate_percent, 1)}%
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
              <span className="font-bold">{formatCurrency(data.deliveryStats.total_delivery_revenue)}</span>
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
                  {safeToFixed(data.realTime.system_health_score, 1)}%
                </div>
              </div>
              {data.realTime.cache_statistics && (
                <>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Cache Hit Rate</div>
                    <div className="text-3xl font-bold">
                      {safeToFixed(data.realTime.cache_statistics.hit_rate, 1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Orders Per Hour</div>
                    <div className="text-3xl font-bold">
                      {safeToFixed(data.realTime.orders_per_hour, 1)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sunmi Device Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Sunmi Device Status
              </CardTitle>
              <CardDescription>
                Real-time monitoring of restaurant POS devices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sunmiPollingInterval} onValueChange={setSunmiPollingInterval}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Refresh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="5s">Every 5s</SelectItem>
                  <SelectItem value="10s">Every 10s</SelectItem>
                  <SelectItem value="30s">Every 30s</SelectItem>
                  <SelectItem value="1min">Every 1min</SelectItem>
                  <SelectItem value="5min">Every 5min</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSunmiData}
                disabled={sunmiLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${sunmiLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sunmiLoading && !sunmiData ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : sunmiError ? (
            <div className="flex h-32 items-center justify-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              {sunmiError}
            </div>
          ) : sunmiData ? (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Total Devices</div>
                  <div className="text-2xl font-bold">{sunmiData.summary?.total_devices || 0}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Active Devices</div>
                  <div className="text-2xl font-bold text-green-600">
                    {sunmiData.summary?.active_devices || 0}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Inactive Devices</div>
                  <div className="text-2xl font-bold text-destructive">
                    {sunmiData.summary?.inactive_devices || 0}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium text-muted-foreground">Timeout Threshold</div>
                  <div className="text-2xl font-bold">
                    {sunmiData.summary?.timeout_threshold_minutes || 0}m
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-muted-foreground">
                Last updated: {sunmiData.timestamp ? new Date(sunmiData.timestamp).toLocaleString() : 'N/A'}
              </div>

              {/* Device List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Device Details</h4>
                {sunmiData.all_devices && sunmiData.all_devices.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sunmiData.all_devices.map((device: any, idx: number) => (
                      <div
                        key={device.restaurant_id || idx}
                        className={`rounded-lg border p-4 ${
                          device.is_active
                            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                            : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {device.is_active ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span className="font-semibold">{device.restaurant_name}</span>
                            </div>
                            <div className="space-y-0.5 text-xs text-muted-foreground">
                              <div>Last heartbeat: {device.last_heartbeat_formatted}</div>
                              <div>{device.seconds_since_last_heartbeat}s ago</div>
                              <div>Orders: {device.order_count}</div>
                              <div>Requests: {device.total_requests}</div>
                              <div className="font-mono">{device.client_ip}</div>
                            </div>
                          </div>
                          <div
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              device.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100"
                                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                            }`}
                          >
                            {device.is_active ? "Active" : "Inactive"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    No devices found
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
