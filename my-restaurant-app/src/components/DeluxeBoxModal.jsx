import { useState, useEffect, useCallback } from "react"
import { API_URL } from '@/config/api'
import { fetchWithAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { PancakeInfoText } from "@/components/PancakeInfoText"
import { Loader2 } from "lucide-react"

export function DeluxeBoxModal({ isOpen, onClose, item, restaurantId, onAddToCart }) {
  const [loading, setLoading] = useState(true)
  const [toppingTemplate, setToppingTemplate] = useState(null)
  const [pancakeTypeTemplate, setPancakeTypeTemplate] = useState(null)
  const [selectedToppings, setSelectedToppings] = useState([])
  const [selectedPancakeType, setSelectedPancakeType] = useState(null)
  const [totalPrice, setTotalPrice] = useState(0)

  // Extract deluxe box config from item
  const freeToppingsCount = item?.free_toppings_count || 3
  const toppingTemplateId = item?.topping_template_id || (item?.addon_template_ids && item.addon_template_ids[0])
  const pancakeTypeTemplateId = item?.pancake_type_template_id || (item?.addon_template_ids && item.addon_template_ids[1])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch topping template
      if (toppingTemplateId) {
        const toppingRes = await fetchWithAuth(
          `${API_URL}/restaurant/addon-templates/${restaurantId}/${toppingTemplateId}`
        )
        if (toppingRes.ok) {
          const toppingData = await toppingRes.json()
          setToppingTemplate(toppingData)
        }
      }

      // Fetch pancake type template if exists
      if (pancakeTypeTemplateId) {
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
    if (isOpen && item) {
      fetchTemplates()
      setTotalPrice(Number(item.price) || 0)
      // Initialize selected toppings array
      setSelectedToppings(Array(freeToppingsCount).fill(null))
      setSelectedPancakeType(null)
    }
  }, [isOpen, item, freeToppingsCount, fetchTemplates])

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

    onAddToCart(cartItem)
    toast.success(`${item.name} добавен в количката!`)
    onClose()
  }

  const getToppingOptions = () => {
    if (!toppingTemplate || !toppingTemplate.addons) return []
    return Object.keys(toppingTemplate.addons)
  }

  const getPancakeTypeOptions = () => {
    if (!pancakeTypeTemplate || !pancakeTypeTemplate.addons) return []
    return Object.keys(pancakeTypeTemplate.addons)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
          <DialogDescription>
            {item?.description}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Item Image */}
            {item?.image_url && (
              <div>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
                {/* Info text below image */}
                <PancakeInfoText className="mt-3" />
              </div>
            )}

            {/* Base Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Базова Цена</span>
              <span className="font-semibold">{formatDualCurrencyCompact(item?.price)}</span>
            </div>

            {/* Topping Selectors */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Изберете Вашите Добавки</Label>
                <span className="text-sm text-muted-foreground">
                  {freeToppingsCount} включени безплатно
                </span>
              </div>
              
              {selectedToppings.map((_, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`topping-${index}`} className="text-sm">
                    Добавка {index + 1}
                    {index < freeToppingsCount && (
                      <span className="text-green-600 ml-2">(Безплатна)</span>
                    )}
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
                <Label htmlFor="pancake-type" className="text-base font-semibold">
                  Изберете Тип Палачинка
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
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-lg font-semibold">Обща Цена</span>
              <span className="text-xl font-bold text-primary">
                {formatDualCurrencyCompact(totalPrice)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отказ
          </Button>
          <Button onClick={handleAddToCart} disabled={loading}>
            Добави в количката
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
