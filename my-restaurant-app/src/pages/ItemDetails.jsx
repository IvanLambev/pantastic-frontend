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
import { ArrowLeft } from "lucide-react"

export default function ItemDetails() {
  const { restaurantId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const { addToCart } = useCart()

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${API_URL}/restaurant/${restaurantId}/items/${itemId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch item details')
        }
        const data = await response.json()
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

  const handleAddToCart = () => {
    // Save instructions even if empty
    sessionStorage.setItem(`item-instructions-${itemId}`, specialInstructions)

    addToCart({
      id: item[0],
      name: item[4],
      price: item[5],
      image: item[3],
      description: item[2],
      specialInstructions,
      quantity: 1
    })
    toast.success(`Added ${item[4]} to cart`)
    navigate(-1) // Go back to previous page
  }

  const handleInstructionsChange = (e) => {
    const instructions = e.target.value
    setSpecialInstructions(instructions)
    // Save instructions as user types
    sessionStorage.setItem(`item-instructions-${itemId}`, instructions)
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
            src={item[3] || '/elementor-placeholder-image.webp'}
            alt={item[4]}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{item[4]}</h1>
            <p className="text-2xl font-semibold text-primary mb-4">
              ${Number(item[5]).toFixed(2)}
            </p>
            <p className="text-muted-foreground">{item[2]}</p>
          </div>

          {/* Display allergens if they exist */}
          {item[9] && item[9].length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold">Allergens</h2>
              <div className="flex flex-wrap gap-2">
                {item[9].map((allergen, index) => (
                  <Badge key={index} variant="secondary">
                    {allergen}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
