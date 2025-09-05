import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from '@/config/api'
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Heart } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/context/AuthContext";
import RestaurantSelector from "@/components/ui/RestaurantSelector";

const Food = () => {
  const navigate = useNavigate()
  const [showCityModal, setShowCityModal] = useState(true)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState([])
  const [priceRange, setPriceRange] = useState([0, 100])
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("default")
  const { addToCart } = useCart()
  const isMobile = window.innerWidth <= 768
  const [favoriteItems, setFavoriteItems] = useState([])

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/restaurant/restaurants`)
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants')
        }
        const data = await response.json()
        setRestaurants(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching restaurants:', err)
      } finally {
        setLoading(false)
      }
    }

    // Check if restaurant is already selected
    const savedRestaurant = sessionStorage.getItem('selectedRestaurant')
    if (savedRestaurant) {
      const restaurant = JSON.parse(savedRestaurant);
      setSelectedRestaurant(restaurant);
      setSelectedCity(restaurant[2]); // Set the city from the saved restaurant
      setShowCityModal(false);
      setShowRestaurantModal(false);
      fetchItems(restaurant[0]);
    } else {
      fetchRestaurants();
      setShowCityModal(true);
    }
  }, [])

  // Fetch favorite items on mount
  useEffect(() => {
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
    fetchFavorites();
  }, []);

  const handleChangeSelection = async () => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/restaurant/restaurants`)
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }
      const data = await response.json()
      setRestaurants(data)
      setSelectedRestaurant(null)
      sessionStorage.removeItem('selectedRestaurant')
      setShowCityModal(true)
      setSelectedCity(null)
      setItems([]) // Clear menu items when changing restaurant
    } catch (err) {
      setError(err.message)
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async (restaurantId) => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`)
      if (!response.ok) {
        throw new Error('Failed to fetch menu items')
      }
      const data = await response.json()
      console.log('Fetched menu items:', data)
      setItems(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu items'
      setError(errorMessage)
      console.error('Error fetching menu items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item) => {
    addToCart({
      id: item[0],
      name: item[6],
      price: Number(item[7]) || 0,
      image: item[5],
      description: item[4],
      quantity: 1
    })
    toast.success(`Added ${item[6]} to cart`)
  }

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

  // Unified restaurant selection handler
  function selectRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    setShowCityModal(false);
    setShowRestaurantModal(false);
    toast.dismiss();
    toast.success(`You selected restaurant: ${restaurant[7]}`);
    fetchItems(restaurant[0]);
    // LOG: Food selectRestaurant called
    console.log('[SONNER] Food selectRestaurant called for', restaurant[7]);
  }

  // Add filtered and sorted items logic
  const filteredItems = items.filter(item => {
    // Make sure the item exists and has the expected structure
    if (!item || !Array.isArray(item)) return false;
    
    const name = item[6] || '';
    const description = item[4] || '';
    const price = Number(item[7]) || 0;
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    
    // For now, show all items since category data is not in the response
    // You can add category logic once you know how categories are represented
    const matchesCategory = category === "all" || true;
    
    return matchesSearch && matchesPrice && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number(a[7]) - Number(b[7]); // Price is at index 7
      case "price-high":
        return Number(b[7]) - Number(a[7]); // Price is at index 7
      case "most-ordered":
        // If order count is available, use it, otherwise default to 0
        return ((b[1]?._items?.length || 0) - (a[1]?._items?.length || 0));
      default:
        return 0;
    }
  })

  if (loading && !showCityModal && !showRestaurantModal) {
    return <div className="min-h-[calc(100vh-4rem)] text-center p-4 pb-32">Loading...</div>
  }

  if (error && !showCityModal && !showRestaurantModal) {
    return <div className="min-h-[calc(100vh-4rem)] text-center text-red-500 p-4 pb-32">{error}</div>
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background min-w-[100vw]">
      <RestaurantSelector
        open={showCityModal || showRestaurantModal}
        onClose={() => {
          setShowCityModal(false);
          setShowRestaurantModal(false);
        }}
        restaurants={restaurants}
        onSelect={selectRestaurant}
        loading={loading}
        error={error}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
      />
      {/* Selected Restaurant Banner */}
      {selectedRestaurant && (
        <div className="bg-background border-b">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="outline"
              onClick={handleChangeSelection}
              className="w-full min-h-[4rem] flex justify-between items-center px-6 py-3 gap-4"
            >
              <div className="flex flex-col items-start min-w-0">
                <span className="font-bold text-lg truncate w-full">{selectedRestaurant[7]}</span>
                <span className="text-sm text-muted-foreground truncate w-full">{selectedRestaurant[1]}, {selectedRestaurant[2]}</span>
              </div>
              <span className="text-sm text-primary whitespace-nowrap shrink-0">Change Restaurant</span>
            </Button>
          </div>
        </div>
      )}

      {/* Category Buttons Row */}
      {selectedRestaurant && (
        <div className="flex justify-center my-6">
          <div className="flex w-[80vw] max-w-5xl gap-4">
            <Button
              className="flex-1 text-lg py-8 font-bold rounded-xl"
              style={{ minWidth: 0 }}
              variant={category === "sweet" ? "default" : "outline"}
              onClick={() => setCategory("sweet")}
            >
              Sweet Pancakes
            </Button>
            <Button
              className="flex-1 text-lg py-8 font-bold rounded-xl"
              style={{ minWidth: 0 }}
              variant={category === "savory" ? "default" : "outline"}
              onClick={() => setCategory("savory")}
            >
              Sour Pancakes
            </Button>
            <Button
              className="flex-1 text-lg py-8 font-bold rounded-xl"
              style={{ minWidth: 0 }}
              variant={category === "promo" ? "default" : "outline"}
              onClick={() => setCategory("promo")}
            >
              Promo
            </Button>
            <Button
              className="flex-1 text-lg py-8 font-bold rounded-xl bg-orange-400 text-white border-0"
              style={{ minWidth: 0, letterSpacing: 1 }}
              onClick={() => navigate("/deluxe-box")}
            >
              PANTASTIC DELUXE BOX
            </Button>
          </div>
        </div>
      )}

      {/* Existing Food page content */}
      {isMobile ? (
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Mobile Menu Items Grid */}
            <div className="grid grid-cols-1 gap-4">
              {filteredItems.map((item) => (
                <Card key={item[0]} className="flex flex-row h-24">
                  <div className="w-24 h-full relative">
                    <img
                      src={item[5] || '/elementor-placeholder-image.webp'}
                      alt={item[6]}
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
                  <CardContent className="flex flex-1 justify-between items-center p-3">                    <div className="flex flex-col justify-center">
                      <h3 className="font-semibold text-sm">{item[6]}</h3>
                      <span className="font-semibold text-sm">€{(Number(item[7]) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate(`/restaurants/${selectedRestaurant[0]}/items/${item[0]}`)}
                      >
                        Options
                      </Button>
                      <Button size="sm" onClick={() => handleAddToCart(item)}>
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 py-8 mt-16 pb-32">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-64 space-y-8">
                {/* Filters Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <div className="pt-2">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={priceRange}
                        onValueChange={setPriceRange}
                        className="w-full"
                      />
                      <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                        <span>€{priceRange[0]}</span>
                        <span>€{priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="most-ordered">Most Ordered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <ToggleGroup type="single" value={category} onValueChange={setCategory} className="flex flex-wrap gap-2">
                      <ToggleGroupItem value="all" aria-label="Show all items">
                        All
                      </ToggleGroupItem>
                      <ToggleGroupItem value="sweet" aria-label="Show sweet items">
                        Sweet
                      </ToggleGroupItem>
                      <ToggleGroupItem value="savory" aria-label="Show savory items">
                        Savory
                      </ToggleGroupItem>
                      <ToggleGroupItem value="promo" aria-label="Show promotional items">
                        Promo
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <Card key={item[0]} className="flex flex-col h-full">
                      <div className="aspect-video relative">
                        <img
                          src={item[5] || '/elementor-placeholder-image.webp'}
                          alt={item[6]}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(item[0])}
                          className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1 hover:bg-white shadow"
                          aria-label={isItemFavorite(item[0]) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart
                            className={`h-6 w-6 ${isItemFavorite(item[0]) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            fill={isItemFavorite(item[0]) ? 'red' : 'none'}
                          />
                        </button>
                      </div>
                      <CardContent className="flex flex-col flex-grow p-4">
                        <h3 className="font-semibold mb-2">{item[6]}</h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-grow">{item[4]}</p>
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">€{(Number(item[7]) || 0).toFixed(2)}</span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/restaurants/${selectedRestaurant[0]}/items/${item[0]}`)}
                            >
                              Options
                            </Button>
                            <Button size="sm" onClick={() => handleAddToCart(item)}>
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Food