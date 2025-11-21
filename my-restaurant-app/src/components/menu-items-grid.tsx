import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from '@/config/api'
// @ts-ignore - useCart is exported from use-cart.js
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShoppingCart, Plus } from "lucide-react"

// @ts-ignore - fetchWithAuth is exported from AuthContext.jsx
import { fetchWithAuth } from "@/context/AuthContext"

interface MenuItem {
  item_id: string
  name: string
  price: number
  image_url: string
  description: string
  item_type: string
}

interface MenuItemsGridProps {
  restaurantId: string
  title?: string
  limit?: number
}

export function MenuItemsGrid({ restaurantId, title = "Нашето меню", limit }: MenuItemsGridProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true)
      try {
        const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items`)
        if (!response.ok) {
          throw new Error('Failed to fetch menu items')
        }
        const data = await response.json()
        
        // Apply limit if specified
        const itemsToShow = limit ? data.slice(0, limit) : data
        setItems(itemsToShow)
      } catch (err) {
        console.error('Error fetching menu items:', err)
        toast.error('Не успяхме да заредим менюто')
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [restaurantId, limit])

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.item_id,
      name: item.name,
      price: Number(item.price) || 0,
      image: item.image_url,
      description: item.description,
      quantity: 1
    })
    toast.success(`Добавено: ${item.name}`)
  }

  const handleItemClick = (item: MenuItem) => {
    navigate(`/restaurants/${restaurantId}/items/${item.item_id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <Card 
            key={item.item_id} 
            className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
          >
            <div 
              className="relative aspect-square overflow-hidden bg-muted"
              onClick={() => handleItemClick(item)}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
            
            <CardHeader className="pb-3">
              <CardTitle 
                className="text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleItemClick(item)}
              >
                {item.name}
              </CardTitle>
              {item.description && (
                <CardDescription className="line-clamp-2 text-sm">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-bold">
                  {item.price.toFixed(2)} лв
                </span>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddToCart(item)
                  }}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Добави
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {limit && items.length >= limit && (
        <div className="text-center mt-12">
          <Button 
            size="lg"
            onClick={() => navigate('/food')}
            className="gap-2"
          >
            Виж цялото меню
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
