import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, Edit, MapPin, Store } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { API_URL } from "@/config/api"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { t } from "@/utils/translations"
import { openInMaps } from "@/utils/mapsHelper"

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    cancelOrder,
    orderId 
  } = useCart()
  const navigate = useNavigate()
  const [{ error }, setState] = useState({
    error: null,
  })

  // Get delivery information from sessionStorage
  const deliveryAddress = sessionStorage.getItem('delivery_address')
  const deliveryCoords = sessionStorage.getItem('delivery_coords')
  const selectedRestaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}')
  const isDelivery = deliveryAddress && deliveryCoords

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleEditAddress = () => {
    // Clear current delivery address and navigate back to restaurant selection
    sessionStorage.removeItem('delivery_address')
    sessionStorage.removeItem('delivery_coords')
    navigate('/food')
  }

  const handleCheckout = () => {
    navigate('/checkout-login')
  }

  const handleRemoveFromCart = (itemId, itemName) => {
    removeFromCart(itemId)
    toast.info(t('cart.removedFromCart', { name: itemName }))
  }

  const handleCancelOrder = async () => {
    try {
      await cancelOrder()
      toast.success(t('cart.orderCancelledSuccess'))
      navigate('/food')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('common.unexpectedError')
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error(t('cart.failedToCancelOrder') + ': ' + errorMessage)
    }
  }

  useEffect(() => {
    navigate('/cart')
  }, [navigate])

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-sm space-y-6 mx-auto px-4">
            <h1 className="text-2xl font-bold text-center">{t('cart.empty')}</h1>
            <p className="text-muted-foreground text-center">{t('cart.emptyDesc')}</p>
            <Button onClick={() => navigate('/food')} className="w-full">{t('cart.continueShopping')}</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 mt-16 pb-32">
        <h1 className="text-2xl font-bold mb-8">{t('cart.title')}</h1>
        
        {/* Delivery/Pickup Information */}
        {selectedRestaurant?.length && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    {isDelivery ? (
                      <MapPin className="h-5 w-5 text-green-600" />
                    ) : (
                      <Store className="h-5 w-5 text-blue-600" />
                    )}
                    <h3 className="font-semibold text-lg">
                      {isDelivery ? t('cart.deliveryInformation') : t('cart.pickupInformation')}
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('cart.restaurant')}:</p>
                      <p className="font-medium">{selectedRestaurant[7]}</p>
                      <p className="text-sm text-gray-500">{selectedRestaurant[1]}</p>
                    </div>
                    
                    {isDelivery ? (
                      <div>
                        <p className="text-sm font-medium text-gray-600">{t('cart.deliveryAddressLabel')}:</p>
                        <p 
                          className="font-medium hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={() => openInMaps(deliveryAddress)}
                        >
                          {deliveryAddress}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-600">{t('cart.pickupFrom')}:</p>
                        <p 
                          className="font-medium hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={() => openInMaps(selectedRestaurant[1], selectedRestaurant[3])}
                        >
                          {selectedRestaurant[1]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {isDelivery && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEditAddress}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    {t('cart.editAddress')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="space-y-4 flex-grow">
            {cartItems.map((item) => (
              <Card key={item.id} className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-32 h-32">
                  <img
                    src={item.image || '/elementor-placeholder-image.webp'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
                    <h3 className="font-semibold mb-2 sm:mb-0">{item.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive self-end sm:self-start"
                      onClick={() => handleRemoveFromCart(item.id, item.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>                  <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
                  
                  {/* Display selected addons if any */}
                  {item.selectedAddons && item.selectedAddons.length > 0 && (
                    <div className="text-sm mb-2 bg-muted p-2 rounded-md">
                      <p className="font-semibold mb-1">{t('cart.addons')}:</p>
                      <ul className="space-y-1 pl-2">
                        {item.selectedAddons.map((addon, index) => (
                          <li key={index} className="flex justify-between">
                            <span>{addon.name}</span>
                            <span>+{formatDualCurrencyCompact(addon.price)}</span>
                          </li>
                        ))}
                      </ul>
                      {item.basePrice && (
                        <div className="flex justify-between text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
                          <span>{t('cart.basePrice')}:</span>
                          <span>{formatDualCurrencyCompact(item.basePrice)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {item.specialInstructions && (
                    <div className="text-sm mb-4">
                      <span className="font-semibold">{t('menu.instructions')}: </span>
                      <span className="text-muted-foreground">{item.specialInstructions}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="font-semibold text-right">
                      {formatDualCurrencyCompact(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="w-full lg:w-96 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('cart.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.name} × {item.quantity}</span>
                        <span>{formatDualCurrencyCompact(item.price * item.quantity)}</span>
                      </div>
                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-xs text-muted-foreground pl-4">
                          {item.selectedAddons.length} {t('cart.addonsSelected')}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-semibold">
                      <span>{t('cart.total')}</span>
                      <span>{formatDualCurrencyCompact(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                {error && (
                  <p className="text-destructive text-sm">{error}</p>
                )}
                {orderId ? (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancelOrder}
                  >
                    {t('cart.cancelOrder')}
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                  >
                    {t('cart.checkout')}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/food')}
                >
                  {t('cart.continueShopping')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
