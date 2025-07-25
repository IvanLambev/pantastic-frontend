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
import { fetchWithAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import RestaurantSelector from "@/components/ui/RestaurantSelector"

const Home = () => {
  const [api, setApi] = useState(null)
  const [showCityModal, setShowCityModal] = useState(true)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [restaurants, setRestaurants] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)
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
    const selectedRestaurant = sessionStorage.getItem('selectedRestaurant')
    if (!selectedRestaurant) {
      fetchRestaurants()
    } else {
      setShowCityModal(false)
      setShowRestaurantModal(false)
    }
  }, [])

  // Unified restaurant selection handler
  function selectRestaurant(restaurant) {
    sessionStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    setShowCityModal(false);
    setShowRestaurantModal(false);
    toast.dismiss();
    toast.success(`You selected restaurant: ${restaurant[7]}`);
    // LOG: Home selectRestaurant called
   // console.log('[SONNER] Home selectRestaurant called for', restaurant[7]);
  }

  return (
    <>
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