import { useState, useEffect } from "react"
import { toast } from "sonner"
import RestaurantSelector from "@/components/ui/RestaurantSelector"
import { t } from "@/utils/translations"
import { HeroCarousel } from "@/components/hero-carousel"
import { MenuItemsGrid } from "@/components/menu-items-grid"

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

      <MenuItemsGrid 
        restaurantId="8511b497-1275-4325-b723-5848c2b6f9d8"
        title="Нашето меню"
      />
    </>
  )
}

export default Home
