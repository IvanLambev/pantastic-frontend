import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";

export default function RestaurantDetailsAdmin() {
  // Use restaurantId (UUID) instead of restaurantName
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [deliveryPeople, setDeliveryPeople] = useState([]);
  const [currentTab, setCurrentTab] = useState("items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/restaurant/restaurants`);
        const data = await res.json();
        // Find by UUID (restaurantId)
        const found = data.find(r => r[0] === restaurantId);
        setRestaurant(found);
        if (found) {
          const itemsRes = await fetch(`${API_URL}/restaurant/${found[0]}/items`);
          setMenuItems(await itemsRes.json());
          const dpRes = await fetch(`${API_URL}/restaurant/${found[0]}/delivery-people`);
          setDeliveryPeople(await dpRes.json());
        }
      } catch (err) {
        setError("Failed to load restaurant details");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!restaurant) return <div className="p-8">Restaurant not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="details">Restaurant Details</TabsTrigger>
          <TabsTrigger value="delivery">Delivery People</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Menu Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Card key={item[0]}>
                <CardHeader>
                  <CardTitle>{item[4]}</CardTitle>
                  <CardDescription>{item[2]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div>Price: ${typeof item[5] === 'number' ? item[5].toFixed(2) : '0.00'}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Restaurant Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Location Details</h3>
              <p><strong>Latitude:</strong> {restaurant[5]}</p>
              <p><strong>Longitude:</strong> {restaurant[6]}</p>
              <p><strong>Address:</strong> {restaurant[1]}</p>
              <p><strong>City:</strong> {restaurant[2]}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
              {Object.entries(restaurant[8] || {}).map(([day, hours]) => (
                <p key={day}><strong>{day}:</strong> {hours}</p>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="delivery" className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Delivery People</h2>
          <DeliveryPeopleManager 
            restaurantId={restaurant[0]}
            deliveryPeople={deliveryPeople}
            onUpdate={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
