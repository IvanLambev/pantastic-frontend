import { useState, useEffect } from "react"
import { useCart } from "@/hooks/use-cart"
import { API_URL } from "@/config/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check } from "lucide-react"
import { toast } from "sonner"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { t } from "@/utils/translations"
import { AnimatePresence } from "framer-motion"

export default function MiscItemsSuggestion({ restaurantId, limit = 4 }) {
  const [miscItems, setMiscItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedItems, setAddedItems] = useState(new Set())
  const { addToCart } = useCart()

  console.log('[MiscItems] Component rendered with restaurantId:', restaurantId)

  useEffect(() => {
    const fetchMiscItems = async () => {
      if (!restaurantId) {
        console.log('[MiscItems] No restaurant ID provided')
        return
      }

      try {
        setLoading(true)
        const url = `${API_URL}/restaurant/${restaurantId}/items/misc`
        console.log('[MiscItems] Fetching from:', url)
        
        // Public endpoint - no authentication required
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (!response.ok) {
          console.error('[MiscItems] Response not OK:', response.status, await response.text())
          throw new Error('Failed to fetch misc items')
        }

        const data = await response.json()
        console.log('[MiscItems] Response data:', data)
        
        // Handle different response formats
        let items = []
        if (Array.isArray(data)) {
          items = data
        } else if (data.items && Array.isArray(data.items)) {
          items = data.items
        } else if (data.data && Array.isArray(data.data)) {
          items = data.data
        }

        console.log('[MiscItems] Parsed items:', items)
        
        // Limit the number of items displayed
        setMiscItems(items.slice(0, limit))
      } catch (error) {
        console.error('[MiscItems] Error fetching misc items:', error)
        setMiscItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchMiscItems()
  }, [restaurantId, limit])

  const handleAddToCart = (item) => {
    // Add item to cart with consistent ID so quantities stack
    const cartItem = {
      id: item.item_id, // Use item_id directly so duplicates stack
      originalItemId: item.item_id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image_url,
      restaurant_id: restaurantId,
      selectedAddons: [],
      selectedRemovables: []
    }

    addToCart(cartItem)
    
    // Show success animation
    setAddedItems(prev => new Set([...prev, item.item_id]))
    
    // Show toast notification
    toast.success(t('menu.addedToCart', { name: item.name }))

    // Reset the animation after 1 second
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.item_id)
        return newSet
      })
    }, 1000)
  }

  // Always show the component container for debugging
  console.log('[MiscItems] Render check - loading:', loading, 'items count:', miscItems.length)
  
  if (loading) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">Loading misc items...</div>
        </CardContent>
      </Card>
    )
  }

  if (miscItems.length === 0) {
    return (
      <Card className="border-dashed border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-6">
          <div className="text-sm">
            <p className="font-medium">Debug: No misc items found</p>
            <p className="text-xs text-muted-foreground mt-1">Restaurant ID: {restaurantId}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log('[MiscItems] Rendering with', miscItems.length, 'items')

  return (
    <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-foreground">
            {t('misc.suggestTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('misc.suggestSubtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {miscItems.map((item) => {
            const isAdded = addedItems.has(item.item_id)
            
            return (
              <Card 
                key={item.item_id}
                className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.01]"
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-4">
                    {/* Image on the left */}
                    {item.image_url && (
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {/* Item Info on the right */}
                    <div className="flex-1 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base line-clamp-1">
                          {item.name}
                        </h4>
                        <span className="text-lg font-bold text-primary">
                          {formatDualCurrencyCompact(item.price)}
                        </span>
                      </div>

                      {/* Add to Cart Button on the right */}
                      <div className="flex-shrink-0">
                        <AnimatePresence mode="wait">
                          {isAdded ? (
                            <div
                              key="check"
                              className="animate-in zoom-in duration-300"
                            >
                              <Button
                                size="sm"
                                className="bg-green-500 hover:bg-green-600 h-9 w-9 p-0 shadow-md"
                                disabled
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              key="plus"
                              className="animate-in zoom-in duration-300"
                            >
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                className="h-9 w-9 p-0 shadow-md"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
