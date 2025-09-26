import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Store, Clock, CreditCard } from "lucide-react";
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
  total, 
  isLoading 
}) {
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (open) {
      // Get order details from sessionStorage
      const deliveryAddress = sessionStorage.getItem('delivery_address');
      const deliveryCoords = sessionStorage.getItem('delivery_coords');
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
        isDelivery: deliveryAddress && deliveryCoords,
        estimatedTime: new Date(Date.now() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  }, [open]);

  if (!orderDetails) return null;

  const { deliveryAddress, coords, restaurant, isDelivery, estimatedTime } = orderDetails;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-center">
            Confirm Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        Add-ons: {item.selectedAddons.map(addon => addon.name).join(', ')}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <div className="text-sm text-gray-500 mt-1">
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">€{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total</span>
                <span>€{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Restaurant Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-semibold">{restaurant[7]}</h4>
                <p className="text-gray-600">{restaurant[1]}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Estimated {isDelivery ? 'delivery' : 'pickup'} time: {estimatedTime}</span>
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
                {isDelivery ? 'Delivery Address' : 'Pickup Information'}
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
                            Delivery Location
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="font-medium">Pickup from restaurant</p>
                  <p className="text-gray-600">{restaurant[1]}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please arrive at the estimated time to collect your order.
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
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Cash on {isDelivery ? 'delivery' : 'pickup'}</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-3 flex-shrink-0 p-6 pt-0">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Back to Cart
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="flex-1">
            {isLoading ? 'Placing Order...' : 'Confirm Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
