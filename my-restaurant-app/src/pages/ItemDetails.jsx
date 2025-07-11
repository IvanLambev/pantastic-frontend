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
import { ArrowLeft, Heart, Plus, Minus } from "lucide-react"
import { fetchWithAuth } from "@/context/AuthContext"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

export default function ItemDetails() {
  const { restaurantId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [addonTemplates, setAddonTemplates] = useState([])
  const [selectedAddons, setSelectedAddons] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const { addToCart } = useCart()

  // Add state for favorite
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
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
            description: data[3],
            image_url: data[4],
            name: data[5],
            price: data[6],
            addon_template_ids: data[7] ? (Array.isArray(data[7]) ? data[7] : [data[7]]) : [],
          }
        }
        setItem(data)
        setTotalPrice(Number(data.price))
        
        // Load saved instructions if they exist
        const savedInstructions = sessionStorage.getItem(`item-instructions-${itemId}`)
        if (savedInstructions) {
          setSpecialInstructions(savedInstructions)
        }
        
        // Fetch addon templates for this item
        await fetchAddonTemplates(data.addon_template_ids);
      } catch (err) {
        setError(err.message)
        console.error('Error fetching item:', err)
      } finally {
        setLoading(false)
      }
    }

    // Fetch addon templates
    const fetchAddonTemplates = async (templateIds) => {
      if (!templateIds || !templateIds.length) return;
      
      try {
        const templates = [];
        
        // Fetch each template individually
        for (const templateId of templateIds) {
          if (!templateId) continue;
          
          const response = await fetchWithAuth(`${API_URL}/restaurant/addon-templates/template/${templateId}`);
          if (response.ok) {
            const template = await response.json();
            if (template) {
              templates.push(template);
            }
          }
        }
        
        setAddonTemplates(templates);
        
        // Initialize selectedAddons state
        const initialSelectedAddons = {};
        templates.forEach(template => {
          if (template.addons && template.addons.length > 0) {
            initialSelectedAddons[template.template_id] = [];
          }
        });
        setSelectedAddons(initialSelectedAddons);
        
      } catch (error) {
        console.error("Error fetching addon templates:", error);
      }
    };

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

  // Handle selecting/deselecting addons
  const handleAddonChange = (templateId, addon, isChecked) => {
    setSelectedAddons(prev => {
      const updatedAddons = { ...prev };
      
      if (isChecked) {
        if (!updatedAddons[templateId]) {
          updatedAddons[templateId] = [];
        }
        updatedAddons[templateId].push(addon);
      } else {
        if (updatedAddons[templateId]) {
          updatedAddons[templateId] = updatedAddons[templateId].filter(
            item => item.addon_id !== addon.addon_id
          );
        }
      }
      
      // Update total price
      updateTotalPrice(updatedAddons);
      
      return updatedAddons;
    });
  };
  
  // Calculate total price based on item price and selected addons
  const updateTotalPrice = (selectedAddonObj) => {
    if (!item) return;
    
    let newTotal = Number(item.price);
    
    // Add price of all selected addons
    Object.values(selectedAddonObj).forEach(addonArray => {
      addonArray.forEach(addon => {
        newTotal += Number(addon.price);
      });
    });
    
    setTotalPrice(newTotal);
  };
  
  // Check if an addon is selected
  const isAddonSelected = (templateId, addonId) => {
    return selectedAddons[templateId]?.some(addon => addon.addon_id === addonId) || false;
  };
  
  // Get all selected addons as a flat array
  const getAllSelectedAddons = () => {
    return Object.values(selectedAddons).flat();
  };
  
  // Generate special instructions from selected addons
  const generateInstructionsFromAddons = () => {
    const allSelected = getAllSelectedAddons();
    if (!allSelected.length) return specialInstructions;
    
    const addonText = allSelected.map(addon => `${addon.name} (+$${Number(addon.price).toFixed(2)})`).join(', ');
    
    if (specialInstructions) {
      return `Selected options: ${addonText}\n\nCustom instructions: ${specialInstructions}`;
    }
    
    return `Selected options: ${addonText}`;
  };

  const handleAddToCart = () => {
    // Generate the complete instructions including selected addons
    const completeInstructions = generateInstructionsFromAddons();
    const selectedAddonList = getAllSelectedAddons();
    
    // Save instructions to session storage
    sessionStorage.setItem(`item-instructions-${itemId}`, specialInstructions);

    const cartItem = {
      id: item.item_id,
      name: item.name,
      price: totalPrice, // Use the calculated total price including addons
      basePrice: Number(item.price),
      image: item.image_url,
      description: item.description,
      specialInstructions: completeInstructions,
      selectedAddons: selectedAddonList,
      addonCount: selectedAddonList.length,
      quantity: 1
    };

    addToCart(cartItem);
    
    toast.success(
      <div className="flex flex-col">
        <span>Added {item.name} to cart</span>
        {selectedAddonList.length > 0 && (
          <span className="text-xs">With {selectedAddonList.length} add-ons</span>
        )}
      </div>
    );
    navigate(-1); // Go back to previous page
  };

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
            <div className="flex items-center space-x-2 mb-4">
              <p className="text-2xl font-semibold text-primary">
                ${totalPrice.toFixed(2)}
              </p>
              {totalPrice !== Number(item.price) && (
                <Badge variant="outline" className="text-muted-foreground">
                  Base: ${Number(item.price).toFixed(2)}
                </Badge>
              )}
            </div>
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

          {/* Addon selection section */}
          {addonTemplates.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Customize Your Order</h2>
              
              {addonTemplates.map((template) => (
                <Card key={template.template_id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.addons.length} options</Badge>
                    </div>
                    <CardDescription>
                      Select the options you'd like to add
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {template.addons.map((addon) => (
                        <div
                          key={addon.addon_id}
                          className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                            isAddonSelected(template.template_id, addon.addon_id)
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:bg-muted/50'
                          }`}
                          onClick={() => handleAddonChange(template.template_id, addon, !isAddonSelected(template.template_id, addon.addon_id))}
                        >
                          <div className="flex items-center flex-1">
                            <Checkbox
                              checked={isAddonSelected(template.template_id, addon.addon_id)}
                              onCheckedChange={(checked) => handleAddonChange(template.template_id, addon, checked)}
                              className="mr-3"
                            />
                            <span className="font-medium">{addon.name}</span>
                          </div>
                          <span className="text-sm font-semibold ml-2">+${Number(addon.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total Price:</span>
              <span className="text-xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {getAllSelectedAddons().length > 0 ? 
                `Including ${getAllSelectedAddons().length} selected add-ons` : 
                "No add-ons selected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
