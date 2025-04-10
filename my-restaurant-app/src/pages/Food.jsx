import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const Food = () => {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Get user data from session storage
        const restaurantData = sessionStorage.getItem("selectedRestaurant")
        if (!restaurantData) {
          throw new Error("No restaurant selected")
        }
        
        // Parse the restaurant data - it's stored as a JSON array
        const restaurantArray = JSON.parse(restaurantData)
        const restaurantId = restaurantArray[0] // First element is the UUID
        
        if (!restaurantId) {
          throw new Error("Invalid restaurant data")
        }

       
        const response = await fetch(`http://134.122.68.20:80/restaurant/${restaurantId}/items`)
      
                
        if (!response.ok) {
          throw new Error("Failed to fetch items")
        }

        const data = await response.json()
        setItems(data)
        console.log("Fetched items:", data)
      } catch (err) {
        console.error("Error fetching items:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchItems()
  }, [])

  if (loading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Our Menu</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item[0]} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{item[3]}</CardTitle> {/* Name is at index 3 */}
              <CardDescription>${item[4].toFixed(2)}</CardDescription> {/* Price is at index 4 */}
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{item[2]}</p> {/* Description is at index 2 */}
              
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Food