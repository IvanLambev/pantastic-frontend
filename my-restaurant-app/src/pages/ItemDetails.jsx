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
import { ArrowLeft, Heart, Plus, Minus, ChevronDown, ShoppingCart } from "lucide-react"
import { fetchWithAuth } from "@/context/AuthContext"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { formatDualCurrencyCompact } from "@/utils/currency"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  const [quantity, setQuantity] = useState(1)

  // Add state for favorite
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteId, setFavoriteId] = useState(null)

  // Add state for collapsible sections on mobile
  const [isAddonsOpen, setIsAddonsOpen] = useState(false)
  const [isRemovablesOpen, setIsRemovablesOpen] = useState(false)

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
        let removables = await removablesRes.json();
        
        // Handle both old and new API response formats
        if (Array.isArray(removables)) {
          // New format: array of templates with removables array
          removables = { applied_templates: removables };
        }
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
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.customer_id) return
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        credentials: 'include', // Send HttpOnly cookies
        headers: {
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
      quantity: quantity
    };
    
    // Add to cart multiple times based on quantity
    for (let i = 0; i < quantity; i++) {
      addToCart(cartItem);
    }
    
    const addonText = selectedAddonList.length > 0 ? ` с ${selectedAddonList.length} добавки` : '';
    const removableText = selectedRemovableList.length > 0 ? ` и ${selectedRemovableList.length} премахнати съставки` : '';
    
    toast.success(
      <div className="flex flex-col">
        <span>Добавихте {quantity}x {item.name} в количката</span>
        {(selectedAddonList.length > 0 || selectedRemovableList.length > 0) && (
          <span className="text-xs">{addonText}{removableText}</span>
        )}
      </div>
    );
    navigate(-1);
  };

  // Removed manual instructions field

  const handleToggleFavorite = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!user.customer_id) return
    if (!isFavorite) {
      // Add to favorites
      const res = await fetchWithAuth(`${API_URL}/user/favouriteItems`, {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          item_id: itemId,
          restaurant_id: restaurantId  // Include restaurant_id
        }),
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
        credentials: 'include', // Send HttpOnly cookies
        headers: {
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
    return <div className="container mx-auto px-4 py-8">Зареждане...</div>
  }

  if (error) {
    return <div className="container mx-auto px-4 py-8 text-red-500">{error}</div>
  }

  if (!item) {
    return <div className="container mx-auto px-4 py-8">Продуктът не е намерен</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </Button>

      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-2 gap-8">
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
                  Основна: {formatDualCurrencyCompact(item.price)}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{item.description}</p>
          </div>

          {/* Addon selection section */}
          {addonTemplates.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Добавки</h2>
              
              {addonTemplates.map((template) => (
                <Card key={template.template_id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Добавки</CardTitle>
                      <Badge variant="outline">{Object.keys(template.addons || {}).length} опции</Badge>
                    </div>
                    <CardDescription>
                      Изберете опциите, които искате да добавите
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
              <h2 className="text-xl font-semibold">Опции "Без"</h2>
              <p className="text-sm text-muted-foreground">Изберете съставки, които искате да премахнете (без допълнителна такса)</p>
              
              {removableData.applied_templates.map((template) => (
                <Card key={template.template_id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Опции "Без"</CardTitle>
                      <Badge variant="outline">
                        {Array.isArray(template.removables) 
                          ? template.removables.length 
                          : Object.keys(template.removables || {}).length
                        } опции
                      </Badge>
                    </div>
                    <CardDescription>
                      Изберете съставки, които искате да премахнете
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.isArray(template.removables) ? (
                        // New format: array of removables
                        template.removables.map((removableItem, index) => (
                          <div
                            key={`${template.template_id}-${index}`}
                            className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                              isRemovableSelected(template.template_id, removableItem)
                                ? 'border-red-500 bg-red-50'
                                : 'border-border bg-background hover:bg-muted/50'
                            }`}
                            onClick={() => handleRemovableChange(template.template_id, removableItem, !isRemovableSelected(template.template_id, removableItem))}
                          >
                            <div className="flex items-center flex-1">
                              <Checkbox
                                checked={isRemovableSelected(template.template_id, removableItem)}
                                onCheckedChange={(checked) => handleRemovableChange(template.template_id, removableItem, checked)}
                                className="mr-3"
                              />
                              <span className="font-medium">{removableItem}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">Премахни</span>
                          </div>
                        ))
                      ) : (
                        // Old format: object with key-value pairs
                        Object.entries(template.removables || {}).map(([removableKey, removableValue]) => (
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
                            <span className="text-sm text-muted-foreground">Премахни</span>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Обща цена:</span>
              <span className="text-xl font-bold text-primary">{formatDualCurrencyCompact(totalPrice * quantity)}</span>
            </div>
            
            {/* Quantity selector */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Добави в количката
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {getAllSelectedAddons().length > 0 || getAllSelectedRemovables().length > 0 ? (
                <>
                  {getAllSelectedAddons().length > 0 && `${getAllSelectedAddons().length} добавки избрани`}
                  {getAllSelectedAddons().length > 0 && getAllSelectedRemovables().length > 0 && ', '}
                  {getAllSelectedRemovables().length > 0 && `${getAllSelectedRemovables().length} съставки премахнати`}
                </>
              ) : (
                "Няма избрани персонализации"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        {/* Item Name with Favorite */}
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold flex-1">{item.name}</h1>
          <button
            type="button"
            onClick={handleToggleFavorite}
            className="ml-2 bg-white/80 rounded-full p-1 hover:bg-white shadow"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className={`h-6 w-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
              fill={isFavorite ? 'red' : 'none'}
            />
          </button>
        </div>

        {/* Item Image */}
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <img
            src={item.image_url || '/elementor-placeholder-image.webp'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Price and Quantity Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Цена</p>
                <p className="text-2xl font-bold text-primary">
                  {formatDualCurrencyCompact(totalPrice * quantity)}
                </p>
                {totalPrice !== Number(item.price) && (
                  <Badge variant="outline" className="text-xs text-muted-foreground mt-1">
                    Основна: {formatDualCurrencyCompact(item.price)}
                  </Badge>
                )}
              </div>
              
              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-lg font-semibold w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Добави в количката
            </Button>
            
            {(getAllSelectedAddons().length > 0 || getAllSelectedRemovables().length > 0) && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                {getAllSelectedAddons().length > 0 && `${getAllSelectedAddons().length} добавки`}
                {getAllSelectedAddons().length > 0 && getAllSelectedRemovables().length > 0 && ', '}
                {getAllSelectedRemovables().length > 0 && `${getAllSelectedRemovables().length} без`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{item.description}</p>
          </CardContent>
        </Card>

        {/* Addons - Collapsible */}
        {addonTemplates.length > 0 && (
          <Collapsible open={isAddonsOpen} onOpenChange={setIsAddonsOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Добавки</CardTitle>
                      {getAllSelectedAddons().length > 0 && (
                        <Badge variant="secondary">{getAllSelectedAddons().length} избрани</Badge>
                      )}
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isAddonsOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <CardDescription className="text-left">
                    Изберете добавки
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-2 space-y-4">
                  {addonTemplates.map((template) => (
                    <div key={template.template_id} className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {Object.keys(template.addons || {}).length} опции
                        </span>
                      </div>
                      <div className="space-y-2">
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
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-medium">{addonName}</span>
                            </div>
                            <span className="text-sm font-semibold ml-2">+{formatDualCurrencyCompact(price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Removables - Collapsible */}
        {removableData && removableData.applied_templates && removableData.applied_templates.length > 0 && (
          <Collapsible open={isRemovablesOpen} onOpenChange={setIsRemovablesOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Опции "Без"</CardTitle>
                      {getAllSelectedRemovables().length > 0 && (
                        <Badge variant="secondary">{getAllSelectedRemovables().length} избрани</Badge>
                      )}
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isRemovablesOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <CardDescription className="text-left">
                    Премахнете съставки (без допълнителна такса)
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-2 space-y-4">
                  {removableData.applied_templates.map((template) => (
                    <div key={template.template_id} className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {Array.isArray(template.removables) 
                            ? template.removables.length 
                            : Object.keys(template.removables || {}).length
                          } опции
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(template.removables) ? (
                          // New format: array of removables
                          template.removables.map((removableItem, index) => (
                            <div
                              key={`${template.template_id}-${index}`}
                              className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                                isRemovableSelected(template.template_id, removableItem)
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-border bg-background hover:bg-muted/50'
                              }`}
                              onClick={() => handleRemovableChange(template.template_id, removableItem, !isRemovableSelected(template.template_id, removableItem))}
                            >
                              <div className="flex items-center flex-1">
                                <Checkbox
                                  checked={isRemovableSelected(template.template_id, removableItem)}
                                  onCheckedChange={(checked) => handleRemovableChange(template.template_id, removableItem, checked)}
                                  className="mr-3"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium">{removableItem}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">Премахни</span>
                            </div>
                          ))
                        ) : (
                          // Old format: object with key-value pairs
                          Object.entries(template.removables || {}).map(([removableKey, removableValue]) => (
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
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium capitalize">{removableValue}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">Премахни</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </div>
  )
}
