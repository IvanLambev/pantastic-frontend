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
import { convertAndFormatPrice, convertBgnToEur } from "@/utils/currency"

const Food = () => {
  const navigate = useNavigate()
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
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
    // Check if restaurant is already selected
    const savedRestaurant = sessionStorage.getItem('selectedRestaurant')
    if (savedRestaurant) {
      const restaurant = JSON.parse(savedRestaurant);
      setSelectedRestaurant(restaurant);
      setShowRestaurantModal(false);
      fetchItems(restaurant[0]);
    } else {
      setShowRestaurantModal(true);
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
    setSelectedRestaurant(null)
    sessionStorage.removeItem('selectedRestaurant')
    setShowRestaurantModal(true)
    setItems([]) // Clear menu items when changing restaurant
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
    // Handle both old array format and new object format
    const itemData = Array.isArray(item) ? {
      id: item[0],
      name: item[7],
      price: Number(item[8]) || 0,
      image: item[5],
      description: item[4]
    } : {
      id: item.item_id,
      name: item.name,
      price: Number(item.price) || 0,
      image: item.image_url,
      description: item.description
    };
    
    addToCart({
      ...itemData,
      quantity: 1
    })
    toast.success(`Added ${itemData.name} to cart`)
  }

  // Helper functions to handle both array and object formats
  const getItemId = (item) => Array.isArray(item) ? item[0] : item.item_id;
  const getItemName = (item) => Array.isArray(item) ? item[7] : item.name;
  const getItemPrice = (item) => Array.isArray(item) ? Number(item[8]) || 0 : Number(item.price) || 0;
  const getItemImage = (item) => Array.isArray(item) ? item[5] : item.image_url;
  const getItemDescription = (item) => Array.isArray(item) ? item[4] : item.description;
  const getItemType = (item) => Array.isArray(item) ? item[6] : item.item_type;
  
  // Helper function to check if item has addons (both direct and template-based)
  const hasItemAddons = (item) => {
    if (Array.isArray(item)) return false; // Old format doesn't have addon info
    return (
      (item.addons && Object.keys(item.addons).length > 0) ||
      (item.addon_template_ids && item.addon_template_ids.length > 0)
    );
  };
  
  // Helper function to check if item has removables (both direct and template-based)
  const hasItemRemovables = (item) => {
    if (Array.isArray(item)) return false; // Old format doesn't have removable info
    return (
      (item.removables && item.removables.length > 0) ||
      (item.removable_template_ids && item.removable_template_ids.length > 0)
    );
  };
  
  // Helper function to get addon count
  const getAddonCount = (item) => {
    if (Array.isArray(item)) return 0;
    return Object.keys(item.addons || {}).length + (item.addon_template_ids || []).length;
  };
  
  // Helper function to get removable count  
  const getRemovableCount = (item) => {
    if (Array.isArray(item)) return 0;
    return (item.removables || []).length + (item.removable_template_ids || []).length;
  };
  
  const isItemFavorite = (itemId) => favoriteItems.some(f => f.item_id === itemId);
  const getFavoriteId = (itemId) => {
    const fav = favoriteItems.find(f => f.item_id === itemId);
    return fav ? (fav.id || fav.favourite_id || fav._id) : null;
  };

  const handleToggleFavorite = async (item) => {
    const itemId = getItemId(item);
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
    setShowRestaurantModal(false);
    toast.dismiss();
    toast.success(`You selected restaurant: ${restaurant[8]}`);
    fetchItems(restaurant[0]);
    // LOG: Food selectRestaurant called
    console.log('[SONNER] Food selectRestaurant called for', restaurant[8]);
  }

  // Add filtered and sorted items logic
  const filteredItems = items.filter(item => {
    // Make sure the item exists
    if (!item) return false;
    
    const name = getItemName(item) || '';
    const description = getItemDescription(item) || '';
    const price = getItemPrice(item);
    const itemType = getItemType(item) || '';
    
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
    const priceInEur = convertBgnToEur(price);
    const matchesPrice = priceInEur >= priceRange[0] && priceInEur <= priceRange[1];
    
    // Category filtering based on item_type
    const matchesCategory = category === "all" || 
      (category === "sweet" && itemType.includes('sweet')) ||
      (category === "savory" && itemType.includes('savory')) ||
      (category === "promo" && itemType.includes('promo'));
    
    return matchesSearch && matchesPrice && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return getItemPrice(a) - getItemPrice(b);
      case "price-high":
        return getItemPrice(b) - getItemPrice(a);
      case "most-ordered":
        // If order count is available, use it, otherwise default to 0
        return 0; // Placeholder for order count logic
      default:
        return 0;
    }
  })

  if (loading && !showRestaurantModal) {
    return <div className="min-h-[calc(100vh-4rem)] text-center p-4 pb-32">Loading...</div>
  }

  if (error && !showRestaurantModal) {
    return <div className="min-h-[calc(100vh-4rem)] text-center text-red-500 p-4 pb-32">{error}</div>
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background w-full overflow-x-hidden">
      <RestaurantSelector
        open={showRestaurantModal}
        onClose={() => setShowRestaurantModal(false)}
        onSelect={selectRestaurant}
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
                <span className="font-bold text-lg truncate w-full">{selectedRestaurant[8]}</span>
                <span className="text-sm text-muted-foreground truncate w-full">{selectedRestaurant[1]}, {selectedRestaurant[2]}</span>
              </div>
              <span className="text-sm text-primary whitespace-nowrap shrink-0">Change Restaurant</span>
            </Button>
          </div>
        </div>
      )}

      {/* Category Buttons Row */}
      {selectedRestaurant && (
        <div className="container mx-auto px-4 my-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl"
              variant={category === "sweet" ? "default" : "outline"}
              onClick={() => setCategory("sweet")}
            >
              <span className="hidden sm:inline">Sweet Pancakes</span>
              <span className="sm:hidden">Sweet</span>
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl"
              variant={category === "savory" ? "default" : "outline"}
              onClick={() => setCategory("savory")}
            >
              <span className="hidden sm:inline">Sour Pancakes</span>
              <span className="sm:hidden">Sour</span>
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl"
              variant={category === "promo" ? "default" : "outline"}
              onClick={() => setCategory("promo")}
            >
              Promo
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl bg-orange-400 text-white border-0"
              style={{ letterSpacing: 1 }}
              onClick={() => navigate("/deluxe-box")}
            >
              <span className="hidden lg:inline">PANTASTIC DELUXE BOX</span>
              <span className="lg:hidden">DELUXE BOX</span>
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
              {filteredItems.map((item) => {
                const itemId = getItemId(item);
                const itemName = getItemName(item);
                const itemPrice = getItemPrice(item);
                const itemImage = getItemImage(item);
                
                // Get addons and removables for display using helper functions
                const hasAddons = hasItemAddons(item);
                const hasRemovables = hasItemRemovables(item);
                
                return (
                  <Card key={itemId} className="flex flex-row h-24">
                    <div className="w-24 h-full relative">
                      <img
                        src={itemImage || '/elementor-placeholder-image.webp'}
                        alt={itemName}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(item)}
                        className="absolute top-1 right-1 z-10 bg-white/80 rounded-full p-1 hover:bg-white shadow"
                        aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`h-6 w-6 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                          fill={isItemFavorite(itemId) ? 'red' : 'none'}
                        />
                      </button>
                      
                      {/* Compact addon/removable indicators */}
                      {(hasAddons || hasRemovables) && (
                        <div className="absolute bottom-1 left-1 flex gap-1">
                          {hasAddons && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                          {hasRemovables && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                        </div>
                      )}
                    </div>
                    <CardContent className="flex flex-1 justify-between items-center p-3">
                      <div className="flex flex-col justify-center">
                        <h3 className="font-semibold text-sm">{itemName}</h3>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">€{convertAndFormatPrice(itemPrice)}</span>
                          {(hasAddons || hasRemovables) && (
                            <div className="flex gap-1">
                              {hasAddons && <span className="text-xs text-green-600">+</span>}
                              {hasRemovables && <span className="text-xs text-orange-600">~</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/restaurants/${Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant?.restaurant_id}/items/${itemId}`)}
                        >
                          Options
                        </Button>
                        <Button size="sm" onClick={() => handleAddToCart(item)}>
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                  {filteredItems.map((item) => {
                    const itemId = getItemId(item);
                    const itemName = getItemName(item);
                    const itemPrice = getItemPrice(item);
                    const itemImage = getItemImage(item);
                    const itemDescription = getItemDescription(item);
                    
                    // Get addons and removables for display using helper functions
                    const hasAddons = hasItemAddons(item);
                    const hasRemovables = hasItemRemovables(item);
                    const addonCount = getAddonCount(item);
                    const removableCount = getRemovableCount(item);
                    
                    return (
                      <Card key={itemId} className="flex flex-col h-full">
                        <div className="aspect-video relative">
                          <img
                            src={itemImage || '/elementor-placeholder-image.webp'}
                            alt={itemName}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(item)}
                            className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1 hover:bg-white shadow"
                            aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart
                              className={`h-6 w-6 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                              fill={isItemFavorite(itemId) ? 'red' : 'none'}
                            />
                          </button>
                          
                          {/* Addon/Removable indicators */}
                          {(hasAddons || hasRemovables) && (
                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                              {hasAddons && (
                                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                  +{addonCount}
                                </div>
                              )}
                              {hasRemovables && (
                                <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                                  -{removableCount}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <CardContent className="flex flex-col flex-grow p-4">
                          <h3 className="font-semibold mb-2">{itemName}</h3>
                          <p className="text-sm text-muted-foreground mb-2 flex-grow">{itemDescription}</p>
                          
                          {/* Show available customizations */}
                          {(hasAddons || hasRemovables) && (
                            <div className="text-xs text-muted-foreground mb-3 flex flex-wrap gap-1">
                              {hasAddons && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Extras available</span>}
                              {hasRemovables && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Customizable</span>}
                            </div>
                          )}
                          
                          <div className="flex justify-between items-start">
                            <span className="font-semibold">€{convertAndFormatPrice(itemPrice)}</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/restaurants/${Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant?.restaurant_id}/items/${itemId}`)}
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
                    );
                  })}
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