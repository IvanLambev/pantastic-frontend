import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/restaurant/restaurants`);
        if (!response.ok) throw new Error('Failed to fetch restaurant');
        const data = await response.json();
        const restaurantData = data.find(r => r[0].toString() === id);
        console.log('Restaurant data:', restaurantData);
        setRestaurant(restaurantData);
        
        // Fetch menu items
        const itemsResponse = await fetch(`${API_URL}/restaurant/${id}/items`);
        if (!itemsResponse.ok) throw new Error('Failed to fetch menu items');
        const itemsData = await itemsResponse.json();
        console.log('Menu items:', itemsData);
        setMenuItems(itemsData);
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

  if (loading) return <div className="container py-8">Loading...</div>;
  if (error) return <div className="container py-8 text-red-500">{error}</div>;
  if (!restaurant) return <div className="container py-8">Restaurant not found</div>;

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">{restaurant[6]}</CardTitle>
            <CardDescription className="text-lg">{restaurant[1]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(restaurant[7] || {}).map(([day, hours]) => (
                <div key={day} className="flex justify-between items-center border-b border-border/50 pb-1">
                  <span className="font-medium capitalize">{day}:</span>
                  <span className="text-muted-foreground">{hours}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold mb-4">Menu Items</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div key={item[0]} className="menu-item">
              <img 
                src={item[3] || '/elementor-placeholder-image.webp'} 
                alt={item[4]}
                className="menu-item-image"
              />
              <h3>{item[4]}</h3>
              <p>{item[2]}</p>
              <p className="price">${typeof item[5] === 'number' ? item[5].toFixed(2) : '0.00'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}