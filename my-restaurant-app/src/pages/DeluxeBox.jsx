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

const BOX_INFO = {
  2: {
    name: "Pantastic Deluxe Box for Two (1000g)",
    description:
      "An exquisite box set for unforgettable sweet moments - 20 mini pancakes, strawberries, banana and kiwi with a compliment of 3 toppings of your choice.",
    price: 35,
    toppings: 3,
  },
  4: {
    name: "Pantastic Deluxe Box for Four (1500g)",
    description:
      "Share an unforgettable family moment with a deluxe box set with 30 mini pancakes, banana, strawberries, kiwi, 4 toppings of your choice and 1 classic pancake - savory or sweet of your choice from the ones offered",
    price: 50,
    toppings: 4,
  },
}

export default function DeluxeBox() {
  const navigate = useNavigate()
  const [boxSize, setBoxSize] = useState(2) // 2 or 4
  const [toppings, setToppings] = useState([null, null, null, null])
  const [imageError, setImageError] = useState(false)

  const handleToppingChange = (index, value) => {
    setToppings(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const handleSubmit = () => {
    const selectedToppings = toppings.slice(0, BOX_INFO[boxSize].toppings)
    if (selectedToppings.some(t => !t)) {
      toast.error("Please select all toppings.")
      return
    }
    console.log({ boxSize, toppings: selectedToppings })
    navigate("/food")
  }

  const { name, description, price, toppings: toppingCount } = BOX_INFO[boxSize]

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
          {/* Box info */}
          <div>
            <h1 className="text-2xl font-bold mb-1 text-left">{name}</h1>
            <p className="text-muted-foreground mb-2 text-left">{description}</p>
            <p className="text-xl font-semibold text-primary mb-4 text-left">${price}</p>
          </div>

          {/* Box size buttons */}
          <div className="flex gap-4 mb-4">
            <Button
              className={boxSize === 2 ? "bg-orange-400 text-white" : ""}
              variant={boxSize === 2 ? undefined : "outline"}
              onClick={() => { setBoxSize(2); setToppings([null, null, null, null]); setImageError(false) }}
            >
              Box for 2 People
            </Button>
            <Button
              className={boxSize === 4 ? "bg-orange-400 text-white" : ""}
              variant={boxSize === 4 ? undefined : "outline"}
              onClick={() => { setBoxSize(4); setToppings([null, null, null, null]); setImageError(false) }}
            >
              Box for 4 People
            </Button>
          </div>

          {/* Topping selectors */}
          <div className="space-y-4">
            {[...Array(toppingCount)].map((_, i) => (
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
