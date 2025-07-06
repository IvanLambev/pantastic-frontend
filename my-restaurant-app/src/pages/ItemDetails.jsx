import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Heart } from "lucide-react"
import { fetchWithAuth } from "@/context/AuthContext"

export default function ItemDetails() {
  const { restaurantId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const { addToCart } = useCart()

  // Add state for favorite
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items/${itemId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch item details')
        }
        let data = await response.json()
        // If data is an array, map to object
        if (Array.isArray(data)) {
          data = {
            item_id: data[0],
            created_at: data[1],
            description: data[2],
            image_url: data[3],
            name: data[4],
            price: data[5],
            category_id: data[6],
          }
        }
        setItem(data)
        // Load saved instructions if they exist
        const savedInstructions = sessionStorage.getItem(`item-instructions-${itemId}`)
        if (savedInstructions) {
          setSpecialInstructions(savedInstructions)
        }
      } catch (err) {
        setError(err.message)
        console.error('Error fetching item:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [restaurantId, itemId])

  // Check if item is favorite on mount
  useEffect(() => {
    const checkFavorite = async () => {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      if (!user.access_token) return
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        const data = await res.json()
        const fav = data.find(f => f.item_id === itemId)
        if (fav) {
          setIsFavorite(true)
          setFavoriteId(fav.id || fav.favourite_id || fav._id)
        }
      }
    }
    if (itemId) checkFavorite()
  }, [itemId])

  const handleAddToCart = () => {
    // Save instructions even if empty
    sessionStorage.setItem(`item-instructions-${itemId}`, specialInstructions)

    addToCart({
      id: item.item_id,
      name: item.name,
      price: item.price,
      image: item.image_url,
      description: item.description,
      specialInstructions,
      quantity: 1
    })
    toast.success(`Added ${item.name} to cart`)
    navigate(-1) // Go back to previous page
  }

  const handleInstructionsChange = (e) => {
    const instructions = e.target.value
    setSpecialInstructions(instructions)
    // Save instructions as user types
    sessionStorage.setItem(`item-instructions-${itemId}`, instructions)
  }

  const handleToggleFavorite = async () => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (!user.access_token) return
    if (!isFavorite) {
      // Add to favorites
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_id: itemId }),
      })
      if (res.ok) {
        setIsFavorite(true)
        const data = await res.json()
        setFavoriteId(data.id || data.favourite_id || data._id)
      }
    } else {
      // Remove from favorites
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems/${favoriteId || itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      if (res.ok) {
        setIsFavorite(false)
        setFavoriteId(null)
      }
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>
  }

  if (!item) {
    return <div className="container mx-auto px-4 py-8">Item not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="relative aspect-video md:aspect-square">
          <img
            src={item.image_url || '/elementor-placeholder-image.webp'}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="absolute top-2 right-2 z-10 bg-white/80 rounded-full p-1 hover:bg-white shadow"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-7 w-7 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
              fill={isFavorite ? 'red' : 'none'}
            />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{item.name}</h1>
            <p className="text-2xl font-semibold text-primary mb-4">
              ${Number(item.price).toFixed(2)}
            </p>
            <p className="text-muted-foreground">{item.description}</p>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold">Special Instructions</h2>
            <Textarea
              placeholder="Add any special instructions or requests here..."
              value={specialInstructions}
              onChange={handleInstructionsChange}
              className="min-h-[100px]"
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  )
}
