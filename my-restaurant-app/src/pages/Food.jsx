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

const Food = () => {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(false)
  const [restaurantError, setRestaurantError] = useState(null)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)
  const { addToCart } = useCart()

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

  const handleRestaurantSelect = (restaurant) => {
    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant))
    setCurrentRestaurant(restaurant)
    setShowRestaurantModal(false)
    fetchItems(restaurant[0])
  }

  const fetchItems = async (restaurantId) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/restaurant/${restaurantId}/items`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch items")
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch items'
      console.error("Error fetching items:", err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const restaurantData = sessionStorage.getItem("selectedRestaurant")
    if (!restaurantData) {
      setShowRestaurantModal(true)
      fetchRestaurants()
    } else {
      const restaurant = JSON.parse(restaurantData)
      setCurrentRestaurant(restaurant)
      fetchItems(restaurant[0])
    }
  }, [])

  const handleChangeRestaurant = () => {
    fetchRestaurants()
    setShowRestaurantModal(true)
  }

  const handleAddToCart = (item) => {
    addToCart({
      id: item[0],
      name: item[4],
      description: item[2],
      price: item[5],
      image: item[3]
    })
    toast.success(`Added ${item[4]} to cart`)
  }

  if (loading && !showRestaurantModal) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error && !showRestaurantModal) {
    return <div className="text-center text-red-500 p-4">{error}</div>
  }

  return (
    <>
      <Dialog open={showRestaurantModal} onOpenChange={setShowRestaurantModal}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select a Restaurant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loadingRestaurants ? (
              <p className="text-center">Loading restaurants...</p>
            ) : restaurantError ? (
              <p className="text-red-500 text-center">{restaurantError}</p>
            ) : (
              restaurants.map((restaurant) => (
                <Button
                  key={restaurant[0]}
                  variant="outline"
                  className="w-full p-6 h-auto hover:bg-gray-100"
                  onClick={() => handleRestaurantSelect(restaurant)}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-xl font-bold text-left">{restaurant[6]}</span>
                      <span className="text-sm text-gray-500 text-left">{restaurant[1]}</span>
                    </div>
                    <div className="text-sm text-gray-600 text-right">
                      {Object.entries(restaurant[7]).map(([day, hours]) => (
                        <div key={day} className="whitespace-nowrap">
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

      <div className="container mx-auto px-4 py-8 mt-16 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left mb-2">
              {currentRestaurant && currentRestaurant[6]}
            </h1>
            <p className="text-gray-500 text-center md:text-left text-sm md:text-base">
              {currentRestaurant && currentRestaurant[1]}
            </p>
          </div>
          <Button
            onClick={() => setShowRestaurantModal(true)}
            variant="outline"
            className="mt-4 md:mt-0"
          >
            Change Restaurant
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item[0]} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={item[3] || '/elementor-placeholder-image.webp'}
                  alt={item[4]}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold mb-2">{item[4]}</h3>
                  <p className="text-sm text-gray-600 mb-4 flex-grow">{item[2]}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">${Number(item[5]).toFixed(2)}</span>
                    <Button onClick={() => handleAddToCart(item)} size="sm">
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

export default Food