import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { validateToken } from "@/utils/auth"
import { API_URL } from '@/config/api'
import { fetchWithAdminAuth } from "@/utils/adminAuth"
import imageCompression from 'browser-image-compression';
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeliveryPeopleManager } from "@/components/delivery-people-manager"
import { MoreVertical, Pencil, Trash2, Search, UserPlus } from "lucide-react"

export function RestaurantManager() {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddItemDialog, setShowAddItemDialog] = useState(false)
  const [showEditRestaurantDialog, setShowEditRestaurantDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [showEditItemDialog, setShowEditItemDialog] = useState(false)
  const [showDeleteItemDialog, setShowDeleteItemDialog] = useState(false)
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [deliveryPeople, setDeliveryPeople] = useState([])
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    file: null
  })
  const [editRestaurantData, setEditRestaurantData] = useState({
    name: "",
    address: "",
    opening_hours: {}
  })
  const [editingItem, setEditingItem] = useState(null)
  const [currentTab, setCurrentTab] = useState("items")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddRestaurantDialog, setShowAddRestaurantDialog] = useState(false);
  const [addRestaurantForm, setAddRestaurantForm] = useState({
    name: "",
    city: "",
    address: "",
    openingHours: {
      Monday: [9, 18],
      Tuesday: [9, 18],
      Wednesday: [9, 18],
      Thursday: [9, 18],
      Friday: [9, 18],
      Saturday: [10, 18],
      Sunday: [10, 16],
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    const validateUserToken = async () => {
      const user = JSON.parse(sessionStorage.getItem('user'))
      if (!user?.access_token) {
        navigate('/login')
        return
      }
      
      const isValid = await validateToken(user.access_token)
      if (!isValid) {
        sessionStorage.removeItem('user')
        navigate('/login')
      }
    }

    validateUserToken()
  }, [navigate])

  useEffect(() => {
    fetchRestaurants()
    fetchDeliveryPeople()
  }, [])

  useEffect(() => {
    if (selectedRestaurant) {
      fetchItems(selectedRestaurant[0])
    }
  }, [selectedRestaurant])

  const fetchRestaurants = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/restaurant/restaurants`)
      if (!response.ok) throw new Error('Failed to fetch restaurants')
      const data = await response.json()
      console.log('Fetched restaurants:', data)
      setRestaurants(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async (restaurantId) => {
    try {
      const response = await fetch(`${API_URL}/restaurant/${restaurantId}/items`)
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      console.log('Fetched items for restaurant', restaurantId, ':', data)
      setItems(data)
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(err.message)
    }
  }

  const fetchDeliveryPeople = async () => {
    try {
      console.log('🚚 RestaurantManager: Fetching delivery people with admin auth')
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`)
      if (!response.ok) throw new Error('Failed to fetch delivery people')
      const data = await response.json()
      console.log('🚚 RestaurantManager: Fetched delivery people:', data)
      setDeliveryPeople(data)
    } catch (err) {
      console.error('🚚 RestaurantManager: Error fetching delivery people:', err)
    }
  }

  const handleEditRestaurant = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_URL}/restaurant/restaurants`, {
        method: 'PUT',
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant[0],
          restaurant: editRestaurantData
        })
      })

      if (!response.ok) throw new Error('Failed to update restaurant')
      
      setShowEditRestaurantDialog(false)
      fetchRestaurants()
    } catch (err) {
      console.error('Error updating restaurant:', err)
      setError(err.message)
    }
  }

  const handleDeleteRestaurant = async () => {
    try {
      const response = await fetch(`${API_URL}/restaurant/restaurants`, {
        method: 'DELETE',
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant[0]
        })
      })

      if (!response.ok) throw new Error('Failed to delete restaurant')
      
      setShowDeleteConfirmDialog(false)
      setSelectedRestaurant(null)
      fetchRestaurants()
    } catch (err) {
      console.error('Error deleting restaurant:', err)
      setError(err.message)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    if (isSubmitting) return // Prevent duplicate submissions
    
    setIsSubmitting(true)
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
      const response = await fetch(`${API_URL}/restaurant/items`, {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookies
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      setShowAddItemDialog(false)
      setNewItem({ name: "", description: "", price: "", file: null })
      fetchItems(selectedRestaurant[0])
    } catch (err) {
      console.error('Error adding item:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const compressImage = async (imageFile) => {
    if (!imageFile) return null;
    
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1024,
      useWebWorker: true
    };
    
    try {
      return await imageCompression(imageFile, options);
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const formData = new FormData();
    
    const itemData = {
      item_id: editingItem.item_id,
      name: editingItem.name,
      description: editingItem.description,
      price: parseFloat(editingItem.price)
    };

    try {
      formData.append('data', JSON.stringify(itemData));
      
      if (editingItem.file) {
        const compressedImage = await compressImage(editingItem.file);
        if (compressedImage) {
          formData.append('file', compressedImage, compressedImage.name);
        }
      }

      const response = await fetch(`${API_URL}/restaurant/items`, {
        method: 'PUT',
        credentials: 'include', // Send HttpOnly cookies
        body: formData
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage;
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.detail || 'Failed to update item';
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // After successful update, fetch updated items
      await fetchItems(selectedRestaurant[0]);
      setShowEditItemDialog(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteItem = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`${API_URL}/restaurant/items`, {
        method: 'DELETE',
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: editingItem.item_id // Using the correct property from the object
        })
      })

      if (!response.ok) throw new Error('Failed to delete item')
      
      setShowDeleteItemDialog(false)
      setEditingItem(null)
      fetchItems(selectedRestaurant[0])
    } catch (err) {
      console.error('Error deleting item:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e) => {
    setNewItem(prev => ({
      ...prev,
      file: e.target.files[0]
    }))
  }

  const filteredItems = items.filter(item =>
    (item?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item?.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  const handleAddRestaurantFormChange = (field, value) => {
    setAddRestaurantForm((prev) => ({ ...prev, [field]: value }));
  };
  const handleOpeningHoursChange = (day, value) => {
    setAddRestaurantForm((prev) => ({
      ...prev,
      openingHours: { ...prev.openingHours, [day]: value },
    }));
  };
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Convert opening hours to string format
      const opening_hours = Object.fromEntries(
        Object.entries(addRestaurantForm.openingHours).map(([day, [start, end]]) => [
          day,
          `${String(start).padStart(2, '0')}:00-${String(end).padStart(2, '0')}:00`
        ])
      );
      const response = await fetch(`${API_URL}/restaurant/restaurants`, {
        method: "POST",
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: addRestaurantForm.name,
          city: addRestaurantForm.city,
          address: addRestaurantForm.address,
          opening_hours,
        }),
      });
      if (!response.ok) throw new Error("Failed to add restaurant");
      setShowAddRestaurantDialog(false);
      setAddRestaurantForm({
        name: "",
        city: "",
        address: "",
        openingHours: {
          Monday: [9, 18],
          Tuesday: [9, 18],
          Wednesday: [9, 18],
          Thursday: [9, 18],
          Friday: [9, 18],
          Saturday: [10, 18],
          Sunday: [10, 16],
        },
      });
      fetchRestaurants();
    } catch (err) {
      alert("Failed to add restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  // Remove duplicate restaurants by id
  const uniqueRestaurants = Array.from(
    new Map(restaurants.map(r => [r[0], r])).values()
  );

  // Get unique cities from unique restaurants
  const cities = Array.from(new Set(uniqueRestaurants.map(r => r[2]).filter(Boolean)));

  const filteredRestaurants = uniqueRestaurants.filter(r => {
    const search = restaurantSearch.trim().toLowerCase();
    const matchesSearch =
      (!search ||
      (r[7] && r[7].toLowerCase().includes(search)) ||
      (r[1] && r[1].toLowerCase().includes(search)) ||
      (r[2] && r[2].toLowerCase().includes(search)));
    const matchesCity = cityFilter ? r[2] === cityFilter : true;
    return matchesSearch && matchesCity;
  });

  if (loading) {
    return <div className="text-center p-4">Loading...</div>
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>
  }

  return (
    <div className="flex flex-col gap-6 w-full px-0 py-0 bg-background">
      <div className="flex flex-wrap gap-4 mb-4 items-center justify-between">
        <div className="flex gap-4 flex-1 min-w-0">
          <Input
            placeholder="Search restaurants..."
            value={restaurantSearch}
            onChange={e => setRestaurantSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="border rounded px-2 py-1 text-base"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <Button onClick={() => setShowAddRestaurantDialog(true)}>
          Add Restaurant
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 w-full">
        {filteredRestaurants.map((restaurant) => (
          <Card 
            key={restaurant[0]} 
            className={`relative cursor-pointer transition-all hover:shadow-lg ${
              selectedRestaurant?.[0] === restaurant[0] ? 'ring-2 ring-primary' : 'hover:border-primary'
            }`}
            onClick={() => {
              console.log('Navigating to restaurant UUID:', restaurant[0]);
              navigate(`/admin/restaurant/${restaurant[0]}`);
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-grow pr-16">
                  <h3 className="text-2xl font-semibold mb-2">{restaurant[7]}</h3>
                  <p className="text-muted-foreground mb-1">{restaurant[1]}</p>
                  <p className="text-muted-foreground mb-4">{restaurant[2]}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(restaurant[8] || {}).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center border-b border-border/50 pb-1">
                        <span className="font-medium capitalize">{day}:</span>
                        <span className="text-muted-foreground">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute top-6 right-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="hover:bg-accent">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditRestaurantData({
                          name: restaurant[7], // Correct index for name
                          address: restaurant[1], // Correct index for address
                          opening_hours: restaurant[8] // Correct index for opening_hours
                        })
                        setShowEditRestaurantDialog(true)
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedRestaurant(restaurant)
                          setShowDeleteConfirmDialog(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Show details and delivery people tabs when a restaurant is selected */}
      {selectedRestaurant && (
        <div className="mt-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList>
              <TabsTrigger value="items">Menu Items</TabsTrigger>
              <TabsTrigger value="details">Restaurant Details</TabsTrigger>
              <TabsTrigger value="delivery">Delivery People</TabsTrigger>
            </TabsList>
            <TabsContent value="items" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button onClick={() => setShowAddItemDialog(true)}>
                  Add Menu Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <Card key={item[0]} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="relative">
                      <div className="absolute top-4 right-4 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background/90">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingItem({
                                item_id: item[0],
                                name: item[4],
                                description: item[2],
                                price: item[5],
                                image_url: item[3]
                              })
                              setShowEditItemDialog(true)
                            }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setEditingItem({
                                  item_id: item[0],
                                  name: item[4]
                                })
                                setShowDeleteItemDialog(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="aspect-square relative mb-4">
                        <img 
                          src={item[3] || '/elementor-placeholder-image.webp'} 
                          alt={item[4]}
                          onError={(e) => {
                            e.target.src = '/elementor-placeholder-image.webp'
                          }}
                          className="absolute inset-0 h-full w-full object-cover rounded-md"
                        />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{item[4]}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">{item[2]}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="font-semibold text-lg">
                        ${typeof item[5] === 'number' ? item[5].toFixed(2) : '0.00'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Added on {new Date(item[1]).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Location Details</h3>
                  <p><strong>Latitude:</strong> {selectedRestaurant[5]}</p>
                  <p><strong>Longitude:</strong> {selectedRestaurant[6]}</p>
                  <p><strong>Address:</strong> {selectedRestaurant[1]}</p>
                  <p><strong>City:</strong> {selectedRestaurant[2]}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
                  {Object.entries(selectedRestaurant[8] || {}).map(([day, hours]) => (
                    <p key={day}><strong>{day}:</strong> {hours}</p>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              <DeliveryPeopleManager 
                restaurantId={selectedRestaurant[0]}
                deliveryPeople={deliveryPeople}
                onUpdate={fetchDeliveryPeople}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={showEditRestaurantDialog} onOpenChange={setShowEditRestaurantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>
              Modify the restaurant details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRestaurant}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={editRestaurantData.name}
                  onChange={(e) => setEditRestaurantData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editRestaurantData.address}
                  onChange={(e) => setEditRestaurantData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Restaurant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this restaurant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRestaurant}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new menu item
            </DialogDescription>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Modify the menu item details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Item Name</Label>
                <Input
                  id="edit-name"
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editingItem?.price || ''}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-image">New Image (optional)</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditingItem(prev => ({ ...prev, file: e.target.files[0] }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteItemDialog} onOpenChange={setShowDeleteItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this menu item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteItemDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteItem} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddRestaurantDialog} onOpenChange={setShowAddRestaurantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Restaurant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRestaurant} className="space-y-4">
            <Input
              placeholder="Name"
              value={addRestaurantForm.name}
              onChange={(e) => handleAddRestaurantFormChange("name", e.target.value)}
              required
            />
            <Input
              placeholder="City"
              value={addRestaurantForm.city}
              onChange={(e) => handleAddRestaurantFormChange("city", e.target.value)}
              required
            />
            <Input
              placeholder="Address"
              value={addRestaurantForm.address}
              onChange={(e) => handleAddRestaurantFormChange("address", e.target.value)}
              required
            />
            {/* Map picker placeholder */}
            <div className="text-xs text-muted-foreground">[Map picker coming soon]</div>
            <div>
              <div className="font-semibold mb-2">Opening Hours</div>
              {Object.entries(addRestaurantForm.openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-2 mb-2">
                  <span className="w-20">{day}</span>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={1}
                    value={hours[0]}
                    onChange={e => handleOpeningHoursChange(day, [Number(e.target.value), hours[1]])}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={1}
                    value={hours[1]}
                    onChange={e => handleOpeningHoursChange(day, [hours[0], Number(e.target.value)])}
                    className="flex-1"
                  />
                  <span className="w-24 text-right">{String(hours[0]).padStart(2, '0')}:00 - {String(hours[1]).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Adding..." : "Add Restaurant"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}