import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  }, []);

  // Helper function to check for new orders
  const checkForNewOrders = useCallback((newOrders) => {
    const prevOrderIds = new Set(prevOrdersRef.current.map(o => o.order_id));
    const newOrdersFound = newOrders.filter(order => !prevOrderIds.has(order.order_id));
    
    if (newOrdersFound.length > 0 && audioRef.current) {
      // Play sound for new orders
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      // Show toast notification
      toast.success(`${newOrdersFound.length} new order${newOrdersFound.length > 1 ? 's' : ''} received!`);
    }
    
    prevOrdersRef.current = newOrders;
  }, []);

  const fetchItems = useCallback(async (restaurantId) => {
    try {
      console.log('Fetching items for restaurant:', restaurantId);
      const response = await fetch(`${API_URL}/restaurant/${restaurantId}/items`);
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
      const response = await fetch(`${API_URL}/order/orders/status`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      console.log('Fetched orders:', data);

      // Check for new orders before updating state
      checkForNewOrders(data);

      // Get restaurant ID from the first order if available
      const firstOrder = data[0];
      if (firstOrder && firstOrder.restaurant_id) {
        console.log('Found restaurant ID from order:', firstOrder.restaurant_id);
        await fetchItems(firstOrder.restaurant_id);
      } else {
        // Fallback to stored restaurant ID
        const restaurantId = sessionStorage.getItem('selectedRestaurantId');
        if (restaurantId) {
          console.log('Using stored restaurant ID:', restaurantId);
          await fetchItems(restaurantId);
        } else {
          console.log('No restaurant ID found');
        }
      }
      setOrders(data);
      setLoading(false);
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
      const response = await fetch(`${API_URL}/order/orders/status`, {
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
  };

  useEffect(() => {
    // Initial fetch
    fetchOrders();
    
    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchOrders, 30000);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [fetchOrders]); // Add fetchOrders as a dependency

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
                      {(order.products && Object.entries(order.products).map(([id, quantity]) => (
                        <li key={id}>
                          {quantity}x {getItemNameById(id)}
                        </li>
                      ))) || <li>No items available</li>}
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
                  </Select>
                  <Button 
                    variant="outline"                    onClick={() => window.open(`/order-tracking/${order.order_id}`, '_blank')}
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