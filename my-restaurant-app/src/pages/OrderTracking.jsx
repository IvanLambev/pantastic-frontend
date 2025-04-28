import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { useCart } from '@/hooks/use-cart';

const themeColor = '#ff9900'; // orange
const grayColor = '#e5e7eb'; // tailwind gray-200

export default function OrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { orderId } = useParams();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const fetchOrder = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const response = await fetch(`${API_URL}/order/orders/status`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      // Find the order with the matching order_id
      const found = data.find(o => o.order_id === orderId);
      setOrder(found || null);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to fetch order details');
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const response = await fetch(`${API_URL}/order/orders/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      toast.success('Order cancelled successfully');
      clearCart();
      navigate('/');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Failed to cancel order');
    }
  };

  const getStatusStep = (status) => {
    const steps = {
      'pending': 0,
      'preparing': 1,
      'ready': 2,
      'delivered': 3,
      'cancelled': -1
    };
    return steps[status] ?? 0;
  };

  if (loading) {
    return <div className="container py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="container py-8">Order not found</div>;
  }

  const currentStep = getStatusStep(order.status);
  const progressLabels = ['Order Received', 'Preparing', 'Ready for Pickup', 'Delivered'];

  return (
    <div className="container py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Progress Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 sm:gap-0">
            {progressLabels.map((label, idx) => (
              <div key={label} className="flex sm:flex-col items-center sm:flex-1 gap-3 sm:gap-0">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: currentStep === -1 ? grayColor : (idx <= currentStep ? themeColor : grayColor),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 18,
                    marginBottom: 0,
                  }}
                >
                  {idx + 1}
                </div>
                <span className="text-xs text-center whitespace-nowrap" 
                  style={{ 
                    color: currentStep === -1 ? grayColor : (idx <= currentStep ? themeColor : '#888')
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Order Details</h3>
            <div className="space-y-4">
              {order.products && Object.entries(order.products).map(([productId, quantity], index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{quantity}x Product #{productId}</span>
                </div>
              ))}
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total_price ? order.total_price.toFixed(2) : '0.00'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div>
                  <div className="text-sm">Delivery Method: <span className="font-medium capitalize">{order.delivery_method}</span></div>
                  {order.address && <div className="text-sm break-words">Address: <span className="font-medium">{order.address}</span></div>}
                </div>
                <div>
                  {order.estimated_delivery_time && (
                    <div className="text-sm">
                      Estimated Delivery: <span className="font-medium">{new Date(order.estimated_delivery_time).toLocaleString()}</span>
                    </div>
                  )}
                  {order.delivery_person_name && (
                    <>
                      <div className="text-sm">Delivery Person: <span className="font-medium">{order.delivery_person_name}</span></div>
                      {order.delivery_person_phone && (
                        <div className="text-sm">Contact: <span className="font-medium">{order.delivery_person_phone}</span></div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              onClick={handleCancelOrder}
              className="w-full sm:w-auto bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Cancel Order
            </Button>
            <Button
              onClick={() => navigate('/food')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Order More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}