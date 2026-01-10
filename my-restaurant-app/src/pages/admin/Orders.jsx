import { useState, useEffect } from 'react';
import {
    fetchAllOrders,
    fetchOrdersByRestaurant,
    fetchRestaurants,
    fetchUserDetails,
    fetchOrderById
} from '@/services/adminApi';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Loader2, User, MapPin, CreditCard, ShoppingBag, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("all");
    const [loading, setLoading] = useState(true);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [currentPageToken, setCurrentPageToken] = useState(null);
    const [pageHistory, setPageHistory] = useState([]);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    // Details Sheet State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [customerDetails, setCustomerDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Initial Load
    useEffect(() => {
        loadRestaurants();
        loadOrders();
    }, []);

    // Reload when restaurant filter changes
    useEffect(() => {
        setPageHistory([]);
        setNextPageToken(null);
        setCurrentPageToken(null);
        loadOrders(null, selectedRestaurant);
    }, [selectedRestaurant]);

    const loadRestaurants = async () => {
        try {
            const data = await fetchRestaurants();
            setRestaurants(data);
        } catch (error) {
            console.error("Failed to load restaurants", error);
            toast.error("Failed to load restaurants");
        }
    };

    const loadOrders = async (pagingState = null, restaurantId = selectedRestaurant) => {
        setLoading(true);
        try {
            let data;
            if (restaurantId === "all") {
                data = await fetchAllOrders(10, pagingState);
            } else {
                data = await fetchOrdersByRestaurant(restaurantId, 10, pagingState);
            }

            setOrders(data.orders || []);
            setNextPageToken(data.next_page_token);
        } catch (error) {
            console.error("Failed to load orders", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (nextPageToken) {
            setPageHistory(prev => [...prev, currentPageToken]);
            setCurrentPageToken(nextPageToken);
            loadOrders(nextPageToken);
        }
    };

    const handlePreviousPage = () => {
        if (pageHistory.length > 0) {
            const prevToken = pageHistory[pageHistory.length - 1];
            setPageHistory(prev => prev.slice(0, -1));
            setCurrentPageToken(prevToken);
            loadOrders(prevToken);
        }
    };

    const handleSort = (column) => {
        const newOrder = sortBy === column && sortOrder === 'desc' ? 'asc' : 'desc';
        setSortBy(column);
        setSortOrder(newOrder);
    };

    const getSortedOrders = () => {
        const sorted = [...orders];
        sorted.sort((a, b) => {
            if (sortBy === 'created_at') {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            } else if (sortBy === 'status') {
                const statusA = (a.status || '').toLowerCase();
                const statusB = (b.status || '').toLowerCase();
                if (statusA < statusB) return sortOrder === 'asc' ? -1 : 1;
                if (statusA > statusB) return sortOrder === 'asc' ? 1 : -1;
                return 0;
            }
            return 0;
        });
        return sorted;
    };

    const sortedOrders = getSortedOrders();

    const handleOrderClick = async (order) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
        setCustomerDetails(null);
        setLoadingDetails(true);

        try {
            const fullOrder = await fetchOrderById(order.order_id);
            setSelectedOrder(fullOrder);

            if (fullOrder.customer) {
                setCustomerDetails(fullOrder.customer);
            } else if (fullOrder.customer_id) {
                const user = await fetchUserDetails(fullOrder.customer_id);
                setCustomerDetails(user);
            }
        } catch (error) {
            console.error("Failed to load order details", error);
            toast.error("Failed to load order details");
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'bg-green-500 hover:bg-green-600 text-white border-transparent';
            case 'ready': return 'bg-yellow-500 hover:bg-yellow-600 text-white border-transparent';
            case 'pending': return 'bg-amber-500 hover:bg-amber-600 text-white border-transparent';
            case 'canceled':
            case 'cancelled': return 'bg-red-500 hover:bg-red-600 text-white border-transparent';
            case 'processing':
            case 'in progress':
            case 'preparing': return 'bg-blue-500 hover:bg-blue-600 text-white border-transparent';
            case 'out for delivery': return 'bg-purple-500 hover:bg-purple-600 text-white border-transparent';
            default: return 'bg-gray-500 hover:bg-gray-600 text-white border-transparent';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
                <div className="flex items-center gap-2">
                    <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Filter by Restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Restaurants</SelectItem>
                            {restaurants.map((r) => (
                                <SelectItem key={r.restaurant_id} value={r.restaurant_id}>
                                    {r.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => loadOrders(null, selectedRestaurant)}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('created_at')}
                                >
                                    <div className="flex items-center gap-1">
                                        Date
                                        <ArrowUpDown className="h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead>Restaurant</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center gap-1">
                                        Status
                                        <ArrowUpDown className="h-4 w-4" />
                                    </div>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedOrders.map((order) => (
                                    <TableRow key={order.order_id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOrderClick(order)}>
                                        <TableCell className="font-medium">
                                            {order.order_id.slice(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            {order.created_at ? format(new Date(order.created_at), 'MMM d, yyyy HH:mm') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {order.restaurant_name || order.restaurant?.name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {order.total_price?.toFixed(2)} BGN
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(order.status)}>
                                                {order.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <Button
                    variant="outline"
                    onClick={handlePreviousPage}
                    disabled={pageHistory.length === 0 || loading}
                >
                    Previous Page
                </Button>
                <Button
                    variant="outline"
                    onClick={handleNextPage}
                    disabled={!nextPageToken || loading}
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Next Page
                </Button>
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="overflow-y-auto overflow-x-hidden w-full sm:max-w-2xl">
                    <SheetHeader>
                        <SheetTitle>Order Details</SheetTitle>
                        <SheetDescription>
                            <span className="block">ID: {selectedOrder?.order_id}</span>
                            {(selectedOrder?.restaurant || selectedOrder?.restaurant_name) && (
                                <div className="mt-2 space-y-1">
                                    <span className="block font-medium text-foreground">
                                        Restaurant: {selectedOrder?.restaurant?.name || selectedOrder?.restaurant_name}
                                    </span>
                                    {selectedOrder?.restaurant?.address && (
                                        <span className="block text-xs text-muted-foreground">
                                            {selectedOrder.restaurant.address}
                                        </span>
                                    )}
                                </div>
                            )}
                        </SheetDescription>
                    </SheetHeader>

                    {loadingDetails ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : selectedOrder && (
                        <div className="space-y-6 mt-6">
                            {/* Status Section */}
                            <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <Badge className={`mt-1 ${getStatusColor(selectedOrder.status)}`}>
                                            {selectedOrder.status}
                                        </Badge>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                                        <p className="text-xl font-bold">{selectedOrder.total_price?.toFixed(2)} BGN</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-muted-foreground/20">
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
                                        <p className="text-sm font-medium capitalize">{selectedOrder.payment_method || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-muted-foreground">Paid</p>
                                        <p className="text-sm font-medium">{selectedOrder.paid ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Delivery Fee</p>
                                        <p className="text-sm font-medium">{selectedOrder.delivery_fee?.toFixed(2)} BGN</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-muted-foreground">Discount</p>
                                        <p className="text-sm font-medium">
                                            {selectedOrder.discount_amount?.toFixed(2)} BGN
                                            {selectedOrder.discount_percentage > 0 && (
                                                <span className="text-xs text-muted-foreground ml-1">
                                                    ({selectedOrder.discount_percentage}%)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" /> Customer
                                </h3>
                                <Card>
                                    <CardContent className="p-4 space-y-2">
                                        {customerDetails ? (
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <span className="text-muted-foreground">Name:</span>
                                                <span className="font-medium">
                                                    {customerDetails.name || `${customerDetails.first_name || ''} ${customerDetails.last_name || ''}`.trim() || 'N/A'}
                                                </span>

                                                <span className="text-muted-foreground">Phone:</span>
                                                <span className="font-medium">{customerDetails.phone || 'N/A'}</span>

                                                <span className="text-muted-foreground">Email:</span>
                                                <span className="font-medium">{customerDetails.email || 'N/A'}</span>

                                                {customerDetails.city && (
                                                    <>
                                                        <span className="text-muted-foreground">City:</span>
                                                        <span className="font-medium">{customerDetails.city}</span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No customer details available</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Delivery Details */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" /> Delivery Info
                                </h3>
                                <Card>
                                    <CardContent className="p-4 space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                            <span className="text-muted-foreground">Method:</span>
                                            <span className="capitalize font-medium">{selectedOrder.delivery_method}</span>

                                            {selectedOrder.delivery_address && (
                                                <>
                                                    <span className="text-muted-foreground">Address:</span>
                                                    <span className="font-medium">{selectedOrder.delivery_address}</span>
                                                </>
                                            )}

                                            {selectedOrder.delivery_person && (
                                                <>
                                                    <span className="text-muted-foreground">Driver:</span>
                                                    <span className="font-medium">{selectedOrder.delivery_person}</span>
                                                </>
                                            )}

                                            <span className="text-muted-foreground">Created At:</span>
                                            <span>{selectedOrder.created_at ? format(new Date(selectedOrder.created_at), 'PPpp') : 'N/A'}</span>

                                            {selectedOrder.preparation_started_at && (
                                                <>
                                                    <span className="text-muted-foreground">Prep Started:</span>
                                                    <span>{format(new Date(selectedOrder.preparation_started_at), 'PPpp')}</span>
                                                </>
                                            )}

                                            {selectedOrder.estimated_delivery_time && (
                                                <>
                                                    <span className="text-muted-foreground">Est. Delivery:</span>
                                                    <span>{format(new Date(selectedOrder.estimated_delivery_time), 'PPpp')}</span>
                                                </>
                                            )}

                                            {selectedOrder.scheduled_delivery_time && (
                                                <>
                                                    <span className="text-muted-foreground">Scheduled:</span>
                                                    <span>{format(new Date(selectedOrder.scheduled_delivery_time), 'PPpp')}</span>
                                                </>
                                            )}

                                            {selectedOrder.delivery_time && (
                                                <>
                                                    <span className="text-muted-foreground">Delivered At:</span>
                                                    <span>{format(new Date(selectedOrder.delivery_time), 'PPpp')}</span>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Items */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                                    <ShoppingBag className="h-4 w-4" /> Items
                                </h3>
                                <div className="space-y-2">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, idx) => (
                                            <Card key={idx}>
                                                <CardContent className="p-3 flex justify-between items-start">
                                                    <div className="flex-1 mr-4">
                                                        <p className="font-medium">{item.name || item.item_name || `Item #${idx + 1}`}</p>
                                                        {item.description && (
                                                            <p className="text-xs text-muted-foreground italic mb-1">{item.description}</p>
                                                        )}
                                                        <p className="text-sm text-muted-foreground">
                                                            Qty: {item.quantity || item.item_quantity || 1}
                                                        </p>

                                                        {/* Addons */}
                                                        {((item.selected_addons && Object.keys(item.selected_addons).length > 0) || (item.applied_addons && item.applied_addons.length > 0)) && (
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                <p className="font-semibold">Addons:</p>
                                                                <ul className="list-disc list-inside">
                                                                    {item.selected_addons && Object.entries(item.selected_addons).map(([key, value], aIdx) => (
                                                                        <li key={`sel-${aIdx}`}>{key}: {value}</li>
                                                                    ))}
                                                                    {item.applied_addons?.map((addon, aIdx) => (
                                                                        <li key={`app-${aIdx}`}>{addon.addon_name} (x{addon.addon_quantity})</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {/* Removed Ingredients */}
                                                        {item.removed_ingredients?.length > 0 && (
                                                            <div className="mt-1 text-xs text-red-500">
                                                                <p className="font-semibold">Removed:</p>
                                                                <ul className="list-disc list-inside">
                                                                    {item.removed_ingredients.map((ing, iIdx) => (
                                                                        <li key={iIdx}>{ing}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="font-medium whitespace-nowrap">
                                                        {(item.final_price || item.item_total || 0).toFixed(2)} BGN
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">No items details available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet >
        </div >
    );
}
