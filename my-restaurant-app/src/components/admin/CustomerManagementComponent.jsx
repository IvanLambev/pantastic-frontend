import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import { Loader2, Search, User, Mail, Phone, MapPin, DollarSign, Calendar, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatDualCurrencyCompact } from "@/utils/currency";
import { fetchOrdersByCustomer } from '@/services/adminApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CustomerManagementComponent() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalAllCustomers, setTotalAllCustomers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [prevPageToken, setPrevPageToken] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  
  // Customer orders modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  
  // Detailed order modal state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);

  // Fetch customers from the API
  const fetchCustomers = useCallback(async (nameFilter = '', pageToken = null) => {
    setLoading(true);
    try {
      let url = `${API_URL}/user/admin/users`;
      const params = new URLSearchParams();

      params.append('page_size', String(pageSize));
      
      if (nameFilter) {
        params.append('name_filter', nameFilter);
      }
      
      if (pageToken) {
        params.append('page_token', pageToken);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetchWithAdminAuth(url, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      
      setCustomers(data.customers || []);
      setCurrentPage(data.current_page || 1);
      setTotalCustomers(data.total_customers || 0);
      setTotalAllCustomers(data.total_all_customers || 0);
      setHasMore(data.has_more || false);
      setPrevPageToken(data.prev_page_token ?? null);
      setNextPageToken(data.next_page_token);

    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Initial load
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle search
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPrevPageToken(null);
    setNextPageToken(null);
    fetchCustomers(searchInput);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setPrevPageToken(null);
    setNextPageToken(null);
    fetchCustomers();
  };

  // Handle pagination - next page
  const handleNextPage = () => {
    if (hasMore && nextPageToken) {
      fetchCustomers(searchTerm, nextPageToken);
    }
  };

  // Handle pagination - previous page
  const handlePreviousPage = () => {
    const fallbackPrevPageToken = currentPage > 1 ? String(currentPage - 1) : null;
    const resolvedPrevPageToken = prevPageToken ?? fallbackPrevPageToken;

    if (resolvedPrevPageToken) {
      fetchCustomers(searchTerm, resolvedPrevPageToken);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Handle viewing customer orders
  const handleViewOrders = async (customer) => {
    setSelectedCustomer(customer);
    setOrdersDialogOpen(true);
    setOrdersLoading(true);
    
    try {
      const data = await fetchOrdersByCustomer(customer.customer_id);
      setCustomerOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast.error('Failed to load customer orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Handle viewing detailed order information
  const handleViewOrderDetails = async (orderId) => {
    setOrderDetailsDialogOpen(true);
    setOrderDetailsLoading(true);
    setSelectedOrderDetails(null);
    
    try {
      const response = await fetchWithAdminAuth(`${API_URL}/order/admin/orders/${orderId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      setSelectedOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      setOrderDetailsDialogOpen(false);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  // Format order status
  const getOrderStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'default';
      case 'pending':
      case 'preparing':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">
            {searchTerm ? (
              <>Showing {totalCustomers} of {totalAllCustomers} customers matching "{searchTerm}"</>
            ) : (
              <>Total customers: {totalAllCustomers}</>
            )}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2">Search</span>
            </Button>
            {searchTerm && (
              <Button onClick={handleClearSearch} variant="outline">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Customers {searchTerm && `(Filtered by "${searchTerm}")`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && customers.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading customers...</span>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No customers found matching your search' : 'No customers found'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-center">Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.customer_id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.full_name}</span>
                            <span className="text-sm text-muted-foreground">
                              ID: {customer.customer_id.slice(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {customer.city || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {customer.total_orders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.total_spent > 0 ? (
                            <span className="text-green-600">
                              {formatDualCurrencyCompact(customer.total_spent)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {formatDualCurrencyCompact(0)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-center">
                            {customer.is_admin && (
                              <Badge variant="destructive" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {customer.is_worker && (
                              <Badge variant="secondary" className="text-xs">
                                Worker
                              </Badge>
                            )}
                            {!customer.is_admin && !customer.is_worker && (
                              <Badge variant="outline" className="text-xs">
                                Customer
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(customer.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewOrders(customer)}
                              className="h-8"
                            >
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              View Orders
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} • Showing {customers.length} of {totalCustomers} customers
                  {searchTerm && ` (${totalAllCustomers} total)`}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1 || loading}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Customer Orders Dialog */}
      <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Orders for {selectedCustomer?.full_name}
            </DialogTitle>
            <DialogDescription>
              Customer ID: {selectedCustomer?.customer_id}
            </DialogDescription>
          </DialogHeader>
          
          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading orders...</span>
            </div>
          ) : customerOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found for this customer</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Total orders: {customerOrders.length}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerOrders.map((order) => (
                      <TableRow 
                        key={order.order_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleViewOrderDetails(order.order_id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {order.order_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {order.restaurant_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDualCurrencyCompact(order.total_price || 0)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getOrderStatusVariant(order.status)}>
                            {order.status || 'Unknown'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed Order Information Dialog */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order Details - #{selectedOrderDetails?.order_id?.slice(0, 8)}
            </DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>
          
          {orderDetailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading order details...</span>
            </div>
          ) : selectedOrderDetails ? (
            <div className="space-y-6">
              {/* Restaurant Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Restaurant Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm font-semibold">{selectedOrderDetails.restaurant?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">{selectedOrderDetails.restaurant?.address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Restaurant ID</p>
                    <p className="text-xs font-mono">{selectedOrderDetails.restaurant?.restaurant_id}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm font-semibold">{selectedOrderDetails.customer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">{selectedOrderDetails.customer?.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">{selectedOrderDetails.customer?.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                    <p className="text-xs font-mono">{selectedOrderDetails.customer?.customer_id}</p>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                    <p className="text-xs font-mono break-all">{selectedOrderDetails.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={getOrderStatusVariant(selectedOrderDetails.status)}>
                      {selectedOrderDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm">{formatDate(selectedOrderDetails.created_at)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Method</p>
                    <Badge variant="outline" className="capitalize">
                      {selectedOrderDetails.delivery_method}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                    <Badge variant="outline" className="capitalize">
                      {selectedOrderDetails.payment_method}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                    <Badge variant={selectedOrderDetails.paid ? 'default' : 'secondary'}>
                      {selectedOrderDetails.paid ? 'Paid' : 'Not Paid'}
                    </Badge>
                  </div>
                  {selectedOrderDetails.delivery_address && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
                      <p className="text-sm">{selectedOrderDetails.delivery_address}</p>
                    </div>
                  )}
                  {selectedOrderDetails.scheduled_delivery_time && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Scheduled Delivery</p>
                      <p className="text-sm">{formatDate(selectedOrderDetails.scheduled_delivery_time)}</p>
                    </div>
                  )}
                  {selectedOrderDetails.estimated_delivery_time && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estimated Delivery</p>
                      <p className="text-sm">{formatDate(selectedOrderDetails.estimated_delivery_time)}</p>
                    </div>
                  )}
                  {selectedOrderDetails.delivery_person && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Delivery Person</p>
                      <p className="text-sm">{selectedOrderDetails.delivery_person}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrderDetails.items.map((item, index) => (
                      <div key={item.item_id || index} className="border-l-4 border-primary pl-4 py-3 bg-muted/20 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-base">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-sm">
                              <span className="text-muted-foreground">
                                Quantity: <span className="font-medium text-foreground">{item.quantity}</span>
                              </span>
                              <span className="text-muted-foreground">
                                Base Price: <span className="font-medium text-foreground">{formatDualCurrencyCompact(item.base_price)}</span>
                              </span>
                              {item.item_type && (
                                <Badge variant="outline" className="text-xs">
                                  {item.item_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-primary">
                              {formatDualCurrencyCompact(item.final_price)}
                            </p>
                          </div>
                        </div>
                        
                        {item.selected_addons && Object.keys(item.selected_addons).length > 0 && (
                          <div className="mt-3 bg-green-50 dark:bg-green-950/30 p-3 rounded border border-green-200 dark:border-green-900">
                            <p className="text-xs font-semibold text-green-800 dark:text-green-400 mb-2">Selected Addons:</p>
                            <div className="space-y-1">
                              {Object.entries(item.selected_addons).map(([addonName, addonPrice]) => (
                                <div key={addonName} className="flex justify-between text-sm text-green-700 dark:text-green-300">
                                  <span>+ {addonName}</span>
                                  <span className="font-medium">{formatDualCurrencyCompact(addonPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.removed_ingredients && item.removed_ingredients.length > 0 && (
                          <div className="mt-3 bg-red-50 dark:bg-red-950/30 p-3 rounded border border-red-200 dark:border-red-900">
                            <p className="text-xs font-semibold text-red-800 dark:text-red-400 mb-2">Removed Ingredients:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.removed_ingredients.map((ingredient, idx) => (
                                <Badge key={idx} variant="destructive" className="text-xs">
                                  - {ingredient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items in this order</p>
                )}
              </div>

              {/* Price Summary */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Price Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatDualCurrencyCompact(
                        selectedOrderDetails.total_price - 
                        selectedOrderDetails.delivery_fee + 
                        selectedOrderDetails.discount_amount
                      )}
                    </span>
                  </div>
                  {selectedOrderDetails.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span className="font-medium">{formatDualCurrencyCompact(selectedOrderDetails.delivery_fee)}</span>
                    </div>
                  )}
                  {selectedOrderDetails.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount ({selectedOrderDetails.discount_percentage}%)</span>
                      <span className="font-medium">-{formatDualCurrencyCompact(selectedOrderDetails.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-base">Total</span>
                      <span className="font-bold text-xl text-primary">
                        {formatDualCurrencyCompact(selectedOrderDetails.total_price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No order details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
