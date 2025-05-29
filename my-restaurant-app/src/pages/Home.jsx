import { Card, CardContent } from "@/components/ui/card"
import { API_URL } from '@/config/api'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { CarouselDots } from "@/components/carousel-dots"
import Autoplay from "embla-carousel-autoplay"
import HowItWorks from "@/components/how-it-works"
import DeliveryPickupInfo from "@/components/delivery-pickup-info"
import FAQ from "@/components/faq"
import AboutUs from "@/components/about-us"

const Home = () => {
  const [api, setApi] = useState(null)
  const [showRestaurantModal, setShowRestaurantModal] = useState(true)
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const images = [
    "/pancake1.jpg",
    "/pancake2.jpg",
    "/pancake3.jpg"
  ]

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/restaurant/restaurants`)
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
    const selectedRestaurant = sessionStorage.getItem('selectedRestaurant')
    if (!selectedRestaurant) {
      fetchRestaurants()
    } else {
      setShowRestaurantModal(false)
    }
  }, [])

  const handleRestaurantSelect = (restaurant) => {
    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant))
    setShowRestaurantModal(false)
  }

  return (
    <>
      <Dialog open={showRestaurantModal} onOpenChange={setShowRestaurantModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto"> {/* Added max height and scroll */}
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select a Restaurant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {loading ? (
              <p className="text-center">Loading restaurants...</p>
            ) : error ? (
              <p className="text-red-500 text-center">{error}</p>
            ) : (
              restaurants.map((restaurant) => (
                <Button
                  key={restaurant[0]}
                  variant="outline"
                  className="w-full p-4 sm:p-6 h-auto hover:bg-gray-100"
                  onClick={() => handleRestaurantSelect(restaurant)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                    <div className="flex flex-col items-start gap-2 w-full sm:w-auto">
                      <span className="text-lg sm:text-xl font-bold text-left">{restaurant[6]}</span>
                      <span className="text-sm text-gray-500 text-left">{restaurant[1]}</span>
                    </div>
                    <div className="text-sm text-gray-600 text-left sm:text-right w-full sm:w-auto">
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

      <div className="w-full">
        <Carousel 
          plugins={[
            Autoplay({
              delay: 2000,
            }),
          ]} 
          className="w-full"
          setApi={setApi}
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <Card className="border-none">
                  <CardContent className="p-0">
                    <img 
                      src={image} 
                      alt={`Pancake ${index + 1}`}
                      className="w-full h-[30vh] md:h-[50vh] lg:h-[70vh] object-cover"
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots api={api} count={images.length} />
        </Carousel>
      </div>

      <div className="container mx-auto px-4 py-12 space-y-24">
        <HowItWorks />
        <DeliveryPickupInfo />
        <FAQ />
        <AboutUs />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {/* Restaurant cards will be displayed here */}
      </div>
    </>
  )
}

export default Home