import React, { useState, useEffect } from "react";
import { Pencil, User, ShoppingBag, Clock, MapPin, Truck, Heart } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/config/api";
import { fetchWithAuth } from "@/context/AuthContext";
import { t } from "@/utils/translations";
import { formatDualCurrencyCompact } from "@/utils/currency";

export default function UserDashboard() {
  const { user, token, setToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [isItemMapLoading, setIsItemMapLoading] = useState(true);

  // Fetch token from sessionStorage and set it, then fetch orders when token is set
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && typeof parsedUser === "object" && parsedUser.access_token) {
          setToken(parsedUser.access_token);
        }
      } catch (err) {
        console.error("Error parsing user data from session storage:", err);
      }
    }
  }, [setToken]);

  // Fetch orders when token and itemMap are available
  useEffect(() => {
    if (!token || isItemMapLoading) return;
    setIsLoading(true);
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const response = await fetchWithAuth(`${API_URL}/order/orders/user`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch {
        setError('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, [token, isItemMapLoading]);

  // Fetch user info when token is available
  useEffect(() => {
    if (!token) return;
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
      } catch {
        console.error("Error fetching user information:", err);
      }
    };
    fetchUserInfo();
  }, [token]);

  // Fetch favorites and all items for mapping
  useEffect(() => {
    const fetchFavorites = async () => {
      setIsItemMapLoading(true);
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user.access_token) {
        setIsItemMapLoading(false);
        return;
      }
      // Fetch all restaurants
      const restaurantsRes = await fetchWithAuth(`${API_URL}/restaurant/restaurants`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      let allItems = [];
      if (restaurantsRes.ok) {
        const restaurants = await restaurantsRes.json();
        // Fetch all items for all restaurants
        const itemsArrays = await Promise.all(
          restaurants.map(async (r) => {
            const restaurantId = r[0] || r.restaurant_id || r.id;
            const itemsRes = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`, {
              headers: {
                'Authorization': `Bearer ${user.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            if (itemsRes.ok) {
              const items = await itemsRes.json();
              // Normalize each item to object format
              return items.map(item => {
                if (Array.isArray(item)) {
                  return {
                    item_id: item[0],
                    created_at: item[1],
                    description: item[2],
                    image_url: item[3],
                    name: item[4],
                    price: item[5],
                    category_id: item[6],
                  };
                } else if (item && item.item_id) {
                  return item;
                } else {
                  return null;
                }
              }).filter(Boolean);
            }
            return [];
          })
        );
        allItems = itemsArrays.flat();
      }
      // Build a map of item_id to item details
      const itemMapObj = {};
      for (const item of allItems) {
        if (item && item.item_id) {
          itemMapObj[item.item_id] = item;
        }
      }
      setItemMap(itemMapObj);
      // Fetch favourites
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Attach item details to each favourite, fallback to placeholder if missing
        const detailedFavorites = data.map(fav => {
          const details = itemMapObj[fav.item_id] || {};
          return {
            ...fav,
            name: details.name || 'Unknown Item',
            description: details.description || '',
            image_url: details.image_url || '/elementor-placeholder-image.webp',
            price: details.price !== undefined ? details.price : '--',
            restaurant_id: details.category_id ? details.category_id : details.restaurant_id || '', // fallback for restaurant id
          };
        });
        setFavoriteItems(detailedFavorites);
      }
      setIsItemMapLoading(false);
    };
    fetchFavorites();
  }, []);

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
    console.log("handleDeleteAccount function triggered.");
    if (!userInfo?.email) {
      console.error("No email found for user. Cannot delete account.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      console.log("Deleting user account for email:", userInfo.email);
      const response = await fetch(`${API_URL}/user/user/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userInfo.email }),
      });
      console.log("Delete account response:", response);
      console.log("uzera",JSON.stringify({ email: userInfo.email }));

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      const data = await response.json();
      console.log("Delete account result:", data);
      alert(data.message);
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("selectedRestaurant");
      setToken(null);
      setOrders([]);
      // Optionally, log the user out or redirect them
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("An error occurred while trying to delete your account.");
    }
  };

  // Add unfavourite handler
  const handleUnfavourite = async (favouriteId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/user/favouriteItems/${favouriteId}`, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setFavoriteItems(favoriteItems.filter(fav => fav.favourite_id !== favouriteId && fav.id !== favouriteId && fav._id !== favouriteId));
      }
    } catch (e) {
      // Optionally show error
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">{t('dashboard.myAccount')}</h1>

      <Tabs defaultValue="profile">
        <TabsList className="mb-4">
          <TabsTrigger value="profile">{t('dashboard.profile')}</TabsTrigger>
          <TabsTrigger value="orders">{t('dashboard.orders')}</TabsTrigger>
          <TabsTrigger value="favourites">{t('dashboard.favourites')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.personalInformation')}</CardTitle>
              <CardDescription>{t('dashboard.personalInformationDesc')}</CardDescription>
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
              <CardTitle>{t('dashboard.orderHistory')}</CardTitle>
              <CardDescription>{t('dashboard.orderHistoryDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || isItemMapLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('dashboard.loadingOrders')}</p>
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <p className="text-red-500 mb-2">{t('dashboard.failedToLoadOrders')}</p>
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
                            <span className="font-medium">{t('dashboard.orderNumber')} #{order.order_id.substring(0, 8)}</span>
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
                                  <p className="font-medium">{t('dashboard.items')}</p>
                                  <ul className="text-sm">
                                    {(Array.isArray(order.products)
                                      ? order.products
                                      : Object.entries(order.products || {}).map(([itemId, quantity]) => ({ item_id: itemId, quantity }))
                                    ).map((product, index) => {
                                      const details = itemMap[product.item_id] || {};
                                      return (
                                        <li key={index} className="flex items-center gap-2 mb-1">
                                          <img
                                            src={details.image_url || '/elementor-placeholder-image.webp'}
                                            alt={details.name || 'Unknown Item'}
                                            className="w-8 h-8 object-cover rounded mr-2 border"
                                          />
                                          <span className="font-medium">{details.name || 'Unknown Item'}</span>
                                          <span className="text-xs text-muted-foreground ml-2">x {product.quantity}</span>
                                          {details.price !== undefined && (
                                            <span className="ml-2 text-xs">{formatDualCurrencyCompact(details.price)}</span>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{t('dashboard.deliveryAddress')}</p>
                                  <p className="text-sm">{order.address}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{t('dashboard.deliveryTime')}</p>
                                  <p className="text-sm">
                                    {order.delivery_time ? formatDate(order.delivery_time) : t('dashboard.pending')}
                                  </p>
                                </div>
                              </div>

                              {order.delivery_person_name && (
                                <div className="flex items-start gap-2">
                                  <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{t('dashboard.deliveryPerson')}</p>
                                    <p className="text-sm">{order.delivery_person_name}</p>
                                    <p className="text-sm">{order.delivery_person_phone}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{t('cart.total')}</p>
                                  <p className="text-sm font-medium">{formatDualCurrencyCompact(order.total_price)}</p>
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

        <TabsContent value="favourites">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.favouriteItems')}</CardTitle>
              <CardDescription>{t('dashboard.favouriteItemsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isItemMapLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">{t('dashboard.loadingFavourites')}</p>
                </div>
              ) : favoriteItems.length === 0 ? (
                <div className="text-muted-foreground">{t('dashboard.noFavouriteItems')}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {favoriteItems.map((fav) => (
                    <div key={fav.id || fav.favourite_id || fav._id} className="relative border rounded-lg overflow-hidden">
                      <img
                        src={fav.image_url || '/elementor-placeholder-image.webp'}
                        alt={fav.name || 'Unknown Item'}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <button
                          title="Unfavourite"
                          onClick={() => handleUnfavourite(fav.favourite_id || fav.id || fav._id)}
                          className="bg-white/80 rounded-full p-1 hover:bg-red-100 border border-red-200"
                        >
                          <Heart className="h-6 w-6 text-red-500" fill="none" />
                        </button>
                      </div>
                      <div className="p-4">
                        <div className="font-semibold">{fav.name || 'Unknown Item'}</div>
                        <div className="text-sm text-muted-foreground">{fav.description || ''}</div>
                        {fav.addons && Object.keys(fav.addons).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {t('cart.addons')}: {Object.entries(fav.addons).map(([name, price]) => 
                              `${name} (+${formatDualCurrencyCompact(price)})`
                            ).join(', ')}
                          </div>
                        )}
                        <div className="font-bold mt-2">{fav.price !== undefined ? formatDualCurrencyCompact(fav.price) : ''}</div>
                        <div className="mt-3 flex gap-2">
                          <a
                            href={`/food?restaurant=${fav.restaurant_id || ''}&item=${fav.item_id || fav._id}`}
                            className="inline-block bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs"
                          >
                            {t('dashboard.seeDetails')}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
