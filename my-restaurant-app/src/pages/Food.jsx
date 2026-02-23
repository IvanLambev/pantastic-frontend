import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from '@/config/api'
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { IoCartOutline } from "react-icons/io5"
import { LuExpand } from "react-icons/lu"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/context/AuthContext";
import RestaurantSelector from "@/components/ui/RestaurantSelector";
import { DeluxeBoxModal } from "@/components/DeluxeBoxModal";
import { convertBgnToEur, formatDualCurrencyCompact } from "@/utils/currency"
import { t, translateLabel, translateDynamicLabel } from "@/utils/translations"
import { openInMaps } from "@/utils/mapsHelper"
import { selectRestaurantWithFallback, isRestaurantOpen, parseOpeningHours, getNextOpenTime } from "@/utils/ipGeolocation"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [category, setCategory] = useState("sweet")
  const [sortBy, setSortBy] = useState("default")
  const { addToCart, clearCart } = useCart()
  const isMobile = window.innerWidth <= 768
  const [favoriteItems, setFavoriteItems] = useState([])
  const [canFavorite, setCanFavorite] = useState(false)
  const [nearestOpenRestaurant, setNearestOpenRestaurant] = useState(null)
  const [searchingForOpen, setSearchingForOpen] = useState(false)
  const [showDeluxeBoxModal, setShowDeluxeBoxModal] = useState(false)
  const [selectedDeluxeBoxItem, setSelectedDeluxeBoxItem] = useState(null)

  // Helper to calculate distance between two coordinates (Haversine formula)
  function getDistance(lat1, lon1, lat2, lon2) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Find nearest open restaurant within 10km
  const findNearestOpenRestaurant = async () => {
    if (!selectedRestaurant || !restaurants.length) return;
    
    setSearchingForOpen(true);
    const currentRestaurantLat = Array.isArray(selectedRestaurant) ? selectedRestaurant[4] : selectedRestaurant.latitude;
    const currentRestaurantLng = Array.isArray(selectedRestaurant) ? selectedRestaurant[5] : selectedRestaurant.longitude;
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const restaurant of restaurants) {
      const restId = Array.isArray(restaurant) ? restaurant[0] : restaurant.restaurant_id;
      const currentId = Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant.restaurant_id;
      
      if (restId === currentId) continue; // Skip current restaurant
      
      if (isRestaurantOpen(restaurant)) {
        const restLat = Array.isArray(restaurant) ? restaurant[4] : restaurant.latitude;
        const restLng = Array.isArray(restaurant) ? restaurant[5] : restaurant.longitude;
        
        const distance = getDistance(currentRestaurantLat, currentRestaurantLng, restLat, restLng);
        
        if (distance <= 10 && distance < minDistance) {
          minDistance = distance;
          nearest = restaurant;
        }
      }
    }
    
    setNearestOpenRestaurant(nearest);
    setSearchingForOpen(false);
    
    if (!nearest) {
      toast.info(t('menu.noOpenRestaurantsNearby') + '. ' + t('menu.tryAgainLater'));
    }
  };

  // Get current opening hours for display
  const getCurrentOpeningHours = () => {
    if (!selectedRestaurant) return null;
    
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const eetTime = new Date(utc + 2 * 3600000);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const daysInBulgarian = ["Неделя", "Понеделник", "Вторник", "Сряда", "Четвъртък", "Петък", "Събота"];
    const currentDay = days[eetTime.getDay()];
    const currentDayBulgarian = daysInBulgarian[eetTime.getDay()];
    
    const hours = parseOpeningHours(Array.isArray(selectedRestaurant) ? selectedRestaurant[6] : selectedRestaurant.opening_hours);
    const todayHours = hours[currentDay];
    
    return {
      day: currentDayBulgarian,
      hours: todayHours || t('menu.closed')
    };
  };

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

  // Check if selected restaurant is open on mount and periodically
  useEffect(() => {
    if (!selectedRestaurant || !restaurants.length) return;
    
    const checkRestaurantStatus = () => {
      const isOpen = isRestaurantOpen(selectedRestaurant);
      
      if (!isOpen) {
        console.log('[Restaurant Status] Selected restaurant is currently closed');
        // Check if there's a nearby open restaurant
        const currentRestaurantLat = Array.isArray(selectedRestaurant) ? selectedRestaurant[4] : selectedRestaurant.latitude;
        const currentRestaurantLng = Array.isArray(selectedRestaurant) ? selectedRestaurant[5] : selectedRestaurant.longitude;
        
        let nearest = null;
        let minDistance = Infinity;
        
        for (const restaurant of restaurants) {
          const restId = Array.isArray(restaurant) ? restaurant[0] : restaurant.restaurant_id;
          const currentId = Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant.restaurant_id;
          
          if (restId === currentId) continue;
          
          if (isRestaurantOpen(restaurant)) {
            const restLat = Array.isArray(restaurant) ? restaurant[4] : restaurant.latitude;
            const restLng = Array.isArray(restaurant) ? restaurant[5] : restaurant.longitude;
            
            const distance = getDistance(currentRestaurantLat, currentRestaurantLng, restLat, restLng);
            
            if (distance <= 10 && distance < minDistance) {
              minDistance = distance;
              nearest = restaurant;
            }
          }
        }
        
        if (nearest) {
          setNearestOpenRestaurant(nearest);
        }
      }
    };
    
    checkRestaurantStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkRestaurantStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedRestaurant, restaurants]);

  // Fetch favorite items on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const hasCustomer = Boolean(user.customer_id);
      setCanFavorite(hasCustomer);
      if (!hasCustomer) return;
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

        toast.info(t('menu.autoSelected', { name: restaurantName }));
      }
    }
  }

  const fetchItems = async (restaurantId) => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`, {
        credentials: 'include', // Send HttpOnly cookies for personalization
      })
      if (!response.ok) {
        throw new Error('Failed to fetch menu items')
      }
      const data = await response.json()
      console.log('Fetched menu items:', data)
      
      // Handle both array format (non-personalized) and object format (personalized)
      const itemsArray = Array.isArray(data) ? data : (data.items || [])
      setItems(itemsArray)

      // Calculate dynamic price range: 3 EUR below cheapest and 3 EUR above most expensive
      if (itemsArray && itemsArray.length > 0) {
        const prices = itemsArray.map(item => {
          const price = Array.isArray(item) ? Number(item[8]) || 0 : Number(item.price) || 0;
          return convertBgnToEur(price);
        });
        const cheapest = Math.min(...prices);
        const mostExpensive = Math.max(...prices);
        const minPriceValue = Math.max(0, cheapest - 3);
        const maxPriceValue = mostExpensive + 3;
        setMinPrice(minPriceValue);
        setMaxPrice(maxPriceValue);
        setPriceRange([minPriceValue, maxPriceValue]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch menu items'
      setError(errorMessage)
      console.error('Error fetching menu items:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item) => {
    // Check if it's a deluxe box item
    const itemType = getItemType(item);
    if (itemType === 'deluxe_box') {
      // Open modal for deluxe box items
      setSelectedDeluxeBoxItem(item);
      setShowDeluxeBoxModal(true);
      return;
    }

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
    toast.success(t('menu.addedToCart', { name: itemData.name }))
  }

  const handleItemNavigation = (item) => {
    const itemType = getItemType(item);
    
    // If it's a deluxe box, navigate to the deluxe box page
    if (itemType === 'deluxe_box') {
      const restaurantId = Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant?.restaurant_id;
      const itemData = encodeURIComponent(JSON.stringify(item));
      navigate(`/deluxe-box?restaurantId=${restaurantId}&item=${itemData}`);
      return;
    }
    
    // For regular items, navigate to item details
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
  const getDynamicLabels = (item) => Array.isArray(item) ? [] : (item.dynamic_labels || []);



  const isItemFavorite = (itemId) => favoriteItems.some(f => f.item_id === itemId);
  const getFavoriteId = (itemId) => {
    const fav = favoriteItems.find(f => f.item_id === itemId);
    return fav ? (fav.id || fav.favourite_id || fav._id) : null;
  };

  const handleToggleFavorite = async (item) => {
    const itemId = getItemId(item);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.customer_id) {
      toast.info(t('menu.loginToFavorite') || 'Влезте, за да добавите любими.');
      return;
    }
    if (!isItemFavorite(itemId)) {
      const restaurantId = Array.isArray(selectedRestaurant)
        ? selectedRestaurant[0]
        : selectedRestaurant?.restaurant_id;

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
    const isDeluxe = itemType === 'deluxe_box';

    // Deluxe items should ONLY appear in the deluxe category
    if (isDeluxe && category !== "deluxe") return false;

    let matchesCategory = false;
    if (category === "deluxe") {
      matchesCategory = isDeluxe;
    } else if (category === "all") {
      matchesCategory = !isDeluxe;
    } else if (category === "sweet") {
      matchesCategory = itemType === 'sweet-classic';
    } else if (category === "american") {
      matchesCategory = itemType === 'sweet-american';
    } else if (category === "american-mini") {
      matchesCategory = itemType === 'sweet-american-mini';
    } else if (category === "savory") {
      // Strict filtering for savory/sour
      matchesCategory = (itemType.includes('sour') || itemType.includes('savory')) &&
        !itemType.includes('sweet');
    } else if (category === "drinks") {
      matchesCategory = itemType === 'misc';
    }

    return matchesSearch && matchesPrice && matchesCategory;
  }).sort((a, b) => {
    // Sort items with dynamic labels first (personalized recommendations)
    const aDynamic = getDynamicLabels(a).length > 0;
    const bDynamic = getDynamicLabels(b).length > 0;
    if (aDynamic && !bDynamic) return -1;
    if (!aDynamic && bDynamic) return 1;

    // Then sort favorites
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
            <div 
              className="w-full min-h-[5rem] flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 p-4 border rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer"
              onClick={handleChangeSelection}
            >
              {/* Restaurant Info - Left Aligned */}
              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-bold text-lg truncate w-full text-left">
                  {Array.isArray(selectedRestaurant) ? selectedRestaurant[8] : selectedRestaurant.name}
                </span>
                <span
                  className="text-sm text-muted-foreground truncate w-full hover:text-blue-600 hover:underline cursor-pointer text-left"
                  onMouseEnter={(e) => {
                    // Only show hover effect without opening maps on hover
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
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
              
              {/* Opening Hours Status - Center Aligned */}
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <div 
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium text-center min-w-[160px] cursor-help transition-colors",
                        isRestaurantOpen(selectedRestaurant)
                          ? "bg-green-100/80 text-green-800 hover:bg-green-100"
                          : "bg-red-100/80 text-red-800 hover:bg-red-100"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRestaurantOpen(selectedRestaurant)) {
                          findNearestOpenRestaurant();
                        }
                      }}
                    >
                      {(() => {
                        const openingInfo = getCurrentOpeningHours();
                        if (!openingInfo) return t('menu.loading');
                        
                        if (isRestaurantOpen(selectedRestaurant)) {
                          return (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="font-bold">{t('menu.open')}</span>
                              </div>
                              <span className="text-xs">{openingInfo.day}: {openingInfo.hours}</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="font-bold">{t('menu.closed')}</span>
                              </div>
                              <span className="text-xs">{openingInfo.day}: {openingInfo.hours}</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-sm p-4 bg-white text-black border border-gray-200">
                    {isRestaurantOpen(selectedRestaurant) ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                          <p className="font-semibold text-green-700">{t('menu.open')}</p>
                        </div>
                        <p className="text-sm text-black">
                          {(() => {
                            const openingInfo = getCurrentOpeningHours();
                            return `${t('menu.today')}: ${openingInfo?.hours || t('menu.closed')}`;
                          })()}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <p className="font-semibold text-red-700">{t('menu.restaurantClosed')}</p>
                        </div>
                        <p className="text-sm">
                          {t('menu.nextOpening')}: {getNextOpenTime(restaurants) || t('menu.tryAgainLater')}
                        </p>
                        {searchingForOpen ? (
                          <p className="text-xs text-muted-foreground mt-2">{t('menu.findingNearestOpen')}</p>
                        ) : nearestOpenRestaurant ? (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs font-medium mb-2">Най-близък отворен ресторант:</p>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectRestaurant(nearestOpenRestaurant);
                                setNearestOpenRestaurant(null);
                              }}
                            >
                              {Array.isArray(nearestOpenRestaurant) ? nearestOpenRestaurant[8] : nearestOpenRestaurant.name}
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            Кликнете за намиране на отворен ресторант в радиус 10 км
                          </p>
                        )}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Change Restaurant Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeSelection();
                }}
                className="whitespace-nowrap shrink-0"
              >
                {t('menu.changeRestaurant')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Category Buttons Row */}
      {selectedRestaurant && (
        <div className="container mx-auto px-4 my-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
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
              variant={category === "american" ? "default" : "outline"}
              onClick={() => setCategory("american")}
            >
              <span className="hidden lg:inline">{t('menu.americanPancakes')}</span>
              <span className="lg:hidden">{t('menu.american')}</span>
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl whitespace-normal leading-tight"
              variant={category === "american-mini" ? "default" : "outline"}
              onClick={() => setCategory("american-mini")}
            >
              <span className="hidden lg:inline">{t('menu.americanMiniPancakes')}</span>
              <span className="lg:hidden">{t('menu.americanMini')}</span>
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
              variant={category === "deluxe" ? "default" : "outline"}
              style={{ letterSpacing: 1 }}
              onClick={() => setCategory("deluxe")}
            >
              DELUXE BOX
            </Button>
            <Button
              className="text-sm lg:text-lg py-6 lg:py-8 font-bold rounded-xl"
              variant={category === "drinks" ? "default" : "outline"}
              onClick={() => setCategory("drinks")}
            >
              {t('menu.drinks')}
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

                const dynamicLabels = getDynamicLabels(item);
                const hasDynamicLabels = dynamicLabels.length > 0;

                if (hasDynamicLabels) {
                  return (
                    <div key={itemId} className="relative">
                      {/* Dynamic Label Text on Top */}
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 bg-background px-1">
                        <span className="text-xs font-semibold text-gray-700 transition-colors group-hover:text-orange-500 whitespace-nowrap">
                          {translateDynamicLabel(dynamicLabels[0])}
                        </span>
                      </div>
                      {/* Dashed Border Wrapper */}
                      <div 
                        className="border-2 border-dashed rounded-lg p-1 transition-colors group mt-2"
                        style={{ borderColor: 'rgb(156 163 175)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(249 115 22)';
                          const label = e.currentTarget.parentElement?.querySelector('span');
                          if (label) label.style.color = 'rgb(249 115 22)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgb(156 163 175)';
                          const label = e.currentTarget.parentElement?.querySelector('span');
                          if (label) label.style.color = 'rgb(55 65 81)';
                        }}
                      >
                        <Card className="flex flex-col overflow-hidden p-0">
                          <div className="w-full aspect-square relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                            <img
                              src={itemImage || '/elementor-placeholder-image.webp'}
                              alt={itemName}
                              className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                            />
                            {/* Hover overlay with expand icon */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
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
                                  {translateLabel(label)}
                                </Badge>
                              ))}
                            </div>

                            {canFavorite && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(item);
                                }}
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "icon" }),
                                  "absolute top-2 right-2 z-30 bg-white/90 text-gray-400 hover:text-red-500/80 rounded-full border border-white/70 shadow-md transition-colors p-1.5 pointer-events-auto"
                                )}
                                aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                                  fill={isItemFavorite(itemId) ? 'red' : 'none'}
                                />
                              </button>
                            )}
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
                      </div>
                    </div>
                  );
                }

                // Regular card without dynamic labels
                return (
                  <div key={itemId} className="relative">
                    {/* Wrapper with same padding as cards with labels */}
                    <div className="rounded-lg p-1 mt-2">
                      <Card className="flex flex-col overflow-hidden p-0">
                        <div className="w-full aspect-square relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                          <img
                            src={itemImage || '/elementor-placeholder-image.webp'}
                            alt={itemName}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                      />
                      {/* Hover overlay with expand icon */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
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
                            {translateLabel(label)}
                          </Badge>
                        ))}
                      </div>

                      {canFavorite && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(item);
                          }}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "icon" }),
                            "absolute top-2 right-2 z-30 bg-white/90 text-gray-400 hover:text-red-500/80 rounded-full border border-white/70 shadow-md transition-colors p-1.5 pointer-events-auto"
                          )}
                          aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                            fill={isItemFavorite(itemId) ? 'red' : 'none'}
                          />
                        </button>
                      )}
                    </div>

                    <CardContent className="flex flex-1 flex-col p-2.5 sm:p-3 gap-2">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-3 leading-tight text-left">{itemName}</h3>
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
                </div>
              </div>
          );
        })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 py-8 pb-32">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Filter Sidebar - Desktop Only - LEFT SIDE */}
              <div className="w-64 shrink-0">
                <Card className="sticky top-4 p-5">
                  <div className="space-y-5">
                    {/* Search */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t('menu.search')}</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('menu.searchPlaceholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 h-9"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Price Range */}
                        {/*
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">{t('menu.priceRange')}</Label>
                          <div className="pt-2">
                            <Slider
                              min={minPrice}
                              max={maxPrice}
                              step={1}
                              value={priceRange}
                              onValueChange={setPriceRange}
                              className="mb-3"
                            />
                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                              <div className="flex justify-between">
                                <span>{Math.round(priceRange[0])} €</span>
                                <span>{Math.round(priceRange[1])} €</span>
                              </div>
                              <div className="flex justify-between">
                                <span>{Math.round(priceRange[0] / 0.51)} лв</span>
                                <span>{Math.round(priceRange[1] / 0.51)} лв</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        */}

                    <Separator />

                    {/* Sort By */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">{t('menu.sortBy')}</Label>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">{t('menu.default')}</SelectItem>
                          <SelectItem value="price-low">{t('menu.priceLowToHigh')}</SelectItem>
                          <SelectItem value="price-high">{t('menu.priceHighToLow')}</SelectItem>
                          <SelectItem value="most-ordered">{t('menu.mostOrdered')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results Count */}
                    <div className="pt-2 text-xs text-muted-foreground text-center">
                      {filteredItems.length} {filteredItems.length === 1 ? t('menu.item') : t('menu.items')}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Menu Items Grid - Auto-responsive based on available space */}
              <div className="flex-1">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-6">
                  {filteredItems.map((item) => {
                    const itemId = getItemId(item);
                    const itemName = getItemName(item);
                    const itemPrice = getItemPrice(item);
                    const itemImage = getItemImage(item);
                    const dynamicLabels = getDynamicLabels(item);
                    const hasDynamicLabels = dynamicLabels.length > 0;

                    if (hasDynamicLabels) {
                      return (
                        <div key={itemId} className="relative h-full">
                          {/* Dynamic Label Text on Top */}
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 bg-background px-1.5">
                            <span className="text-sm font-semibold text-gray-700 transition-colors">
                              {translateDynamicLabel(dynamicLabels[0])}
                            </span>
                          </div>
                          {/* Dashed Border Wrapper */}
                          <div 
                            className="border-2 border-dashed rounded-lg p-1 h-full transition-colors mt-3"
                            style={{ borderColor: 'rgb(156 163 175)' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'rgb(249 115 22)';
                              const label = e.currentTarget.parentElement?.querySelector('span');
                              if (label) label.style.color = 'rgb(249 115 22)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'rgb(156 163 175)';
                              const label = e.currentTarget.parentElement?.querySelector('span');
                              if (label) label.style.color = 'rgb(55 65 81)';
                            }}
                          >
                            <Card className="flex flex-col h-full overflow-hidden p-0">
                              <div className="aspect-video relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                                <img
                                  src={itemImage || '/elementor-placeholder-image.webp'}
                                  alt={itemName}
                                  className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                                />
                                {/* Hover overlay with expand icon */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
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
                                      {translateLabel(label)}
                                    </Badge>
                                  ))}
                                </div>

                                {canFavorite && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleFavorite(item);
                                    }}
                                    className={cn(
                                      buttonVariants({ variant: "ghost", size: "icon" }),
                                      "absolute top-3 right-3 z-30 bg-white/90 text-gray-400 hover:text-red-500/80 rounded-full border border-white/70 shadow-lg transition-colors p-2 pointer-events-auto"
                                    )}
                                    aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                                  >
                                    <Heart
                                      className={`h-5 w-5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                                      fill={isItemFavorite(itemId) ? 'red' : 'none'}
                                    />
                                  </button>
                                )}
                              </div>
                              
                              <CardContent className="flex flex-col flex-grow p-4">
                                <h3 className="font-semibold mb-2 text-lg line-clamp-3 text-left">{itemName}</h3>

                                <div className="flex flex-col gap-3 mt-auto">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-xl text-primary">{formatDualCurrencyCompact(itemPrice)}</span>
                                  </div>
                                  <div className="flex gap-2 w-full">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleItemNavigation(item)}
                                      className="h-auto min-h-9 whitespace-normal"
                                      style={{ width: '35%' }}
                                    >
                                      {t('menu.options')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(item)}
                                      className="h-auto min-h-9 whitespace-normal flex items-center justify-center gap-2"
                                      style={{ width: '65%' }}
                                    >
                                      <IoCartOutline className="h-4 w-4" />
                                      {t('menu.addToCart')}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      );
                    }

                    // Regular card without dynamic labels
                    return (
                      <div key={itemId} className="relative h-full">
                        {/* Wrapper with same padding as cards with labels */}
                        <div className="rounded-lg p-1 h-full mt-3" style={{ height: 'calc(100% - 1rem)' }}>
                          <Card className="flex flex-col h-full overflow-hidden p-0">
                            <div className="aspect-video relative group cursor-pointer" onClick={() => handleItemNavigation(item)}>
                              <img
                                src={itemImage || '/elementor-placeholder-image.webp'}
                                alt={itemName}
                            className="w-full h-full object-cover transition-all duration-300 group-hover:blur-sm"
                          />
                          {/* Hover overlay with expand icon */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
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
                                {translateLabel(label)}
                              </Badge>
                            ))}
                          </div>

                          {canFavorite && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(item);
                              }}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "icon" }),
                                "absolute top-3 right-3 z-30 bg-white/90 text-gray-400 hover:text-red-500/80 rounded-full border border-white/70 shadow-lg transition-colors p-2 pointer-events-auto"
                              )}
                              aria-label={isItemFavorite(itemId) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart
                                className={`h-5 w-5 ${isItemFavorite(itemId) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                                fill={isItemFavorite(itemId) ? 'red' : 'none'}
                              />
                            </button>
                          )}

                        </div>
                        <CardContent className="flex flex-col flex-grow p-4">
                          <h3 className="font-semibold mb-2 text-lg line-clamp-3 text-left">{itemName}</h3>

                          <div className="flex flex-col gap-3 mt-auto">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xl text-primary">{formatDualCurrencyCompact(itemPrice)}</span>
                            </div>
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleItemNavigation(item)}
                                className="h-auto min-h-9 whitespace-normal"
                                style={{ width: '35%' }}
                              >
                                {t('menu.options')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                className="h-auto min-h-9 whitespace-normal flex items-center justify-center gap-2"
                                style={{ width: '65%' }}
                              >
                                <IoCartOutline className="h-4 w-4" />
                                {t('menu.addToCart')}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
              );
            })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deluxe Box Modal */}
      {selectedDeluxeBoxItem && (
        <DeluxeBoxModal
          isOpen={showDeluxeBoxModal}
          onClose={() => {
            setShowDeluxeBoxModal(false);
            setSelectedDeluxeBoxItem(null);
          }}
          item={selectedDeluxeBoxItem}
          restaurantId={Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant?.restaurant_id}
          onAddToCart={(cartItem) => {
            addToCart(cartItem);
            toast.success(t('menu.addedToCart', { name: cartItem.name }));
          }}
        />
      )}

    </div>
  )
}

export default Food
