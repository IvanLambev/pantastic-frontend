import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useState, useEffect } from "react"
import { CarouselDots } from "@/components/carousel-dots"
import Autoplay from "embla-carousel-autoplay"
import HowItWorks from "@/components/how-it-works"
import DeliveryPickupInfo from "@/components/delivery-pickup-info"
import FAQ from "@/components/faq"
import AboutUs from "@/components/about-us"
import { toast } from "sonner"
import RestaurantSelector from "@/components/ui/RestaurantSelector"
import { t } from "@/utils/translations"

const Home = () => {
  const [api, setApi] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const images = [
    "/pancake1.jpg",
    "/pancake2.jpg",
    "/pancake3.jpg"
  ]

  useEffect(() => {
    // Check if restaurant is already selected
    const selectedRestaurant = localStorage.getItem('selectedRestaurant')
    if (!selectedRestaurant) {
      setShowModal(true)
    }
  }, [])

  // Unified restaurant selection handler
  function selectRestaurant(restaurant) {
    localStorage.setItem('selectedRestaurant', JSON.stringify(restaurant));
    setShowModal(false);
    toast.dismiss();
    // Handle both array format and object format
    const restaurantName = Array.isArray(restaurant) ? restaurant[8] : restaurant.name;
    toast.success(t('home.restaurantSelected', { name: restaurantName }));
  }

  return (
    <>
      <RestaurantSelector
        open={showModal}
        onClose={() => setShowModal(false)}
        onSelect={selectRestaurant}
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
