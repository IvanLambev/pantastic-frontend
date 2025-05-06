import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config/api';
import axios from 'axios';
import { Pencil } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const UserDashboard = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/user/user/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      .then(response => setOrders(response.data.orders))
      .catch(() => setOrders([]));
    }
  }, [token]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="flex items-center gap-2">
              <span>Name: {user?.name}</span>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </p>
            <p className="flex items-center gap-2">
              <span>Email: {user?.email}</span>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </p>
            <p className="flex items-center gap-2">
              <span>Phone: {user?.phone}</span>
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Previous Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <ul className="space-y-4">
              {orders.map(order => (
                <li key={order.order_id} className="border p-4 rounded-md">
                  <p><strong>Order ID:</strong> {order.order_id}</p>
                  <p><strong>Total Price:</strong> ${order.total_price}</p>
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>Delivery Method:</strong> {order.delivery_method}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No previous orders found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;