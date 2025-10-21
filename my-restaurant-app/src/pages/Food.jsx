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
import { LuExpand } from "react-icons/lu"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/context/AuthContext";
import RestaurantSelector from "@/components/ui/RestaurantSelector";
import { convertBgnToEur, formatDualCurrencyCompact } from "@/utils/currency"
import { t } from "@/utils/translations"

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
      const restaurantId = Array.isArray(restaurant) ? restaurant[0] : restaurant.restaurant_id;
      fetchItems(restaurantId);
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

  const handleItemNavigation = (item) => {
    const itemId = getItemId(item);
    navigate(`/restaurants/${Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant?.restaurant_id}/items/${itemId}`);
  };

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
    const restaurantName = Array.isArray(restaurant) ? restaurant[8] : restaurant.name;
    const restaurantId = Array.isArray(restaurant) ? restaurant[0] : restaurant.restaurant_id;
    toast.success(`You selected restaurant: ${restaurantName}`);
    fetchItems(restaurantId);
    // LOG: Food selectRestaurant called
    console.log('[SONNER] Food selectRestaurant called for', restaurantName);
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
    return <div className="min-h-[calc(100vh-4rem)] text-center p-4 pb-32">{t('common.loading')}</div>
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
                <span className="font-bold text-lg truncate w-full">{Array.isArray(selectedRestaurant) ? selectedRestaurant[8] : selectedRestaurant.name}</span>
                <span className="text-sm text-muted-foreground truncate w-full">{Array.isArray(selectedRestaurant) ? `${selectedRestaurant[1]}, ${selectedRestaurant[3]}` : `${selectedRestaurant.address}, ${selectedRestaurant.city}`}</span>
              </div>
              <span className="text-sm text-primary whitespace-nowrap shrink-0">{t('menu.changeRestaurant')}</span>
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
              <span className="hidden sm:inline">{t('menu.sweetPancakes')}</span>
              <span className="sm:hidden">{t('menu.sweet')}</span>
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl"
              variant={category === "savory" ? "default" : "outline"}
              onClick={() => setCategory("savory")}
            >
              <span className="hidden sm:inline">{t('menu.sourPancakes')}</span>
              <span className="sm:hidden">{t('menu.sour')}</span>
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl"
              variant={category === "promo" ? "default" : "outline"}
              onClick={() => setCategory("promo")}
            >
              {t('menu.promo')}
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
              <Label>{t('menu.search')}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('menu.searchPlaceholder')}
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
                  <Card key={itemId} className="flex flex-col sm:flex-row overflow-hidden">
                    <div className="w-full sm:w-32 h-48 sm:h-32 relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                      <img
                        src={itemImage || '/elementor-placeholder-image.webp'}
                        alt={itemName}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                      />
                      {/* Hover overlay with expand icon */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <LuExpand className="h-8 w-8 text-white" />
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                        className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1.5 hover:bg-white shadow transition-colors"
                        aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`h-4 w-4 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                          fill={isItemFavorite(itemId) ? 'red' : 'none'}
                        />
                      </button>
                      
                      {/* Compact addon/removable indicators */}
                      {(hasAddons || hasRemovables) && (
                        <div className="absolute bottom-2 left-2 flex gap-1">
                          {hasAddons && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                          {hasRemovables && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                        </div>
                      )}
                    </div>
                    <CardContent className="flex flex-1 flex-col sm:flex-row sm:justify-between sm:items-center p-4 gap-3">
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate">{itemName}</h3>
                        <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                          <span className="font-bold text-lg text-primary">{formatDualCurrencyCompact(itemPrice)}</span>
                          {(hasAddons || hasRemovables) && (
                            <div className="flex gap-1">
                              {hasAddons && <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">+</span>}
                              {hasRemovables && <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">~</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleItemNavigation(item)}
                          className="whitespace-nowrap"
                        >
                          {t('menu.options')}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleAddToCart(item)}
                          className="whitespace-nowrap"
                        >
                          {t('menu.add')}
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
                    <Label>{t('menu.search')}</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('menu.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('menu.priceRange')}</Label>
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
                      <Card key={itemId} className="flex flex-col h-full overflow-hidden">
                        <div className="aspect-video relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                          <img
                            src={itemImage || '/elementor-placeholder-image.webp'}
                            alt={itemName}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                          />
                          {/* Hover overlay with expand icon */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <LuExpand className="h-10 w-10 text-white" />
                          </div>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(item);
                            }}
                            className="absolute top-3 right-3 z-10 bg-white/80 rounded-full p-2 hover:bg-white shadow transition-colors"
                            aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart
                              className={`h-5 w-5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                              fill={isItemFavorite(itemId) ? 'red' : 'none'}
                            />
                          </button>
                          
                          {/* Addon/Removable indicators */}
                          {(hasAddons || hasRemovables) && (
                            <div className="absolute top-3 left-3 flex flex-col gap-1">
                              {hasAddons && (
                                <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                                  +{addonCount}
                                </div>
                              )}
                              {hasRemovables && (
                                <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow">
                                  -{removableCount}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <CardContent className="flex flex-col flex-grow p-4">
                          <h3 className="font-semibold mb-2 text-lg">{itemName}</h3>
                          <p className="text-sm text-muted-foreground mb-3 flex-grow overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{itemDescription}</p>
                          
                          {/* Show available customizations */}
                          {(hasAddons || hasRemovables) && (
                            <div className="text-xs text-muted-foreground mb-4 flex flex-wrap gap-1">
                              {hasAddons && <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">{t('menu.extrasAvailable')}</span>}
                              {hasRemovables && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">{t('menu.customizable')}</span>}
                            </div>
                          )}
                          
                          <div className="flex flex-col gap-3 mt-auto">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xl text-primary">{formatDualCurrencyCompact(itemPrice)}</span>
                            </div>
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleItemNavigation(item)}
                                className="flex-1"
                              >
                                {t('menu.options')}
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => handleAddToCart(item)}
                                className="flex-1"
                              >
                                {t('menu.addToCart')}
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