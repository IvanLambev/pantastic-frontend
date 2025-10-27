import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Store, Clock, CreditCard } from "lucide-react";
import { formatDualCurrencyCompact } from "@/utils/currency";
import { t } from "@/utils/translations";
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function OrderConfirmation({ 
  open, 
  onClose, 
  onConfirm, 
  cartItems, 
  subtotal,
  discountInfo,
  discountAmount,
  total, 
  deliveryFee,
  isLoading 
}) {
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (open) {
      // Get order details from sessionStorage
      const deliveryAddress = sessionStorage.getItem('delivery_address');
      const deliveryCoords = sessionStorage.getItem('delivery_coords');
      const deliveryMethod = sessionStorage.getItem('delivery_method');
      const selectedRestaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '{}');
      
      let coords = null;
      if (deliveryCoords) {
        try {
          coords = JSON.parse(deliveryCoords);
        } catch (e) {
          console.error('Error parsing delivery coordinates:', e);
        }
      }

      setOrderDetails({
        deliveryAddress,
        coords,
        restaurant: selectedRestaurant,
        isDelivery: deliveryMethod === 'delivery',
        estimatedTime: new Date(Date.now() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }, [open]);

  if (!orderDetails) return null;

  const { deliveryAddress, coords, restaurant, isDelivery, estimatedTime } = orderDetails;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center">
            {t('checkout.confirmOrder')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t('checkout.orderItems')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">{t('cart.quantity')}: {item.quantity}</p>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="text-sm text-green-600 mt-1">
                        {t('cart.addons')}: {item.selectedAddons.map(addon => addon.name).join(', ')}
                      </div>
                    )}
                    {item.selectedRemovables && item.selectedRemovables.length > 0 && (
                      <div className="text-sm text-red-600 mt-1">
                        {t('menu.removed')}: {item.selectedRemovables.join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-sm text-gray-500 mt-1">
                        {t('cart.specialInstructions')}: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDualCurrencyCompact(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatDualCurrencyCompact(subtotal)}</span>
                </div>
                {discountInfo && discountInfo.valid && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('cart.discount')} ({discountInfo.discount_percentage}%)</span>
                    <span>-{formatDualCurrencyCompact(discountAmount)}</span>
                  </div>
                )}
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>{t('cart.deliveryFee')}</span>
                    <span>{formatDualCurrencyCompact(deliveryFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>{t('cart.total')}</span>
                  <span>{formatDualCurrencyCompact(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t('checkout.restaurantDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold">{Array.isArray(restaurant) ? restaurant[7] : restaurant.name}</h4>
                <p className="text-gray-600">{Array.isArray(restaurant) ? restaurant[1] : restaurant.address}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>{t('checkout.estimatedTime', { 
                    method: isDelivery ? t('tracking.delivery') : t('tracking.pickup'), 
                    time: estimatedTime 
                  })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDelivery ? (
                  <MapPin className="h-5 w-5 text-green-600" />
                ) : (
                  <Store className="h-5 w-5 text-blue-600" />
                )}
                {isDelivery ? t('checkout.deliveryAddress') : t('checkout.pickupInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isDelivery ? (
                <>
                  <div>
                    <p className="font-medium">{deliveryAddress}</p>
                  </div>
                  
                  {coords && (
                    <div className="h-[300px] w-full rounded-lg overflow-hidden border">
                      <MapContainer
                        center={[coords.lat, coords.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                        zoomControl={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[coords.lat, coords.lng]}>
                          <Popup>
                            {t('checkout.deliveryLocation')}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="font-medium">{t('checkout.pickupFromRestaurant')}</p>
                  <p className="text-gray-600">{Array.isArray(restaurant) ? restaurant[1] : restaurant.address}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {t('checkout.arriveAtEstimatedTime')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('checkout.paymentMethod')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t('checkout.cashOn', { method: isDelivery ? t('tracking.delivery') : t('tracking.pickup') })}</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-3 flex-shrink-0 p-6 pt-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('checkout.backToCart')}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="flex-1">
            {isLoading ? t('checkout.placingOrder') : t('checkout.confirmOrder')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
