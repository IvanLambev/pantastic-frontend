import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from '@/config/api';
import { toast } from "sonner";
import { Timeline, TimelineItem, TimelineDot, TimelineConnector, TimelineContent } from "@/components/ui/timeline";

export default function OrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { orderId } = useParams();

  const fetchOrder = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const response = await fetch(`${API_URL}/order/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch order');
      const data = await response.json();
      setOrder(data);
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

  const getStatusStep = (status) => {
    const steps = {
      'pending': 0,
      'preparing': 1,
      'ready': 2,
      'delivered': 3,
      'cancelled': -1
    };
    return steps[status] || 0;
  };

  if (loading) {
    return <div className="container py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="container py-8">Order not found</div>;
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="container py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Order #{orderId}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <Timeline>
            <TimelineItem>
              <TimelineDot status={currentStep >= 0 ? "complete" : "cancelled"} />
              <TimelineConnector status={currentStep >= 1 ? "complete" : "incomplete"} />
              <TimelineContent>Order Received</TimelineContent>
            </TimelineItem>
            
            <TimelineItem>
              <TimelineDot status={currentStep >= 1 ? "complete" : currentStep === -1 ? "cancelled" : "incomplete"} />
              <TimelineConnector status={currentStep >= 2 ? "complete" : "incomplete"} />
              <TimelineContent>Preparing</TimelineContent>
            </TimelineItem>
            
            <TimelineItem>
              <TimelineDot status={currentStep >= 2 ? "complete" : currentStep === -1 ? "cancelled" : "incomplete"} />
              <TimelineConnector status={currentStep >= 3 ? "complete" : "incomplete"} />
              <TimelineContent>Ready for Pickup</TimelineContent>
            </TimelineItem>
            
            <TimelineItem>
              <TimelineDot status={currentStep >= 3 ? "complete" : currentStep === -1 ? "cancelled" : "incomplete"} />
              <TimelineContent>Delivered</TimelineContent>
            </TimelineItem>
          </Timeline>

          <div className="space-y-4">
            <h3 className="font-semibold">Order Details</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}