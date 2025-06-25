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
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/utils"

const Food = () => {
  const navigate = useNavigate()
  const [showCityModal, setShowCityModal] = useState(true)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [restaurantId, setRestaurantId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState([])
  const [priceRange, setPriceRange] = useState([0, 100])
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("default")
  const { addToCart } = useCart()
  const isMobile = window.innerWidth <= 768

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
      const restaurant = JSON.parse(savedRestaurant)
      setSelectedRestaurant(restaurant)
      setSelectedCity(restaurant[2]) // Set the city from the saved restaurant
      setShowCityModal(false)
      setShowRestaurantModal(false)
      fetchItems(restaurant[0])
    } else {
      fetchRestaurants()
      setShowCityModal(true)
    }
  }, [])

  // Get unique cities from restaurants
  const cities = [...new Set(restaurants.map(restaurant => restaurant[2]))].sort()

  // Filter restaurants by selected city
  const filteredRestaurants = selectedCity 
    ? restaurants.filter(restaurant => restaurant[2] === selectedCity)
    : restaurants

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setShowCityModal(false);
    setShowRestaurantModal(true);
  };

  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant)
    setRestaurantId(restaurant[0])
    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant))
    setShowRestaurantModal(false)
    fetchItems(restaurant[0])
  }
  
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

  const handleBackToCity = () => {
    setShowRestaurantModal(false)
    setShowCityModal(true)
    setSelectedCity(null)
  }

  const fetchItems = async (restaurantId) => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`)
      if (!response.ok) {
        throw new Error('Failed to fetch menu items')
      }
      const data = await response.json()
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
      name: item[4],
      price: item[5],
      image: item[3],
      description: item[2],
      quantity: 1
    })
    toast.success(`Added ${item[4]} to cart`)
  }

  // Add filtered and sorted items logic
  const filteredItems = items.filter(item => {
    const matchesSearch = (item[4]?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item[2]?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    const matchesPrice = Number(item[5]) >= priceRange[0] && Number(item[5]) <= priceRange[1]
    const matchesCategory = category === "all" || item[6] === category
    return matchesSearch && matchesPrice && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return Number(a[5]) - Number(b[5])
      case "price-high":
        return Number(b[5]) - Number(a[5])
      case "most-ordered":
        return (b[7] || 0) - (a[7] || 0)
      default:
        return 0
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
      {/* City Selection Modal */}
      <Dialog open={showCityModal} onOpenChange={setShowCityModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select a City</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">            {loading ? (
              <p className="text-center">Loading cities...</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              cities.map((city) => (
                <Button
                  key={city}
                  variant="outline"
                  className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100"
                  onClick={() => handleCitySelect(city)}
                >
                  <span className="text-lg sm:text-xl font-bold">{city}</span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Restaurant Selection Modal */}
      <Dialog open={showRestaurantModal} onOpenChange={setShowRestaurantModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              Select a Restaurant in {selectedCity}
            </DialogTitle>
            <Button 
              variant="outline" 
              onClick={handleBackToCity}
            >
              Change City
            </Button>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loading ? (
              <p className="text-center">Loading restaurants...</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              filteredRestaurants.map((restaurant) => (
                <Button
                  key={restaurant[0]}
                  variant="outline"
                  className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100"
                  onClick={() => handleRestaurantSelect(restaurant)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                    <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
                      <span className="text-lg sm:text-xl font-bold text-left">{restaurant[7]}</span>
                      <span className="text-sm text-gray-500 text-left">{restaurant[1]}</span>
                    </div>
                    <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto">
                      {Object.entries(restaurant[8]).map(([day, hours]) => (
                        <div key={day} className="whitespace-nowrap">
                          <span className="font-medium">{day}:</span> {hours}
                        </div>
                      ))}
                    </div>
                  </div>
                </Button>
              ))
            )}          </div>
        </DialogContent>
      </Dialog>

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
                  <div className="w-24 h-full">
                    <img
                      src={item[3] || '/elementor-placeholder-image.webp'}
                      alt={item[4]}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="flex flex-1 justify-between items-center p-3">                    <div className="flex flex-col justify-center">
                      <h3 className="font-semibold text-sm">{item[4]}</h3>
                      <span className="font-semibold text-sm">${Number(item[5]).toFixed(2)}</span>
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
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
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
                          src={item[3] || '/elementor-placeholder-image.webp'}
                          alt={item[4]}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex flex-col flex-grow p-4">
                        <h3 className="font-semibold mb-2">{item[4]}</h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-grow">{item[2]}</p>
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">${Number(item[5]).toFixed(2)}</span>
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