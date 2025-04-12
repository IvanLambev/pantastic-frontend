import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RestaurantManager() {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    file: null
  })

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://134.122.68.20:80/restaurant/restaurants')
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants')
      }
      const data = await response.json()
      setRestaurants(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    const itemData = {
      restaurant_id: selectedRestaurant[0],
      items: [{
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price)
      }]
    }
    
    formData.append('data', JSON.stringify(itemData))
    formData.append('file', newItem.file)

    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const response = await fetch('http://134.122.68.20:80/restaurant/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      setShowAddItemDialog(false)
      setNewItem({ name: "", description: "", price: "", file: null })
      // Refresh items or show success message
    } catch (err) {
      console.error('Error adding item:', err)
      setError(err.message)
    }
  }

  const handleFileChange = (e) => {
    setNewItem(prev => ({
      ...prev,
      file: e.target.files[0]
    }))
  }

  if (loading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => (
          <Card 
            key={restaurant[0]} 
            className={`cursor-pointer transition-all ${
              selectedRestaurant?.[0] === restaurant[0] ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRestaurant(restaurant)}
          >
            <CardHeader>
              <CardTitle>{restaurant[6]}</CardTitle>
              <CardDescription>{restaurant[1]}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {Object.entries(restaurant[7]).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="font-medium">{day}:</span>
                    <span>{hours}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRestaurant && (
        <div className="flex gap-4 mt-6">
          <Button onClick={() => setShowAddItemDialog(true)}>
            Add Menu Item
          </Button>
        </div>
      )}

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}