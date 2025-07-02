import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/lib/utils";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevOrdersRef = useRef([]);
  const audioRef = useRef(null);

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio('/ding-126626.mp3');
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);  // Helper function to check for new orders
  const checkForNewOrders = useCallback((newOrders) => {
    if (!Array.isArray(newOrders)) {
      console.error('Invalid orders data received:', newOrders);
      return;
    }
    
    try {
      // Filter out orders without IDs
      const validNewOrders = newOrders.filter(order => order.order_id);
      const prevOrderIds = new Set(prevOrdersRef.current.map(o => o.order_id));
      
      // Find new orders that weren't in the previous set
      const newOrdersFound = validNewOrders.filter(order => !prevOrderIds.has(order.order_id));
      
      // Check for status changes in existing orders
      const statusChanges = validNewOrders.filter(newOrder => {
        const prevOrder = prevOrdersRef.current.find(o => o.order_id === newOrder.order_id);
        return prevOrder && prevOrder.status !== newOrder.status;
      });
      
      // Handle new orders
      if (newOrdersFound.length > 0) {
        console.log(`New orders detected (${newOrdersFound.length}):`, 
          newOrdersFound.map(o => ({ id: o.order_id, status: o.status })));
        
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error('Audio play failed:', err));
        }
        
        toast.success(`${newOrdersFound.length} new order${newOrdersFound.length > 1 ? 's' : ''} received!`);
      }
      
      // Handle status changes
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
      console.log('Fetching items for restaurant:', restaurantId);
      const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      console.log('Fetched menu items:', data);
      
      // Validate the data structure
      if (Array.isArray(data)) {
        const validItems = data.filter(item => 
          Array.isArray(item) && item.length >= 5 && item[0] && item[4]
        );
        console.log('Valid items for lookup:', validItems);
        setItems(validItems);
      } else {
        console.error('Unexpected items data structure:', data);
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
      setItems([]);
    }
  }, []);
  const fetchOrders = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user?.access_token) {
        console.error('No access token found');
        return;
      }

      const response = await fetchWithAuth(`${API_URL}/order/orders/worker`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
          
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      console.log('Fetched orders:', data);

      if (!Array.isArray(data)) {
        console.error('Invalid orders data format received:', data);
        return;
      }

      // Check for new orders before updating state
      checkForNewOrders(data);

      // Get restaurant ID from any order that has it
      const orderWithRestaurantId = data.find(order => order?.restaurant_id);
      if (orderWithRestaurantId) {
        console.log('Found restaurant ID from order:', orderWithRestaurantId.restaurant_id);
        await fetchItems(orderWithRestaurantId.restaurant_id);
      } else {
        // Fallback to stored restaurant ID
        const restaurantId = sessionStorage.getItem('selectedRestaurantId');
        if (restaurantId) {
          console.log('Using stored restaurant ID:', restaurantId);
          await fetchItems(restaurantId);
        } else {
          console.log('No restaurant ID found');
        }
      }      // Filter out any orders without created_at timestamps
      const validOrders = data.filter(order => order.created_at);
      
      // Sort orders by creation date, newest first
      const sortedOrders = validOrders.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        if (isNaN(dateA) || isNaN(dateB)) {
          console.error('Invalid date found in orders:', { a: a.created_at, b: b.created_at });
          return 0;
        }
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      setLoading(false);
      
      // Log the number of active orders
      const activeOrders = sortedOrders.filter(order => 
        order.status !== 'Delivered' && order.status !== 'Canceled'
      );
      console.log(`Active orders: ${activeOrders.length}, Total orders: ${sortedOrders.length}`);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  }, [checkForNewOrders, fetchItems]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId) {
      console.error('Order ID is undefined. Cannot update order status.');
      return;
    }
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const response = await fetchWithAuth(`${API_URL}/order/orders/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
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
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };
  const getItemNameById = (itemId) => {
    console.log('Looking up item:', itemId, 'in items:', items);
    // Convert itemId to string for comparison since IDs might come as different types
    const item = items.find(item => String(item[0]) === String(itemId));
    if (!item) {
      console.log('Item not found:', itemId);
      return `Unknown Item (${itemId})`;
    }
    console.log('Found item:', item);
    return item[4];
  };  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Set up polling interval (every 5 seconds for real-time updates)
    const intervalId = setInterval(() => {
      console.log('Polling for new orders...');
      fetchOrders();
    }, 5000);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up order polling interval');
      clearInterval(intervalId);
    };
  }, [fetchOrders]);

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="container mx-auto px-4">
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
                    </div>
                    <Badge variant={order.status === 'Canceled' ? 'destructive' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {(order.products && Object.entries(order.products).map(([id, quantity]) => {
                        // Parse instructions for this order (if any)
                        let instructions = {};
                        if (order.order_description) {
                          try {
                            instructions = JSON.parse(order.order_description);
                          } catch (e) {
                            instructions = {};
                          }
                        }
                        const itemInstruction = instructions[id];
                        return (
                          <li key={id}>
                            {quantity}x {getItemNameById(id)}
                            {itemInstruction && (
                              <span className="ml-2 text-xs text-primary font-medium">(Instructions: {itemInstruction})</span>
                            )}
                          </li>
                        );
                      })) || <li>No items available</li>}
                    </ul>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}