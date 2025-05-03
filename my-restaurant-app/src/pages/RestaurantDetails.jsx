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
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 mt-16 pb-32">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">{restaurant[6]}</CardTitle>
            <CardDescription className="text-base md:text-lg">{restaurant[1]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Opening Hours</h3>
                {Object.entries(restaurant[7] || {}).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center border-b border-border/50 pb-1">
                    <span className="font-medium capitalize">{day}:</span>
                    <span className="text-muted-foreground">{hours}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Location</h3>
                <p className="text-muted-foreground">{restaurant[1]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl md:text-2xl font-bold mb-6">Menu Items</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Card key={item[0]} className="flex flex-col overflow-hidden">
              <div className="aspect-video relative">
                <img 
                  src={item[3] || '/elementor-placeholder-image.webp'} 
                  alt={item[4]}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="flex flex-col flex-grow p-4">
                <h3 className="font-semibold mb-2">{item[4]}</h3>
                <p className="text-sm text-muted-foreground mb-4 flex-grow">{item[2]}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-semibold">${typeof item[5] === 'number' ? item[5].toFixed(2) : '0.00'}</span>
                  {addToCart && (
                    <Button onClick={() => handleAddToCart(item)} size="sm">
                      Add to Cart
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}