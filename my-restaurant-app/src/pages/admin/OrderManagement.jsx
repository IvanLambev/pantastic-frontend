import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchItemDetails = async (restaurantId, itemId) => {
    try {
      const response = await fetch(`${API_URL}/restaurant/${restaurantId}/items/${itemId}`);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching item details:', errorData.detail);
        return { name: 'Unknown Item' };
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching item details:', error);
      return { name: 'Unknown Item' };
    }
  };

  const fetchOrders = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const response = await fetch(`${API_URL}/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      const ordersWithDetails = await Promise.all(
        data.orders.map(async (order) => {
          const itemsWithDetails = await Promise.all(
            Object.entries(order.products).map(async ([itemId, quantity]) => {
              const itemDetails = await fetchItemDetails(order.restaurant_id, itemId);
              return { ...itemDetails, quantity };
            })
          );
          return { ...order, products: itemsWithDetails };
        })
      );
      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    }
  };

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
        if (order.id === orderId) {
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

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Order Management</h1>
      
      <div className="grid gap-4">
        {orders.map(order => (
          <Card key={order.id || 'unknown'} className="shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-grow space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">Order #{order.order_id}</h3>
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
                      {(order.products && order.products.map((product, index) => (
                        <li key={index}>
                          {product.quantity}x {product.name}
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
                    variant="outline"
                    onClick={() => window.open(`/order-tracking/${order.order_id}`, '_blank')}
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