import React, { useState, useEffect } from "react";
import { Pencil, User, ShoppingBag, Clock, MapPin, Truck } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/api";

export default function UserDashboard() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_URL}/user/user/orders`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Response:", response);
        console.log("Response status:", response.status);

        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.status}`);
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message || "Failed to fetch orders");
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchOrders();
    }
  }, [token]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/user/user-info`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user information");
        }

        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        console.error("Error fetching user information:", err);
      }
    };

    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email) return;

    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_URL}/user/user/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      const data = await response.json();
      alert(data.message);
      // Optionally, log the user out or redirect them
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("An error occurred while trying to delete your account.");
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Manage your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Loading..."}</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{userInfo ? userInfo.email : "Loading..."}</p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{userInfo ? userInfo.phone : "Loading..."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>View all your previous orders</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your orders...</p>
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-red-500 mb-2">Failed to load orders</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                  <p className="text-muted-foreground">When you place orders, they will appear here.</p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {orders.map((order) => (
                    <AccordionItem key={order.order_id} value={order.order_id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Order #{order.order_id.substring(0, 8)}</span>
                            <Badge
                              variant={
                                order.status === "Delivered"
                                  ? "default"
                                  : order.status === "Processing"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground mt-1 sm:mt-0">
                            {formatDate(order.created_at)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <ShoppingBag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Items</p>
                                  <ul className="text-sm">
                                    {Object.entries(order.products).map(([item, quantity]) => (
                                      <li key={item}>
                                        {item} x {quantity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Delivery Address</p>
                                  <p className="text-sm">{order.address}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Delivery Time</p>
                                  <p className="text-sm">
                                    {order.delivery_time ? formatDate(order.delivery_time) : "Pending"}
                                  </p>
                                </div>
                              </div>

                              {order.delivery_person_name && (
                                <div className="flex items-start gap-2">
                                  <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">Delivery Person</p>
                                    <p className="text-sm">{order.delivery_person_name}</p>
                                    <p className="text-sm">{order.delivery_person_phone}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">Total</p>
                                  <p className="text-sm font-medium">${order.total_price.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <button
          onClick={handleDeleteAccount}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
