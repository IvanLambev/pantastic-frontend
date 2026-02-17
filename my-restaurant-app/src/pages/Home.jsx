import { useState, useEffect } from "react"
import { toast } from "sonner"
import RestaurantSelector from "@/components/ui/RestaurantSelector"
import { t } from "@/utils/translations"
import { HeroCarousel } from "@/components/hero-carousel"
import { CollectionSection } from "@/components/collection-section"
import HowItWorks from "@/components/how-it-works"
import DeliveryPickupInfo from "@/components/delivery-pickup-info"
import FAQ from "@/components/faq"
import AboutUs from "@/components/about-us"

import { CategoryGrid } from "@/components/CategoryGrid"

const Home = () => {
  const [showModal, setShowModal] = useState(false)

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

      <HeroCarousel />

      <CategoryGrid />

      {/* Collection Section 1 - First collection */}
      <CollectionSection
        restaurantId="8511b497-1275-4325-b723-5848c2b6f9d8"
        collectionIndex={0}
        title={t('home.featuredItems')}
        subtitle={t('home.featuredItemsDesc')}
        limit={4}
      />

      {/* Collection Section 2 - Second collection */}
      <CollectionSection
        restaurantId="8511b497-1275-4325-b723-5848c2b6f9d8"
        collectionIndex={1}
        limit={4}
      />

      {/* Collection Section 3 - Third collection */}
      <CollectionSection
        restaurantId="8511b497-1275-4325-b723-5848c2b6f9d8"
        collectionIndex={2}
        limit={4}
      />

      {/* Collection Section 4 - Fourth collection */}
      <CollectionSection
        restaurantId="8511b497-1275-4325-b723-5848c2b6f9d8"
        collectionIndex={3}
        limit={4}
      />

      <div className="container mx-auto px-4 py-12 space-y-24">
        <HowItWorks />
        <DeliveryPickupInfo />
        <FAQ />
        <AboutUs />
      </div>
    </>
  )
}

export default Home
