import { useState } from "react"
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
import { Combobox } from "@/components/ui/combobox"

const TOPPING_OPTIONS = [
  { label: "Nutella", value: "nutella" },
  { label: "Black Chocolate", value: "black" },
  { label: "White Chocolate", value: "white" },
  { label: "Bueno", value: "bueno" },
]

export default function DeluxeBox() {
  const navigate = useNavigate()
  // New state for box size and toppings
  const [boxSize, setBoxSize] = useState(2) // 2 or 4
  const [toppings, setToppings] = useState([null, null, null, null])
  const [imageError, setImageError] = useState(false)

  // Handle topping change
  const handleToppingChange = (index, value) => {
    setToppings(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  // Handle submit
  const handleSubmit = () => {
    const selectedToppings = toppings.slice(0, boxSize)
    if (selectedToppings.some(t => !t)) {
      toast.error("Please select all toppings.")
      return
    }
    console.log({ boxSize, toppings: selectedToppings })
    navigate("/food")
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
        {/* Left: Image */}
        <div className="relative aspect-video md:aspect-square flex items-center justify-center">
          <img
            src={
              imageError
                ? '/elementor-placeholder-image.webp'
                : boxSize === 2
                  ? '/pantastic-deluxe-box-za-dvama.jpeg'
                  : '/pantastic-deluxe-box-za-trima.jpeg'
            }
            alt={boxSize === 2 ? 'Box for 2' : 'Box for 4'}
            className="w-full h-full object-cover rounded-lg"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Right: Controls */}
        <div className="space-y-6">
          {/* Box size buttons */}
          <div className="flex gap-4 mb-4">
            <Button
              variant={boxSize === 2 ? "default" : "outline"}
              onClick={() => { setBoxSize(2); setToppings([null, null, null, null]); setImageError(false) }}
            >
              Box for 2 People
            </Button>
            <Button
              variant={boxSize === 4 ? "default" : "outline"}
              onClick={() => { setBoxSize(4); setToppings([null, null, null, null]); setImageError(false) }}
            >
              Box for 4 People
            </Button>
          </div>

          {/* Topping selectors */}
          <div className="space-y-4">
            {[...Array(boxSize)].map((_, i) => (
              <Combobox
                key={i}
                options={TOPPING_OPTIONS}
                value={toppings[i]}
                onChange={val => handleToppingChange(i, val)}
                placeholder={`Sweet topping ${i + 1}`}
                className="w-full"
              />
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
