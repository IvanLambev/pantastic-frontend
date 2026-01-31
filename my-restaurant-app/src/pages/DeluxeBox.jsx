import { useState, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { API_URL } from '@/config/api'
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { fetchWithAuth } from "@/context/AuthContext"
import { formatDualCurrencyCompact } from "@/utils/currency"

export default function DeluxeBox() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [searchParams] = useSearchParams()
  
  // Get item data from URL params or use default
  const itemId = searchParams.get('itemId')
  const restaurantId = searchParams.get('restaurantId')
  
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState(null)
  const [toppingTemplate, setToppingTemplate] = useState(null)
  const [pancakeTypeTemplate, setPancakeTypeTemplate] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [selectedPancakeType, setSelectedPancakeType] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)
  const [imageError, setImageError] = useState(false)

  // Extract deluxe box config from item
  const freeToppingsCount = item?.free_toppings_count || 3
  const toppingTemplateId = item?.topping_template_id || (item?.addon_template_ids && item.addon_template_ids[0])
  const pancakeTypeTemplateId = item?.pancake_type_template_id || (item?.addon_template_ids && item.addon_template_ids[1])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch topping template
      if (toppingTemplateId && restaurantId) {
        const toppingRes = await fetchWithAuth(
          `${API_URL}/restaurant/addon-templates/${restaurantId}/${toppingTemplateId}`
        )
        if (toppingRes.ok) {
          const toppingData = await toppingRes.json()
          setToppingTemplate(toppingData)
        }
      }

      // Fetch pancake type template if exists
      if (pancakeTypeTemplateId && restaurantId) {
        const pancakeRes = await fetchWithAuth(
          `${API_URL}/restaurant/addon-templates/${restaurantId}/${pancakeTypeTemplateId}`
        )
        if (pancakeRes.ok) {
          const pancakeData = await pancakeRes.json()
          setPancakeTypeTemplate(pancakeData)
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Неуспешно зареждане на опциите за делукс кутия')
    } finally {
      setLoading(false)
    }
  }, [toppingTemplateId, pancakeTypeTemplateId, restaurantId])

  useEffect(() => {
    // Get item from URL params or localStorage
    const urlItem = searchParams.get('item')
    if (urlItem) {
      try {
        const parsedItem = JSON.parse(decodeURIComponent(urlItem))
        setItem(parsedItem)
      } catch (e) {
        console.error('Failed to parse item from URL:', e)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (item) {
      fetchTemplates()
      setTotalPrice(Number(item.price) || 0)
      // Initialize selected toppings array
      setSelectedToppings(Array(freeToppingsCount).fill(null))
      setSelectedPancakeType(null)
    }
  }, [item, freeToppingsCount, fetchTemplates])

  const handleToppingChange = (index, toppingName) => {
    const newToppings = [...selectedToppings]
    newToppings[index] = toppingName
    setSelectedToppings(newToppings)
    calculatePrice(newToppings, selectedPancakeType)
  }

  const handlePancakeTypeChange = (pancakeTypeName) => {
    setSelectedPancakeType(pancakeTypeName)
    calculatePrice(selectedToppings, pancakeTypeName)
  }

  const calculatePrice = (toppings, pancakeType) => {
    let price = Number(item?.price) || 0

    // Add prices for extra toppings (beyond free count)
    if (toppingTemplate && toppingTemplate.addons) {
      toppings.forEach((topping, index) => {
        if (topping && index >= freeToppingsCount) {
          const addonPrice = toppingTemplate.addons[topping] || 0
          price += Number(addonPrice)
        }
      })
    }

    // Add price for pancake type
    if (pancakeType && pancakeTypeTemplate && pancakeTypeTemplate.addons) {
      const pancakePrice = pancakeTypeTemplate.addons[pancakeType] || 0
      price += Number(pancakePrice)
    }

    setTotalPrice(price)
  }

  const handleAddToCart = () => {
    // Validate all required toppings are selected
    const requiredToppings = selectedToppings.slice(0, freeToppingsCount)
    if (requiredToppings.some(t => !t)) {
      toast.error(`Моля, изберете всичките ${freeToppingsCount} добавки`)
      return
    }

    // Validate pancake type if required
    if (pancakeTypeTemplate && !selectedPancakeType) {
      toast.error('Моля, изберете тип палачинка')
      return
    }

    // Build selected addons for cart
    const cartAddons = []
    
    // Add toppings
    selectedToppings.forEach((topping, index) => {
      if (topping) {
        const price = index < freeToppingsCount 
          ? 0 
          : (toppingTemplate?.addons?.[topping] || 0)
        cartAddons.push({
          name: `${index < freeToppingsCount ? 'Безплатна ' : ''}Добавка ${index + 1}: ${topping}`,
          price: Number(price)
        })
      }
    })

    // Add pancake type
    if (selectedPancakeType) {
      const pancakePrice = pancakeTypeTemplate?.addons?.[selectedPancakeType] || 0
      cartAddons.push({
        name: `Тип палачинка: ${selectedPancakeType}`,
        price: Number(pancakePrice)
      })
    }

    const cartItem = {
      id: item.item_id,
      name: item.name,
      price: Number(item.price),
      quantity: 1,
      description: item.description,
      image: item.image_url,
      selectedAddons: cartAddons
    }

    addToCart(cartItem)
    toast.success(`${item.name} добавен в количката!`)
    navigate("/food")
  }

  const getToppingOptions = () => {
    if (!toppingTemplate || !toppingTemplate.addons) return []
    return Object.keys(toppingTemplate.addons)
  }

  const getPancakeTypeOptions = () => {
    if (!pancakeTypeTemplate || !pancakeTypeTemplate.addons) return []
    return Object.keys(pancakeTypeTemplate.addons)
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/food")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Няма избрана делукс кутия. Моля, изберете артикул от менюто.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-2xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/food")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад към Меню
      </Button>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr,2fr] gap-12">
          {/* Left: Image Only */}
          <div className="space-y-4">
            {item.image_url && (
              <div className="relative aspect-square">
                <img
                  src={imageError ? '/elementor-placeholder-image.webp' : item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => setImageError(true)}
                />
              </div>
            )}
          </div>

          {/* Right: Item Info and Selection Controls */}
          <div className="space-y-6">
            {/* Item Name and Description */}
            <div className="space-y-2 text-left">
              <h1 className="text-3xl font-bold">{item.name}</h1>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
            
            {/* Topping Selectors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Изберете вашите добавки</Label>
              </div>
              
              {selectedToppings.map((_, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`topping-${index}`} className="text-sm">
                    Добавка {index + 1}
                    {index >= freeToppingsCount && toppingTemplate?.addons?.[selectedToppings[index]] && (
                      <span className="text-muted-foreground ml-2">
                        +{formatDualCurrencyCompact(toppingTemplate.addons[selectedToppings[index]])}
                      </span>
                    )}
                  </Label>
                  <Select
                    value={selectedToppings[index] || ""}
                    onValueChange={(value) => handleToppingChange(index, value)}
                  >
                    <SelectTrigger id={`topping-${index}`}>
                      <SelectValue placeholder="Изберете добавка..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getToppingOptions().map((topping) => (
                        <SelectItem key={topping} value={topping}>
                          {topping}
                          {index >= freeToppingsCount && toppingTemplate.addons[topping] > 0 && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (+{formatDualCurrencyCompact(toppingTemplate.addons[topping])})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Pancake Type Selector (if applicable) */}
            {pancakeTypeTemplate && (
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="pancake-type" className="text-lg font-semibold">
                  Изберете тип палачинка
                  {selectedPancakeType && pancakeTypeTemplate.addons[selectedPancakeType] > 0 && (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      +{formatDualCurrencyCompact(pancakeTypeTemplate.addons[selectedPancakeType])}
                    </span>
                  )}
                </Label>
                <Select
                  value={selectedPancakeType || ""}
                  onValueChange={handlePancakeTypeChange}
                >
                  <SelectTrigger id="pancake-type">
                    <SelectValue placeholder="Изберете тип палачинка..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getPancakeTypeOptions().map((pancakeType) => (
                      <SelectItem key={pancakeType} value={pancakeType}>
                        {pancakeType}
                        {pancakeTypeTemplate.addons[pancakeType] > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (+{formatDualCurrencyCompact(pancakeTypeTemplate.addons[pancakeType])})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Total Price */}
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <span className="text-lg font-semibold">Обща Цена</span>
              <span className="text-2xl font-bold text-primary">
                {formatDualCurrencyCompact(totalPrice)}
              </span>
            </div>

            {/* Add to Cart Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={loading}
            >
              Добави в количка
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
