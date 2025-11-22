"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(var(--chart-1))",
    },
}

export default function RevenueChart({ data, loading, timePeriod = "week" }) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="animate-pulse space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
                </CardContent>
            </Card>
        );
    }

    if (!data || !data.restaurants || data.restaurants.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Chart</CardTitle>
                    <CardDescription>No data available</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No revenue data to display
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Transform the data for the chart
    // Aggregate data from all restaurants in the response
    const totalRevenue = data.restaurants.reduce((sum, r) => sum + r.total_revenue, 0);

    const chartData = [
        {
            period: "Previous",
            revenue: data.comparison?.previous_revenue || 0,
        },
        {
            period: "Current",
            revenue: totalRevenue,
        },
    ];

    const revenueChange = data.comparison?.revenue_change_percent || 0;
    const isPositive = revenueChange >= 0;

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>
                    {data.time_period?.from && data.time_period?.to
                        ? `${formatDate(data.time_period.from)} - ${formatDate(data.time_period.to)}`
                        : `Showing revenue for the last ${timePeriod}`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <AreaChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            left: 12,
                            right: 12,
                            top: 12,
                            bottom: 12,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="period"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => `€${value}`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                            dataKey="revenue"
                            type="natural"
                            fill="var(--color-revenue)"
                            fillOpacity={0.4}
                            stroke="var(--color-revenue)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            {isPositive ? "Trending up" : "Trending down"} by {Math.abs(revenueChange).toFixed(1)}% this {timePeriod}
                            {isPositive ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                            {data.comparison?.previous_period?.from && data.comparison?.previous_period?.to
                                ? `Compared to ${formatDate(data.comparison.previous_period.from)} - ${formatDate(data.comparison.previous_period.to)}`
                                : "Compared to previous period"}
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
