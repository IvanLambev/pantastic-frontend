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
import { Badge } from "@/components/ui/badge"
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
import { openInMaps } from "@/utils/mapsHelper"
import { selectRestaurantWithFallback } from "@/utils/ipGeolocation"

const Food = () => {
  const navigate = useNavigate()
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [restaurants, setRestaurants] = useState([]) // All available restaurants
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState([])
  const [priceRange, setPriceRange] = useState([0, 100])
  const [category, setCategory] = useState("sweet")
  const [sortBy, setSortBy] = useState("default")
  const { addToCart, clearCart } = useCart()
  const isMobile = window.innerWidth <= 768
  const [favoriteItems, setFavoriteItems] = useState([])

  // Fetch all restaurants and auto-select with fallback logic
  useEffect(() => {
    const initializeRestaurant = async () => {
      try {
        // Fetch all restaurants first
        const response = await fetchWithAuth(`${API_URL}/restaurant/restaurants`);
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        const restaurantsData = await response.json();
        setRestaurants(restaurantsData);

        // Use fallback logic to select restaurant
        const autoSelectedRestaurant = await selectRestaurantWithFallback(restaurantsData);

        if (autoSelectedRestaurant) {
          setSelectedRestaurant(autoSelectedRestaurant);
          localStorage.setItem('selectedRestaurant', JSON.stringify(autoSelectedRestaurant));
          setShowRestaurantModal(false);

          const restaurantId = Array.isArray(autoSelectedRestaurant)
            ? autoSelectedRestaurant[0]
            : autoSelectedRestaurant.restaurant_id;

          await fetchItems(restaurantId);
        } else {
          // No restaurant could be auto-selected, show modal
          setShowRestaurantModal(true);
        }
      } catch (err) {
        console.error('Error initializing restaurant:', err);
        setError(err.message);
        setShowRestaurantModal(true);
      } finally {
        setLoading(false);
      }
    };

    initializeRestaurant();
  }, [])

  // Fetch favorite items on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.customer_id) return;
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFavoriteItems(data);
      }
    };
    fetchFavorites();

    // Check for saved category from Home page
    const savedCategory = sessionStorage.getItem('selectedCategory');
    if (savedCategory) {
      setCategory(savedCategory);
    }

    const handleStorageChange = () => {
      const newCategory = sessionStorage.getItem('selectedCategory');
      if (newCategory) {
        setCategory(newCategory);
      }
    };

    window.addEventListener('category-change', handleStorageChange);
    return () => {
      window.removeEventListener('category-change', handleStorageChange);
    };
  }, []);

  const handleChangeSelection = async () => {
    // Clear the cart when changing restaurants
    clearCart()
    setSelectedRestaurant(null)
    localStorage.removeItem('selectedRestaurant')
    setShowRestaurantModal(true)
    setItems([]) // Clear menu items when changing restaurant
  }

  const handleModalClose = async () => {
    setShowRestaurantModal(false);

    // If no restaurant is selected when closing modal, apply fallback logic
    if (!selectedRestaurant) {
      const autoSelectedRestaurant = await selectRestaurantWithFallback(restaurants);

      if (autoSelectedRestaurant) {
        setSelectedRestaurant(autoSelectedRestaurant);
        localStorage.setItem('selectedRestaurant', JSON.stringify(autoSelectedRestaurant));

        const restaurantId = Array.isArray(autoSelectedRestaurant)
          ? autoSelectedRestaurant[0]
          : autoSelectedRestaurant.restaurant_id;

        await fetchItems(restaurantId);

        const restaurantName = Array.isArray(autoSelectedRestaurant)
          ? autoSelectedRestaurant[8]
          : autoSelectedRestaurant.name;

        toast.info(`Auto-selected restaurant: ${restaurantName}`);
      }
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
    // Handle both old array format and new object format
    const itemData = Array.isArray(item) ? {
      id: String(item[0]),
      name: item[7],
      price: Number(item[8]) || 0,
      image: item[5],
      description: item[4]
    } : {
      id: String(item.item_id),
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
  const getItemLabels = (item) => Array.isArray(item) ? [] : (item.labels || []);



  const isItemFavorite = (itemId) => favoriteItems.some(f => f.item_id === itemId);
  const getFavoriteId = (itemId) => {
    const fav = favoriteItems.find(f => f.item_id === itemId);
    return fav ? (fav.id || fav.favourite_id || fav._id) : null;
  };

  const handleToggleFavorite = async (item) => {
    const itemId = getItemId(item);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.access_token) return;
    if (!isItemFavorite(itemId)) {
      // Get restaurant_id from selectedRestaurant
      const restaurantId = Array.isArray(selectedRestaurant)
        ? selectedRestaurant[0]
        : selectedRestaurant?.restaurant_id;

      // Add to favorites
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: itemId,
          restaurant_id: restaurantId  // Include restaurant_id
        }),
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
        credentials: 'include', // Send HttpOnly cookies
        headers: {
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
    // Get the current restaurant ID if exists
    const currentRestaurantId = selectedRestaurant
      ? (Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant.restaurant_id)
      : null;

    // Get the new restaurant ID
    const newRestaurantId = Array.isArray(restaurant) ? restaurant[0] : restaurant.restaurant_id;

    // If switching to a different restaurant, clear the cart
    if (currentRestaurantId && currentRestaurantId !== newRestaurantId) {
      clearCart();
      toast.info(t('cart.clearedForNewRestaurant') || 'Количката беше изчистена за новия ресторант');
    }

    setSelectedRestaurant(restaurant);
    localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    setShowRestaurantModal(false);
    toast.dismiss();
    const restaurantName = Array.isArray(restaurant) ? restaurant[8] : restaurant.name;
    toast.success(t('home.restaurantSelected', { name: restaurantName }));
    fetchItems(newRestaurantId);
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
    const isDeluxe = item.item_id === "5de9bf5b-cf0a-4a8c-b6c7-fc87e957acfd" || name === "Deluxe Pancake";

    // Deluxe items should ONLY appear in the deluxe category
    if (isDeluxe && category !== "deluxe") return false;

    let matchesCategory = false;
    if (category === "deluxe") {
      matchesCategory = isDeluxe;
    } else if (category === "all") {
      matchesCategory = !isDeluxe;
    } else if (category === "sweet") {
      matchesCategory = itemType.includes('sweet') && !isDeluxe;
    } else if (category === "american") {
      // Assuming american pancakes are also 'sweet' but maybe we want to filter specifically?
      // If there is no specific 'american' type in the backend, we might just show 'sweet' or 
      // if the user meant specific items. For now, let's treat it as 'sweet' or check for 'american' in name/type if possible.
      // The user said "american-sweet_pancake" in the prompt, so let's check for that or just 'sweet' if not found.
      // Let's try to match 'american' in itemType or name if possible, otherwise fallback to sweet.
      matchesCategory = (itemType.includes('american') || itemType.includes('sweet')) && !isDeluxe;
    } else if (category === "savory") {
      // Strict filtering for savory/sour
      matchesCategory = (itemType.includes('sour') || itemType.includes('savory')) &&
        !itemType.includes('sweet');
    } else if (category === "promo") {
      matchesCategory = itemType.includes('promo');
    }

    return matchesSearch && matchesPrice && matchesCategory;
  }).sort((a, b) => {
    // Sort favorites first
    const aFav = isItemFavorite(getItemId(a));
    const bFav = isItemFavorite(getItemId(b));
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;

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
        onClose={handleModalClose}
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
                <span
                  className="text-sm text-muted-foreground truncate w-full hover:text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    const address = Array.isArray(selectedRestaurant) ? selectedRestaurant[1] : selectedRestaurant.address;
                    const city = Array.isArray(selectedRestaurant) ? selectedRestaurant[3] : selectedRestaurant.city;
                    openInMaps(address, city);
                  }}
                >
                  {Array.isArray(selectedRestaurant) ? `${selectedRestaurant[1]}, ${selectedRestaurant[3]}` : `${selectedRestaurant.address}, ${selectedRestaurant.city}`}
                </span>
              </div>
              <span className="text-sm text-primary whitespace-nowrap shrink-0">{t('menu.changeRestaurant')}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Category Buttons Row */}
      {selectedRestaurant && (
        <div className="container mx-auto px-4 my-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
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
              variant={category === "american" ? "default" : "outline"}
              onClick={() => setCategory("american")}
            >
              <span className="hidden sm:inline">American</span>
              <span className="sm:hidden">American</span>
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
              onClick={() => setCategory("deluxe")}
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredItems.map((item) => {
                const itemId = getItemId(item);
                const itemName = getItemName(item);
                const itemPrice = getItemPrice(item);
                const itemImage = getItemImage(item);

                return (
                  <Card key={itemId} className="flex flex-col overflow-hidden p-0">
                    <div className="w-full aspect-square relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                      <img
                        src={itemImage || '/elementor-placeholder-image.webp'}
                        alt={itemName}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                      />
                      {/* Hover overlay with expand icon */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <LuExpand className="h-6 w-6 text-white" />
                      </div>

                      {/* Labels/Badges */}
                      <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                        {getItemLabels(item).map((label, index) => (
                          <Badge
                            key={index}
                            variant={label === 'new' ? 'default' : label === 'popular' ? 'destructive' : 'secondary'}
                            className="shadow-sm capitalize"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(item);
                        }}
                        className="absolute top-2 right-2 z-20 bg-white/80 rounded-full p-1.5 hover:bg-white shadow transition-colors"
                        aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                          fill={isItemFavorite(itemId) ? 'red' : 'none'}
                        />
                      </button>
                    </div>

                    <CardContent className="flex flex-1 flex-col p-2.5 sm:p-3 gap-2">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight">{itemName}</h3>
                      <span className="font-bold text-sm sm:text-base text-primary">{formatDualCurrencyCompact(itemPrice)}</span>

                      <div className="flex flex-col gap-1.5 sm:gap-2 w-full mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleItemNavigation(item)}
                          className="w-full text-xs py-2 h-auto min-h-9 whitespace-normal"
                        >
                          {t('menu.options')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                          className="w-full text-xs py-2 h-auto min-h-9 whitespace-normal"
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
          <div className="container mx-auto px-4 py-8 pb-32">
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
                      <ToggleGroupItem value="american" aria-label="Show american items">
                        American
                      </ToggleGroupItem>
                      <ToggleGroupItem value="promo" aria-label="Show promotional items">
                        Promo
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>
              </div>

              {/* Menu Items Grid - Auto-responsive based on available space */}
              <div className="flex-1">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-6">
                  {filteredItems.map((item) => {
                    const itemId = getItemId(item);
                    const itemName = getItemName(item);
                    const itemPrice = getItemPrice(item);
                    const itemImage = getItemImage(item);
                    const itemDescription = getItemDescription(item);

                    return (
                      <Card key={itemId} className="flex flex-col h-full overflow-hidden p-0">
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

                          {/* Labels/Badges */}
                          <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
                            {getItemLabels(item).map((label, index) => (
                              <Badge
                                key={index}
                                variant={label === 'new' ? 'default' : label === 'popular' ? 'destructive' : 'secondary'}
                                className="shadow-md text-sm capitalize px-3 py-1"
                              >
                                {label}
                              </Badge>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(item);
                            }}
                            className="absolute top-3 right-3 z-20 bg-white/80 rounded-full p-2 hover:bg-white shadow transition-colors"
                            aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart
                              className={`h-5 w-5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                              fill={isItemFavorite(itemId) ? 'red' : 'none'}
                            />
                          </button>

                        </div>
                        <CardContent className="flex flex-col flex-grow p-4">
                          <h3 className="font-semibold mb-2 text-lg line-clamp-1">{itemName}</h3>
                          <p className="text-sm text-muted-foreground mb-3 flex-grow line-clamp-2">{itemDescription}</p>

                          <div className="flex flex-col gap-3 mt-auto">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xl text-primary">{formatDualCurrencyCompact(itemPrice)}</span>
                            </div>
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleItemNavigation(item)}
                                className="flex-1 h-auto min-h-9 whitespace-normal"
                              >
                                {t('menu.options')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                className="flex-1 h-auto min-h-9 whitespace-normal"
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
