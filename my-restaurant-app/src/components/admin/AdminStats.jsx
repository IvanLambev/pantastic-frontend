import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AdminStats({ data, loading }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-10">
                <div className="animate-pulse space-y-4 w-full">
                    <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Transform data into the format expected by the UI
    // We expect data to contain: total_revenue, order_count, average_order_value, and comparison info

    // Calculate active restaurants count
    const activeRestaurantsCount = data.total_restaurants || data.restaurants_count ||
        (data.restaurants ? data.restaurants.length : 1);

    const stats = [
        {
            name: "Total Revenue",
            value: `€${data.total_revenue?.toFixed(2) || '0.00'}`,
            change: data.comparison?.revenue_change_percent
                ? `${data.comparison.revenue_change_percent > 0 ? '+' : ''}${data.comparison.revenue_change_percent.toFixed(2)}%`
                : "N/A",
            changeType: data.comparison?.revenue_change_percent >= 0 ? "positive" : "negative",
        },
        {
            name: "Total Orders",
            value: data.order_count?.toString() || '0',
            change: data.comparison?.previous_order_count !== undefined
                ? `${data.order_count - data.comparison.previous_order_count > 0 ? '+' : ''}${data.order_count - data.comparison.previous_order_count}`
                : "N/A",
            changeType: (data.order_count - (data.comparison?.previous_order_count || 0)) >= 0 ? "positive" : "negative",
        },
        {
            name: "Avg Order Value",
            value: `€${data.average_order_value?.toFixed(2) || '0.00'}`,
            change: "N/A", // We don't have comparison for this in the API response
            changeType: "neutral",
        },
        {
            name: "Active Restaurants",
            value: activeRestaurantsCount.toString(),
            change: "0",
            changeType: "neutral",
        },
    ];

    return (
        <div className="flex items-center justify-center p-4 md:p-10">
            <div className="mx-auto grid grid-cols-1 gap-px rounded-xl bg-border sm:grid-cols-2 lg:grid-cols-4 w-full">
                {stats.map((stat, index) => (
                    <Card
                        key={stat.name}
                        className={cn(
                            "rounded-none border-0 shadow-none py-0",
                            index === 0 && "rounded-t-xl sm:rounded-tr-none sm:rounded-l-xl",
                            index === 1 && "sm:rounded-tr-xl lg:rounded-tr-none",
                            index === stats.length - 2 && "lg:rounded-bl-none",
                            index === stats.length - 1 && "rounded-b-xl sm:rounded-bl-none sm:rounded-r-xl"
                        )}
                    >
                        <CardContent className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-4 sm:p-6">
                            <div className="text-sm font-medium text-muted-foreground">
                                {stat.name}
                            </div>
                            <div
                                className={cn(
                                    "text-xs font-medium",
                                    stat.changeType === "positive"
                                        ? "text-green-600 dark:text-green-400"
                                        : stat.changeType === "negative"
                                            ? "text-red-600 dark:text-red-400"
                                            : "text-gray-500"
                                )}
                            >
                                {stat.change}
                            </div>
                            <div className="w-full flex-none text-3xl font-medium tracking-tight text-foreground">
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
