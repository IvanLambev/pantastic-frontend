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
  deliveryEstimate,
  isLoading,
  cutleryRequested 
}) {
  const [orderDetails, setOrderDetails] = useState(null);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (open) {
      // Store original overflow style
      const originalOverflow = document.body.style.overflow;
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup: restore original overflow when dialog closes
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      // Get order details from sessionStorage
      const deliveryAddress = sessionStorage.getItem('delivery_address');
      const deliveryCoords = sessionStorage.getItem('delivery_coords');
      const deliveryMethod = sessionStorage.getItem('delivery_method');
      const selectedRestaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '{}');
      const scheduledDelivery = sessionStorage.getItem('order_scheduled_delivery');
      
      let coords = null;
      if (deliveryCoords) {
        try {
          coords = JSON.parse(deliveryCoords);
        } catch (e) {
          console.error('Error parsing delivery coordinates:', e);
        }
      }

      // Calculate estimated time and scheduled info
      let estimatedTime;
      let scheduledInfo = null;
      if (scheduledDelivery) {
        // Use scheduled delivery time if available
        try {
          const scheduledData = JSON.parse(scheduledDelivery);
          if (scheduledData.timeSlot && scheduledData.timeSlot.startString) {
            estimatedTime = scheduledData.timeSlot.startString;
            scheduledInfo = {
              dayName: scheduledData.dayName || 'Unknown day',
              timeRange: `${scheduledData.timeSlot.startString} - ${scheduledData.timeSlot.endString}`,
              isScheduled: scheduledData.isScheduled || false
            };
          } else {
            // Fallback to default 45 minutes if scheduled data is incomplete
            estimatedTime = new Date(Date.now() + 45 * 60000).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
          }
        } catch (e) {
          console.error('Error parsing scheduled delivery time:', e);
          estimatedTime = new Date(Date.now() + 45 * 60000).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
        }
      } else {
        // No scheduled time - calculate based on current time + 45 minutes
        estimatedTime = new Date(Date.now() + 45 * 60000).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
      }

      setOrderDetails({
        deliveryAddress,
        coords,
        restaurant: selectedRestaurant,
        isDelivery: deliveryMethod === 'delivery',
        estimatedTime,
        scheduledInfo
      });
    }
  }, [open]);

  if (!orderDetails) return null;

  const { deliveryAddress, coords, restaurant, isDelivery, estimatedTime, scheduledInfo } = orderDetails;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-center">
            {t('checkout.confirmOrder')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
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
                    {item.selectedDoughType && (
                      <div className="text-sm text-blue-700 mt-1">
                        Тесто: {item.selectedDoughType}
                      </div>
                    )}
                    {item.selectedChocolateType && (
                      <div className="text-sm text-amber-700 mt-1">
                        Шоколад: {item.selectedChocolateType}
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
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>{t('cart.deliveryFee')}</span>
                      <span>{formatDualCurrencyCompact(deliveryFee)}</span>
                    </div>
                    {deliveryEstimate && deliveryEstimate.distance_km && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('checkout.distance')}: {deliveryEstimate.distance_km.toFixed(2)} km</span>
                        {deliveryEstimate.estimated_delivery_minutes && (
                          <span>{t('checkout.estimatedTime')}: ~{deliveryEstimate.estimated_delivery_minutes} {t('checkout.minutes')}</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>{t('cart.total')}</span>
                  <span>{formatDualCurrencyCompact(total)}</span>
                </div>
                {cutleryRequested && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <span>✓</span>
                      <span>{t('checkout.requestCutlery')}</span>
                    </div>
                  </>
                )}
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
              <div className="space-y-3">
                <h4 className="font-semibold">{Array.isArray(restaurant) ? restaurant[7] : restaurant.name}</h4>
                <p className="text-gray-600">{Array.isArray(restaurant) ? restaurant[1] : restaurant.address}</p>
                
                {scheduledInfo && scheduledInfo.isScheduled ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-orange-800 font-medium">
                      <Clock className="h-5 w-5" />
                      <span>{t('checkout.scheduledDelivery')}</span>
                    </div>
                    <div className="text-sm text-orange-700 ml-7">
                      <p><strong>{t('checkout.day')}:</strong> {scheduledInfo.dayName}</p>
                      <p><strong>{t('checkout.time')}:</strong> {scheduledInfo.timeRange}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{t('checkout.estimatedTime', { 
                      method: isDelivery ? t('tracking.delivery') : t('tracking.pickup'), 
                      time: estimatedTime 
                    })}</span>
                  </div>
                )}
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
