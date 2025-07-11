import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from 'lucide-react';
import { fetchWithAuth } from "@/context/AuthContext";

export default function RestaurantDetails() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/restaurant/restaurants`);
        if (!response.ok) throw new Error('Failed to fetch restaurant');
        const data = await response.json();
        const restaurantData = data.find(r => r[0].toString() === id);
        console.log('Restaurant data:', restaurantData);
        setRestaurant(restaurantData);
        
        // Fetch menu items
        const itemsResponse = await fetchWithAuth(`${API_URL}/restaurant/${id}/items`);
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

    const fetchFavorites = async () => {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user.access_token) return;
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteItems(data);
      }
    };

    if (id) {
      fetchRestaurantDetails();
      fetchFavorites();
    }
  }, [id]);

  const isItemFavorite = (itemId) => favoriteItems.some(f => f.item_id === itemId);
  const getFavoriteId = (itemId) => {
    const fav = favoriteItems.find(f => f.item_id === itemId);
    return fav ? (fav.id || fav.favourite_id || fav._id) : null;
  };

  const handleToggleFavorite = async (itemId) => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!user.access_token) return;
    if (!isItemFavorite(itemId)) {
      // Add to favorites
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteItems([...favoriteItems, data]);
      }
    } else {
      // Remove from favorites
      const favId = getFavoriteId(itemId);
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems/${favId || itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        setFavoriteItems(favoriteItems.filter(f => f.item_id !== itemId));
      }
    }
  };

  if (loading) return <div className="container py-8">Loading...</div>;
  if (error) return <div className="container py-8 text-red-500">{error}</div>;
  if (!restaurant) return <div className="container py-8">Restaurant not found</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 mt-16 pb-32">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">{restaurant[7]}</CardTitle>
            <CardDescription className="text-base md:text-lg">{restaurant[1]}, {restaurant[2]}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Opening Hours</h3>
                {restaurant[8] && typeof restaurant[8] === 'object' && Object.entries(restaurant[8]).map(([day, hours]) => (
                  <div key={day} className="flex justify-between items-center border-b border-border/50 pb-1">
                    <span className="font-medium capitalize">{day}:</span>
                    <span className="text-muted-foreground">{hours}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Location</h3>
                <p className="text-muted-foreground">{restaurant[1]}</p>
                <p className="text-muted-foreground">{restaurant[2]}</p>
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
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(item[0])}
                  className="absolute top-1 right-1 z-10 bg-white/80 rounded-full p-1 hover:bg-white shadow"
                  aria-label={isItemFavorite(item[0]) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart
                    className={`h-6 w-6 ${isItemFavorite(item[0]) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                    fill={isItemFavorite(item[0]) ? 'red' : 'none'}
                  />
                </button>
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