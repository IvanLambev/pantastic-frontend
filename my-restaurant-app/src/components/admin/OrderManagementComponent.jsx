import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import { formatDualCurrencyCompact } from "@/utils/currency";

// Helper function to get color classes for order status
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
      return 'bg-green-500 hover:bg-green-600 text-white';
    case 'pending':
      return 'bg-yellow-500 hover:bg-yellow-600 text-white';
    case 'canceled':
      return 'bg-red-500 hover:bg-red-600 text-white';
    case 'in progress':
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    default:
      return 'bg-gray-500 hover:bg-gray-600 text-white';
  }
};

export default function OrderManagementComponent() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevOrdersRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio('/ding-126626.mp3');
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const checkForNewOrders = useCallback((newOrders) => {
    if (!Array.isArray(newOrders)) {
      console.error('Invalid orders data received:', newOrders);
      return;
    }
    try {
      const validNewOrders = newOrders.filter(order => order.order_id);
      const prevOrderIds = new Set(prevOrdersRef.current.map(o => o.order_id));
      const newOrdersFound = validNewOrders.filter(order => !prevOrderIds.has(order.order_id));
      const statusChanges = validNewOrders.filter(newOrder => {
        const prevOrder = prevOrdersRef.current.find(o => o.order_id === newOrder.order_id);
        return prevOrder && prevOrder.status !== newOrder.status;
      });
      if (newOrdersFound.length > 0) {
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error('Audio play failed:', err));
        }
        toast.success(`${newOrdersFound.length} new order${newOrdersFound.length > 1 ? 's' : ''} received!`);
      }
      statusChanges.forEach(order => {
        const prevOrder = prevOrdersRef.current.find(o => o.order_id === order.order_id);
        console.log(`Order ${order.order_id} status changed: ${prevOrder?.status} -> ${order.status}`);
      });
      prevOrdersRef.current = validNewOrders;
    } catch (error) {
      console.error('Error in checkForNewOrders:', error);
    }
  }, []);

  const fetchItems = useCallback(async (restaurantId) => {
    try {
      console.log('🔄 [ITEMS DEBUG] Fetching items for restaurant:', restaurantId);
      console.log('🔄 [ITEMS DEBUG] Items URL:', `${API_URL}/restaurant/${restaurantId}/items`);

      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurantId}/items`);
      console.log('📡 [ITEMS DEBUG] Response status:', response.status, response.ok);

      if (!response.ok) {
        console.error('❌ [ITEMS DEBUG] Failed to fetch menu items. Status:', response.status);
        throw new Error('Failed to fetch menu items');
      }

      const data = await response.json();
      console.log('✅ [ITEMS DEBUG] Items data received:', data);
      console.log('📊 [ITEMS DEBUG] Items data type:', typeof data, 'Is Array:', Array.isArray(data));
      console.log('📊 [ITEMS DEBUG] Items count:', data?.length);

      if (Array.isArray(data)) {
        const validItems = data.filter(item => Array.isArray(item) && item.length >= 5 && item[0] && item[4]);
        console.log('📊 [ITEMS DEBUG] Valid items count:', validItems.length);
        console.log('📊 [ITEMS DEBUG] First valid item:', validItems[0]);

        // For each item, parse addons if present
        const itemsWithAddons = validItems.map(item => {
          let addons = [];
          if (item[2]) {
            try {
              addons = typeof item[2] === 'string' ? JSON.parse(item[2]) : item[2];
            } catch (e) {
              console.warn('⚠️ [ITEMS DEBUG] Failed to parse addons for item:', item[0], e);
              addons = [];
            }
          }
          return { raw: item, addons };
        });

        console.log('🎯 [ITEMS DEBUG] Setting items state. Count:', itemsWithAddons.length);
        setItems(itemsWithAddons);
        console.log('✅ [ITEMS DEBUG] Items set successfully');
      } else {
        console.warn('⚠️ [ITEMS DEBUG] Items data is not an array');
        setItems([]);
      }
    } catch (err) {
      console.error('❌ [ITEMS DEBUG] Error fetching items:', err);
      console.error('❌ [ITEMS DEBUG] Error stack:', err.stack);
      setItems([]);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('🔄 [ORDER DEBUG] Starting fetchOrders...');
      const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');
      console.log('👤 [ORDER DEBUG] Admin user from session:', adminUser);
      console.log('🔑 [ORDER DEBUG] Has access token:', !!adminUser?.access_token);

      if (!adminUser?.access_token) {
        console.warn('⚠️ [ORDER DEBUG] No admin token available');
        setLoading(false);
        return;
      }

      console.log('🔄 [ORDER DEBUG] Fetching orders from:', `${API_URL}/order/orders/worker`);
      const response = await fetchWithAdminAuth(`${API_URL}/order/orders/worker`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 [ORDER DEBUG] Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ORDER DEBUG] Failed to fetch orders. Status:', response.status);
        console.error('❌ [ORDER DEBUG] Error response:', errorText);
        throw new Error(`Failed to fetch orders: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [ORDER DEBUG] Orders data received:', data);
      console.log('📊 [ORDER DEBUG] Orders data type:', typeof data, 'Is Array:', Array.isArray(data));
      console.log('📊 [ORDER DEBUG] Orders count:', data?.length);

      if (!Array.isArray(data)) {
        console.error('❌ [ORDER DEBUG] Orders data is not an array:', data);
        setLoading(false);
        return;
      }

      console.log('🔍 [ORDER DEBUG] Checking for new orders...');
      checkForNewOrders(data);

      console.log('🔍 [ORDER DEBUG] Looking for restaurant ID in orders...');
      const orderWithRestaurantId = data.find(order => order?.restaurant_id);
      console.log('🔍 [ORDER DEBUG] Order with restaurant ID:', orderWithRestaurantId);

      if (orderWithRestaurantId) {
        console.log('🏪 [ORDER DEBUG] Fetching items for restaurant:', orderWithRestaurantId.restaurant_id);
        await fetchItems(orderWithRestaurantId.restaurant_id);
      } else {
        const restaurantId = localStorage.getItem('selectedRestaurantId');
        console.log('🏪 [ORDER DEBUG] Using restaurant ID from localStorage:', restaurantId);
        if (restaurantId) {
          await fetchItems(restaurantId);
        } else {
          console.warn('⚠️ [ORDER DEBUG] No restaurant ID found');
        }
      }

      console.log('🔄 [ORDER DEBUG] Filtering and sorting orders...');
      const validOrders = data.filter(order => order.created_at);
      console.log('📊 [ORDER DEBUG] Valid orders (with created_at):', validOrders.length);

      const sortedOrders = validOrders.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      console.log('🎯 [ORDER DEBUG] Setting orders state. Count:', sortedOrders.length);
      console.log('🎯 [ORDER DEBUG] First order:', sortedOrders[0]);
      setOrders(sortedOrders);
      setLoading(false);
      console.log('✅ [ORDER DEBUG] Orders fetched and set successfully');

    } catch (error) {
      console.error('❌ [ORDER DEBUG] Error fetching orders:', error);
      console.error('❌ [ORDER DEBUG] Error stack:', error.stack);
      // Don't show toast for permission errors, as they might be expected
      if (!error.message.includes('forbidden')) {
        toast.error(`Failed to load orders: ${error.message}`);
      }
      setLoading(false);
    }
  }, [checkForNewOrders, fetchItems]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId) return;
    try {
      const response = await fetchWithAdminAuth(`${API_URL}/order/orders/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      });
      if (!response.ok) throw new Error('Failed to update order status');
      setOrders(orders.map(order => {
        if (order.order_id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      }));
      toast.success('Order status updated successfully');
    } catch {
      toast.error('Failed to update order status');
    }
  };

  // Helper to get item details and addons by ID
  const getItemDetailsById = (itemId) => {
    const found = items.find(item => String(item.raw[0]) === String(itemId));
    if (!found) return null;
    return found;
  };

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchOrders]);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Order Management</h1>
      <div className="grid gap-4">
        {orders.map(order => (
          <Card key={order.id || order.order_id || 'unknown'} className="shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-grow space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">                    <div>
                    <h3 className="font-semibold">Order #{order.order_id.split('-')[0]}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                    {order.scheduled_delivery_time && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-400">Scheduled</Badge>
                        <span className="text-xs text-orange-700 font-semibold">
                          Scheduled for: {new Date(order.scheduled_delivery_time).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <div className="space-y-3">
                      {(() => {
                        // Debug logging
                        console.log('Order items:', order.items);
                        console.log('Items length:', order.items?.length);
                        console.log('Items exists:', !!order.items);

                        // Check for new format (items array)
                        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                          return order.items.map((item, itemIndex) => (
                            <div key={item.item_id || itemIndex} className="border-l-2 border-blue-200 pl-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {item.item_quantity}x {item.item_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Base: {formatDualCurrencyCompact(item.item_price)} × {item.item_quantity} = {formatDualCurrencyCompact(item.item_base_total || 0)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{formatDualCurrencyCompact(item.item_total || 0)}</p>
                                </div>
                              </div>

                              {item.applied_addons && item.applied_addons.length > 0 && (
                                <div className="mt-2 ml-2">
                                  <p className="text-xs font-medium text-green-700 mb-1">Addons:</p>
                                  <div className="space-y-1">
                                    {item.applied_addons.map((addon, addonIndex) => (
                                      <div key={addonIndex} className="flex justify-between items-center text-xs">
                                        <span className="text-green-600">
                                          + {addon.addon_name} (×{addon.addon_quantity})
                                        </span>
                                        <span className="text-green-600">
                                          {formatDualCurrencyCompact(addon.addon_total || 0)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-1 pt-1 border-t border-green-200">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-green-700">Addon Total:</span>
                                      <span className="font-medium text-green-700">
                                        {formatDualCurrencyCompact(item.item_addon_total || 0)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ));
                        }

                        // Fallback to old format if new format not available
                        if (order.products && typeof order.products === 'object') {
                          return Object.entries(order.products).map(([id, quantity]) => {
                            const itemDetails = getItemDetailsById(id);
                            return (
                              <div key={id} className="border-l-2 border-gray-200 pl-3">
                                <p className="text-sm font-medium">
                                  {quantity}x {itemDetails ? itemDetails.raw[6] : `Unknown Item (${id})`}
                                </p>
                              </div>
                            );
                          });
                        }

                        // No items found
                        return <p className="text-sm text-muted-foreground">No items available</p>;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <Select
                    value={order.status || 'Pending'}
                    onValueChange={(value) => updateOrderStatus(order.order_id, value)}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>                  <Button
                    variant="outline"
                    onClick={() => window.open(`/order-tracking-v2/${order.order_id}`, '_blank')}
                    className="w-full md:w-auto"
                  >
                    View Details
                  </Button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">Delivery Method</p>
                  <p className="text-sm text-muted-foreground capitalize">{order.delivery_method}</p>
                </div>
                {order.address && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground break-words">{order.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-sm text-muted-foreground">
                    ${order.total_price ? order.total_price.toFixed(2) : '0.00'}
                  </p>
                  {order.items && order.items.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <div>Items: ${order.items.reduce((sum, item) => sum + (item.item_base_total || 0), 0).toFixed(2)}</div>
                      <div>Addons: ${order.items.reduce((sum, item) => sum + (item.item_addon_total || 0), 0).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
