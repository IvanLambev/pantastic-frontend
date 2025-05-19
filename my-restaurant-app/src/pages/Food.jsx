import { useEffect, useState } from "react"
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

const Food = () => {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [restaurantError, setRestaurantError] = useState(null)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 100])
  const [category, setCategory] = useState("all")
  const [sortBy, setSortBy] = useState("default")
  
  const { addToCart } = useCart()

  useEffect(() => {
    const savedRestaurant = sessionStorage.getItem('selectedRestaurant')
    if (savedRestaurant) {
      const restaurant = JSON.parse(savedRestaurant)
      setCurrentRestaurant(restaurant)
      fetchItems(restaurant[0])
    } else {
      setShowRestaurantModal(true)
      fetchRestaurants()
    }
  }, [])

  const fetchRestaurants = async () => {
    setLoadingRestaurants(true)
    try {
      const response = await fetch(`${API_URL}/restaurant/restaurants`)
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }
      const data = await response.json()
      setRestaurants(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants'
      setRestaurantError(errorMessage)
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoadingRestaurants(false)
    }
  }

  const fetchItems = async (restaurantId) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/restaurant/${restaurantId}/items`)
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

  const handleRestaurantSelect = (restaurant) => {
    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant))
    setCurrentRestaurant(restaurant)
    setShowRestaurantModal(false)
    fetchItems(restaurant[0])
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

  const isMobile = window.innerWidth <= 768;

  if (loading && !showRestaurantModal) {
    return <div className="min-h-[calc(100vh-4rem)] text-center p-4 pb-32">Loading...</div>
  }

  if (error && !showRestaurantModal) {
    return <div className="min-h-[calc(100vh-4rem)] text-center text-red-500 p-4 pb-32">{error}</div>
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background min-w-[100vw]">
      {isMobile ? (
        <div className="container mx-auto px-4 py-8">
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
        </div>
      ) : (
        <>
          <Dialog open={showRestaurantModal} onOpenChange={setShowRestaurantModal}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Select a Restaurant</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {loadingRestaurants ? (
                  <div className="text-center col-span-2">Loading restaurants...</div>
                ) : restaurantError ? (
                  <div className="text-center text-red-500 col-span-2">{restaurantError}</div>
                ) : (
                  restaurants.map((restaurant) => (
                    <Button
                      key={restaurant[0]}
                      variant="outline"
                      className="h-full p-4 flex flex-col items-start justify-start"
                      onClick={() => handleRestaurantSelect(restaurant)}
                    >
                      <div className="text-left">
                        <h3 className="font-semibold mb-2">{restaurant[6]}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{restaurant[1]}</p>
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          {Object.entries(restaurant[7] || {}).map(([day, hours]) => (
                            <div key={day} className="flex justify-between">
                              <span className="font-medium">{day}:</span> {hours}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">                  {filteredItems.map((item) => (
                    <Card key={item[0]} className="flex flex-col h-full overflow-hidden">
                      <div className="relative p-1">
                        <img
                          src={item[3] || '/elementor-placeholder-image.webp'}
                          alt={item[4]}
                          className="w-full h-full object-cover max-w-[250px] max-h-[125px] mx-auto transition-transform duration-200 hover:scale-[1.01]"
                        />
                      </div>
                      <CardContent className="flex flex-col flex-grow p-3">
                        <h3 className="font-semibold mb-1 items-start">{item[4]}</h3>
                        <p className="text-sm text-muted-foreground mb-3 flex-grow">{item[2]}</p>
                        <div className="flex justify-between items-start">
                          <span className="font-semibold">${Number(item[5]).toFixed(2)}</span>
                          <Button size="sm" onClick={() => handleAddToCart(item)}>
                            Add to Cart
                          </Button>
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