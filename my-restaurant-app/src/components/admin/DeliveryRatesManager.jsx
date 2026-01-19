import { useState, useEffect } from "react";
import { Map, MapTileLayer, MapMarker, MapCircle } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/config/api";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DeliveryRatesManager({ isOpen, onClose, restaurant, allRestaurants }) {
  const [deliveryRates, setDeliveryRates] = useState([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([42.6977, 23.3219]); // Sofia, Bulgaria default

  // Colors for different zones
  const zoneColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (isOpen && restaurant) {
      // Initialize with current restaurant
      setSelectedRestaurants([restaurant.restaurant_id]);
      
      // Load existing delivery rates
      if (restaurant.delivery_rates) {
        const rates = Object.entries(restaurant.delivery_rates)
          .map(([km, price]) => ({
            distance: parseFloat(km),
            price: parseFloat(price)
          }))
          .sort((a, b) => a.distance - b.distance);
        setDeliveryRates(rates);
      } else {
        // Default rates
        setDeliveryRates([
          { distance: 1, price: 1.69 },
          { distance: 2.5, price: 3.0 },
          { distance: 5, price: 5.0 }
        ]);
      }

      // Set map center to restaurant location if available
      if (restaurant.latitude && restaurant.longitude) {
        setMapCenter([parseFloat(restaurant.latitude), parseFloat(restaurant.longitude)]);
      }
    }
  }, [isOpen, restaurant]);

  const handleAddZone = () => {
    const lastRate = deliveryRates[deliveryRates.length - 1];
    const newDistance = lastRate ? lastRate.distance + 1 : 1;
    const newPrice = lastRate ? lastRate.price + 1 : 1.69;
    
    setDeliveryRates([...deliveryRates, { distance: newDistance, price: newPrice }]);
  };

  const handleRemoveZone = (index) => {
    if (deliveryRates.length > 1) {
      setDeliveryRates(deliveryRates.filter((_, i) => i !== index));
    }
  };

  const handleRateChange = (index, field, value) => {
    const updated = [...deliveryRates];
    updated[index][field] = parseFloat(value) || 0;
    setDeliveryRates(updated.sort((a, b) => a.distance - b.distance));
  };

  const handleRestaurantToggle = (restaurantId) => {
    setSelectedRestaurants(prev => 
      prev.includes(restaurantId)
        ? prev.filter(id => id !== restaurantId)
        : [...prev, restaurantId]
    );
  };

  const handleSave = async () => {
    if (selectedRestaurants.length === 0) {
      toast.error("Please select at least one restaurant");
      return;
    }

    if (deliveryRates.length === 0) {
      toast.error("Please add at least one delivery zone");
      return;
    }

    setIsLoading(true);

    try {
      // Convert rates array to object format
      const ratesObject = {};
      deliveryRates.forEach(rate => {
        ratesObject[rate.distance.toString()] = rate.price;
      });

      // Update rates for each selected restaurant
      const promises = selectedRestaurants.map(async (restaurantId) => {
        const response = await fetchWithAdminAuth(
          `${API_URL}/restaurant/restaurants/delivery-rates`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              restaurant_id: restaurantId,
              delivery_rates: ratesObject
            })
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update restaurant ${restaurantId}`);
        }

        return response.json();
      });

      await Promise.all(promises);

      toast.success(`Delivery rates updated for ${selectedRestaurants.length} restaurant(s)`);
      onClose();
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating delivery rates:', error);
      toast.error('Failed to update delivery rates: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!restaurant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Rates Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Map Section */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Zones Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] rounded-lg overflow-hidden border">
                <Map center={mapCenter} zoom={13}>
                  <MapTileLayer />
                  
                  {/* Restaurant marker */}
                  <MapMarker position={mapCenter} />
                  
                  {/* Delivery zone circles */}
                  {deliveryRates.map((rate, index) => (
                    <MapCircle
                      key={index}
                      center={mapCenter}
                      radius={rate.distance * 1000} // Convert km to meters
                      pathOptions={{
                        color: zoneColors[index % zoneColors.length],
                        fillColor: zoneColors[index % zoneColors.length],
                        fillOpacity: 0.1,
                        weight: 2
                      }}
                    />
                  ))}
                </Map>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4">
                {deliveryRates.map((rate, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2"
                      style={{ 
                        borderColor: zoneColors[index % zoneColors.length],
                        backgroundColor: zoneColors[index % zoneColors.length] + '20'
                      }}
                    />
                    <span className="text-sm">
                      {rate.distance} km - ${rate.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delivery Zones Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Delivery Zones</CardTitle>
                <Button onClick={handleAddZone} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Zone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveryRates.map((rate, index) => (
                  <div key={index} className="flex items-end gap-4 p-4 border rounded-lg">
                    <div 
                      className="w-1 h-full rounded"
                      style={{ backgroundColor: zoneColors[index % zoneColors.length] }}
                    />
                    
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`distance-${index}`}>
                          Distance (km)
                        </Label>
                        <Input
                          id={`distance-${index}`}
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={rate.distance}
                          onChange={(e) => handleRateChange(index, 'distance', e.target.value)}
                          placeholder="e.g., 2.5"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>
                          Price ($)
                        </Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={rate.price}
                          onChange={(e) => handleRateChange(index, 'price', e.target.value)}
                          placeholder="e.g., 3.00"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveZone(index)}
                      disabled={deliveryRates.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Apply to Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {allRestaurants && allRestaurants.map((rest) => (
                    <div
                      key={rest.restaurant_id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent"
                    >
                      <Checkbox
                        id={`restaurant-${rest.restaurant_id}`}
                        checked={selectedRestaurants.includes(rest.restaurant_id)}
                        onCheckedChange={() => handleRestaurantToggle(rest.restaurant_id)}
                      />
                      <label
                        htmlFor={`restaurant-${rest.restaurant_id}`}
                        className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <div>{rest.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {rest.address}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="mt-4 text-sm text-muted-foreground">
                {selectedRestaurants.length} restaurant(s) selected
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Delivery Rates'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
