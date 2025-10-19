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
import { formatDualCurrencyCompact } from "@/utils/currency"

export default function ItemDetails() {
  const { restaurantId, itemId } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addonTemplates, setAddonTemplates] = useState([])
  const [removableData, setRemovableData] = useState(null)
  const [selectedAddons, setSelectedAddons] = useState({})
  const [selectedRemovables, setSelectedRemovables] = useState({})
  const [totalPrice, setTotalPrice] = useState(0)
  const { addToCart } = useCart()

  // Add state for favorite
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)

  useEffect(() => {
    const fetchItemAndAddons = async () => {
      try {
        setLoading(true);
        // Fetch item details
        const itemRes = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items/${itemId}`);
        if (!itemRes.ok) throw new Error('Failed to fetch item details');
        let data = await itemRes.json();
        if (Array.isArray(data)) {
          // New backend structure:
          // [id, [template_ids], addon_obj, created_at, description, image_url, category, name, price, null, null, restaurant_id]
          data = {
            item_id: data[0],
            template_ids: Array.isArray(data[1]) ? data[1] : [],
            addons: data[2] ? (typeof data[2] === 'string' ? JSON.parse(data[2]) : data[2]) : {},
            created_at: data[3],
            description: data[4],
            image_url: data[5],
            category: data[6],
            name: data[7],
            price: Number(data[8]) || 0,
            restaurant_id: data[11]
          }
        }
        setItem(data);
        setTotalPrice(Number(data.price));

        // Fetch addons for this item
        const addonsRes = await fetchWithAuth(`${API_URL}/restaurant/${restaurantId}/items/${itemId}/addons`);
        if (!addonsRes.ok) throw new Error('Failed to fetch addons');
        const templates = await addonsRes.json();
        setAddonTemplates(templates);

        // Fetch removables for this item
        const removablesRes = await fetchWithAuth(`${API_URL}/restaurant/removables/item/${itemId}`);
        if (!removablesRes.ok) throw new Error('Failed to fetch removables');
        const removables = await removablesRes.json();
        setRemovableData(removables);

        // Initialize selectedAddons state - Updated for new API structure
        const initialSelectedAddons = {};
        templates.forEach(template => {
          if (template.addons && Object.keys(template.addons).length > 0) {
            initialSelectedAddons[template.template_id] = [];
          }
        });
        setSelectedAddons(initialSelectedAddons);

        // Initialize selectedRemovables state
        const initialSelectedRemovables = {};
        if (removables.applied_templates) {
          removables.applied_templates.forEach(template => {
            initialSelectedRemovables[template.template_id] = [];
          });
        }
        setSelectedRemovables(initialSelectedRemovables);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching item/addons/removables:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItemAndAddons();
  }, [restaurantId, itemId]);

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

  // Handle selecting/deselecting addons - Updated for new API structure
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
            item => item.name !== addon.name
          );
        }
      }
      
      // Update total price (only addons affect price)
      updateTotalPrice(updatedAddons);
      
      return updatedAddons;
    });
  };

  // Handle selecting/deselecting removables (doesn't affect price)
  const handleRemovableChange = (templateId, removableKey, isChecked) => {
    setSelectedRemovables(prev => {
      const updatedRemovables = { ...prev };
      
      if (isChecked) {
        if (!updatedRemovables[templateId]) {
          updatedRemovables[templateId] = [];
        }
        updatedRemovables[templateId].push(removableKey);
      } else {
        if (updatedRemovables[templateId]) {
          updatedRemovables[templateId] = updatedRemovables[templateId].filter(
            item => item !== removableKey
          );
        }
      }
      
      return updatedRemovables;
    });
  };
  
  // Calculate total price based on item price and selected addons (removables don't affect price)
  const updateTotalPrice = (selectedAddonObj) => {
    if (!item) return;
    
    let newTotal = Number(item.price);
    
    // Add price of all selected addons (removables don't affect price)
    Object.values(selectedAddonObj).forEach(addonArray => {
      addonArray.forEach(addon => {
        newTotal += Number(addon.price);
      });
    });
    
    setTotalPrice(newTotal);
  };
  
  // Check if an addon is selected - Updated for new API structure
  const isAddonSelected = (templateId, addonName) => {
    return selectedAddons[templateId]?.some(addon => addon.name === addonName) || false;
  };

  // Check if a removable is selected
  const isRemovableSelected = (templateId, removableKey) => {
    return selectedRemovables[templateId]?.includes(removableKey) || false;
  };
  
  // Get all selected addons as a flat array
  const getAllSelectedAddons = () => {
    return Object.values(selectedAddons).flat();
  };

  // Get all selected removables as a flat array
  const getAllSelectedRemovables = () => {
    return Object.values(selectedRemovables).flat();
  };
  
  const handleAddToCart = () => {
    const selectedAddonList = getAllSelectedAddons();
    const selectedRemovableList = getAllSelectedRemovables();
    
    // Create a unique identifier for this specific item configuration
    const addonIds = selectedAddonList.map(addon => addon.name).sort().join(',');
    const removableIds = selectedRemovableList.sort().join(',');
    const configurationId = `${item.item_id}-${addonIds}-${removableIds}`;
    
    const cartItem = {
      id: configurationId, // Unique ID for this configuration
      originalItemId: item.item_id,
      name: item.name,
      price: totalPrice,
      basePrice: Number(item.price),
      image: item.image_url,
      description: item.description,
      selectedAddons: selectedAddonList,
      selectedRemovables: selectedRemovableList,
      addonCount: selectedAddonList.length,
      removableCount: selectedRemovableList.length,
      quantity: 1
    };
    
    addToCart(cartItem);
    
    const addonText = selectedAddonList.length > 0 ? ` with ${selectedAddonList.length} add-ons` : '';
    const removableText = selectedRemovableList.length > 0 ? ` and ${selectedRemovableList.length} items removed` : '';
    
    toast.success(
      <div className="flex flex-col">
        <span>Added {item.name} to cart</span>
        {(selectedAddonList.length > 0 || selectedRemovableList.length > 0) && (
          <span className="text-xs">{addonText}{removableText}</span>
        )}
      </div>
    );
    navigate(-1);
  };

  // Removed manual instructions field

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
                {formatDualCurrencyCompact(totalPrice)}
              </p>
              {totalPrice !== Number(item.price) && (
                <Badge variant="outline" className="text-muted-foreground">
                  Base: {formatDualCurrencyCompact(item.price)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{item.description}</p>
          </div>

          {/* Special Instructions field removed */}

          {/* Addon selection section */}
          {addonTemplates.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Add Extra Items</h2>
              
              {addonTemplates.map((template) => (
                <Card key={template.template_id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{Object.keys(template.addons || {}).length} options</Badge>
                    </div>
                    <CardDescription>
                      Select the options you'd like to add
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(template.addons || {}).map(([addonName, price]) => (
                        <div
                          key={`${template.template_id}-${addonName}`}
                          className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                            isAddonSelected(template.template_id, addonName)
                              ? 'border-primary bg-primary/10'
                              : 'border-border bg-background hover:bg-muted/50'
                          }`}
                          onClick={() => handleAddonChange(template.template_id, { name: addonName, price }, !isAddonSelected(template.template_id, addonName))}
                        >
                          <div className="flex items-center flex-1">
                            <Checkbox
                              checked={isAddonSelected(template.template_id, addonName)}
                              onCheckedChange={(checked) => handleAddonChange(template.template_id, { name: addonName, price }, checked)}
                              className="mr-3"
                            />
                            <span className="font-medium">{addonName}</span>
                          </div>
                          <span className="text-sm font-semibold ml-2">+{formatDualCurrencyCompact(price)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Removables selection section */}
          {removableData && removableData.applied_templates && removableData.applied_templates.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Remove Items</h2>
              <p className="text-sm text-muted-foreground">Select ingredients you'd like to remove (no extra charge)</p>
              
              {removableData.applied_templates.map((template) => (
                <Card key={template.template_id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{Object.keys(template.removables || {}).length} options</Badge>
                    </div>
                    <CardDescription>
                      Select ingredients you'd like to remove
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(template.removables || {}).map(([removableKey, removableValue]) => (
                        <div
                          key={`${template.template_id}-${removableKey}`}
                          className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                            isRemovableSelected(template.template_id, removableKey)
                              ? 'border-red-500 bg-red-50'
                              : 'border-border bg-background hover:bg-muted/50'
                          }`}
                          onClick={() => handleRemovableChange(template.template_id, removableKey, !isRemovableSelected(template.template_id, removableKey))}
                        >
                          <div className="flex items-center flex-1">
                            <Checkbox
                              checked={isRemovableSelected(template.template_id, removableKey)}
                              onCheckedChange={(checked) => handleRemovableChange(template.template_id, removableKey, checked)}
                              className="mr-3"
                            />
                            <span className="font-medium capitalize">{removableValue}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Remove</span>
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
              <span className="text-xl font-bold text-primary">{formatDualCurrencyCompact(totalPrice)}</span>
            </div>
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {getAllSelectedAddons().length > 0 || getAllSelectedRemovables().length > 0 ? (
                <>
                  {getAllSelectedAddons().length > 0 && `${getAllSelectedAddons().length} add-ons selected`}
                  {getAllSelectedAddons().length > 0 && getAllSelectedRemovables().length > 0 && ', '}
                  {getAllSelectedRemovables().length > 0 && `${getAllSelectedRemovables().length} items removed`}
                </>
              ) : (
                "No customizations selected"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
