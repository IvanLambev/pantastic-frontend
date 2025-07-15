import { useState, useEffect, useRef, useCallback } from 'react';
import { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/context/AuthContext";

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
      const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        const validItems = data.filter(item => Array.isArray(item) && item.length >= 5 && item[0] && item[4]);
        // For each item, parse addons if present
        const itemsWithAddons = validItems.map(item => {
          let addons = [];
          if (item[2]) {
            try {
              addons = typeof item[2] === 'string' ? JSON.parse(item[2]) : item[2];
            } catch (e) {
              addons = [];
            }
          }
          return { raw: item, addons };
        });
        setItems(itemsWithAddons);
      } else {
        setItems([]);
      }
    } catch (err) {
      setItems([]);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user?.access_token) {
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
      if (!Array.isArray(data)) {
        return;
      }
      checkForNewOrders(data);
      const orderWithRestaurantId = data.find(order => order?.restaurant_id);
      if (orderWithRestaurantId) {
        await fetchItems(orderWithRestaurantId.restaurant_id);
      } else {
        const restaurantId = sessionStorage.getItem('selectedRestaurantId');
        if (restaurantId) {
          await fetchItems(restaurantId);
        }
      }
      const validOrders = data.filter(order => order.created_at);
      const sortedOrders = validOrders.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });
      setOrders(sortedOrders);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [checkForNewOrders, fetchItems]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!orderId) return;
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
                      {order.scheduled_delivery_time && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-400">Scheduled</Badge>
                          <span className="text-xs text-orange-700 font-semibold">
                            Scheduled for: {new Date(order.scheduled_delivery_time).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant={order.status === 'Canceled' ? 'destructive' : 'default'}>
                      {order.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {(order.products && Object.entries(order.products).map(([id, quantity]) => {
                        let instructions = {};
                        if (order.order_description) {
                          try {
                            instructions = JSON.parse(order.order_description);
                          } catch (e) {
                            instructions = {};
                          }
                        }
                        const itemInstruction = instructions[id];
                        const itemDetails = getItemDetailsById(id);
                        return (
                          <li key={id}>
                            {quantity}x {itemDetails ? itemDetails.raw[6] : `Unknown Item (${id})`}
                            {itemDetails && itemDetails.addons && itemDetails.addons.length > 0 && (
                              <ul className="ml-4 list-disc">
                                {itemDetails.addons.map((addonTemplate, idx) => (
                                  <li key={idx} className="text-xs text-muted-foreground">
                                    <span className="font-medium">{addonTemplate.name}:</span>
                                    <span> {Object.entries(addonTemplate.addons || {}).map(([name, price]) => `${name} (+$${Number(price).toFixed(2)})`).join(', ')}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
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
