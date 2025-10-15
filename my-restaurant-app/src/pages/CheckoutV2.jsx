import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL } from "@/config/api"
import { toast } from "sonner"
import { CreditCard, DollarSign, ArrowLeft, Check, Minus, Plus, Trash2, Edit, MapPin, Store, X, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchWithAuth } from "@/context/AuthContext"
import OrderConfirmation from "@/components/OrderConfirmation"
import DeliverySchedulingBanner from "@/components/DeliverySchedulingBanner"

export default function CheckoutV2() {
  const navigate = useNavigate()
  const { cartItems, clearCart, updateQuantity, removeFromCart } = useCart()
  const [selectedPayment, setSelectedPayment] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddressEdit, setShowAddressEdit] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  
  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false)
  const [selectedDate, setSelectedDate] = useState(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [, setDeliverySchedule] = useState(null)
  
  // Memoized callback to prevent infinite re-renders
  const handleScheduleSelect = useCallback((schedule) => {
    if (schedule && schedule.isScheduled) {
      setDeliverySchedule(schedule);
      setIsScheduled(true);
      // Store scheduling info for order processing
      sessionStorage.setItem('order_scheduled_delivery', JSON.stringify(schedule));
    } else {
      setDeliverySchedule(null);
      setIsScheduled(false);
      sessionStorage.removeItem('order_scheduled_delivery');
    }
  }, []);
  
  // Get delivery information from sessionStorage
  const deliveryAddress = sessionStorage.getItem('delivery_address')
  const deliveryMethod = sessionStorage.getItem('delivery_method') || 'pickup'
  const selectedRestaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')
  const isScheduledOrder = sessionStorage.getItem('scheduled_order') === 'true'
  
  // Get delivery coordinates from sessionStorage
  const getDeliveryCoordinates = () => {
    const coordinates = sessionStorage.getItem('delivery_coordinates')
    return coordinates ? JSON.parse(coordinates) : { latitude: null, longitude: null }
  }

  // Calculate total
  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const addOnsTotal = item.addOns ? 
        item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0) : 0;
      return sum + (item.price * item.quantity) + (addOnsTotal * item.quantity);
    }, 0);
    
    const deliveryFee = deliveryMethod === 'delivery' ? 5 : 0;
    return subtotal + deliveryFee;
  };

  // Handle address editing
  const handleAddressEdit = () => {
    setNewAddress(deliveryAddress || "")
    setShowAddressEdit(true)
  }

  const handleAddressSave = () => {
    if (newAddress.trim()) {
      // Normalize the address by removing special characters except commas
      const normalizedAddress = newAddress.trim().replace(/['"„"«»]/g, '').replace(/[^\w\s,.-]/g, '').trim()
      
      sessionStorage.setItem('delivery_address', normalizedAddress)
      
      // Note: When manually editing address, coordinates are cleared since we don't have exact coordinates
      // The user should use the map to set precise coordinates if needed
      sessionStorage.removeItem('delivery_coordinates')
      
      setShowAddressEdit(false)
    }
  }

  // Helper functions for scheduling
  const getAvailableTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 3) // 3 days ahead
    date.setHours(0, 0, 0, 0)
    return date < today || date > maxDate
  }

  const getScheduledDeliveryTime = () => {
    // Check if there's a scheduled delivery from the banner component
    const scheduledDelivery = sessionStorage.getItem('order_scheduled_delivery');
    if (scheduledDelivery) {
      try {
        const schedule = JSON.parse(scheduledDelivery);
        if (schedule.timeSlot && schedule.timeSlot.start) {
          return new Date(schedule.timeSlot.start).toISOString();
        }
      } catch (error) {
        console.error('Error parsing scheduled delivery:', error);
      }
    }
    
    // Fallback to manual scheduling
    if (!isScheduled || !selectedDate || !selectedTime) return null;
    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":");
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return scheduledDateTime.toISOString();
  }

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Pay with your credit or debit card",
      icon: CreditCard,
      available: true,
    },
    {
      id: "cash",
      name: "Cash on Delivery/Pickup",
      description: "Pay with cash when your order arrives",
      icon: DollarSign,
      available: true,
    },
  ]

  const handleCheckout = () => {
    setShowOrderConfirmation(true)
  }

  const handleOrderConfirm = async () => {
    setIsProcessing(true)
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')

      if (!user?.access_token || selectedRestaurant.length === 0) {
        throw new Error('User not logged in or no restaurant selected')
      }

      // Format order items according to new API structure
      const orderItems = []
      
      // Group items by their original item ID to combine quantities and addons/removables
      const groupedItems = {}
      
      cartItems.forEach(item => {
        const itemId = item.originalItemId || item.id
        
        if (!groupedItems[itemId]) {
          groupedItems[itemId] = {
            item_id: itemId,
            quantity: 0,
            addons: {},
            removables: [],
            special_instructions: null
          }
        }
        
        // Add quantity
        groupedItems[itemId].quantity += item.quantity
        
        // Add addons (count occurrences)
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          item.selectedAddons.forEach(addon => {
            groupedItems[itemId].addons[addon.name] = (groupedItems[itemId].addons[addon.name] || 0) + item.quantity
          })
        }
        
        // Add removables (unique list)
        if (item.selectedRemovables && item.selectedRemovables.length > 0) {
          item.selectedRemovables.forEach(removable => {
            if (!groupedItems[itemId].removables.includes(removable)) {
              groupedItems[itemId].removables.push(removable)
            }
          })
        }
        
        // Add special instructions
        if (item.specialInstructions) {
          groupedItems[itemId].special_instructions = item.specialInstructions
        }
      })
      
      // Convert grouped items to order items format
      Object.values(groupedItems).forEach(groupedItem => {
        const orderItem = {
          item_id: groupedItem.item_id,
          quantity: groupedItem.quantity,
          addons: Object.keys(groupedItem.addons).length > 0 ? groupedItem.addons : null,
          removables: groupedItem.removables.length > 0 ? groupedItem.removables : null,
          special_instructions: groupedItem.special_instructions
        }
        orderItems.push(orderItem)
      })

      // Get delivery coordinates if delivery method is delivery
      const coordinates = getDeliveryCoordinates()

      const orderData = {
        restaurant_id: selectedRestaurant[0],
        order_items: orderItems,
        discount: null,
        payment_method: selectedPayment,
        delivery_method: deliveryMethod,
        address: deliveryMethod === 'pickup' ? null : deliveryAddress,
        latitude: deliveryMethod === 'delivery' && coordinates.latitude ? coordinates.latitude : null,
        longitude: deliveryMethod === 'delivery' && coordinates.longitude ? coordinates.longitude : null,
        scheduled_delivery_time: getScheduledDeliveryTime()
      }

      console.log('Placing order with:', orderData)

      const response = await fetchWithAuth(`${API_URL}/order/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) throw new Error('Failed to create order')
      
      const data = await response.json()
      if (!data.order_id) throw new Error('No order ID received')
      
      // Clean up scheduling session data
      sessionStorage.removeItem('scheduled_order');
      sessionStorage.removeItem('order_scheduling_reason');
      sessionStorage.removeItem('order_scheduled_delivery');

      // Handle different payment methods
      if (selectedPayment === 'cash') {
        // Cash payment - redirect directly to order tracking
        clearCart()
        cartItems.forEach(item => {
          sessionStorage.removeItem(`item-instructions-${item.id}`);
        });
        toast.success('Order placed successfully!')
        navigate(`/order-tracking-v2/${data.order_id}`)
      } else if (selectedPayment === 'card') {
        // Card payment - save payment info and redirect to payment URL
        if (!data.payment_url || !data.payment_id) {
          throw new Error('Payment information missing')
        }
        
        // Save payment info to session storage
        sessionStorage.setItem('pending_order_id', data.order_id)
        sessionStorage.setItem('pending_payment_id', data.payment_id)
        
        // Clear cart before redirecting to payment
        clearCart()
        cartItems.forEach(item => {
          sessionStorage.removeItem(`item-instructions-${item.id}`);
        });
        
        // Redirect to payment URL
        window.location.href = data.payment_url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.message || 'Failed to place order')
    } finally {
      setIsProcessing(false)
      setShowOrderConfirmation(false)
    }
  }

  const handleOrderConfirmationClose = () => {
    setShowOrderConfirmation(false)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate('/food')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">Complete your order</p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Choose how you'd like to pay for your order</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    <div className="space-y-4">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <div key={method.id} className="flex items-center space-x-3">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label
                              htmlFor={method.id}
                              className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-muted-foreground">{method.description}</div>
                              </div>
                              {method.available && (
                                <Badge variant="secondary" className="text-xs">
                                  Available
                                </Badge>
                              )}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              {deliveryMethod === 'delivery' && deliveryAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{deliveryAddress}</p>
                        <p className="text-sm text-muted-foreground">
                          Delivery to this address
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddressEdit}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Restaurant Information for Pickup */}
              {deliveryMethod === 'pickup' && selectedRestaurant.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Pickup Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{selectedRestaurant[7]}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRestaurant[1]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Scheduling Banner */}
              {selectedRestaurant.length > 0 && (
                <DeliverySchedulingBanner
                  restaurant={selectedRestaurant}
                  onScheduleSelect={handleScheduleSelect}
                  className="mb-4"
                />
              )}

              {/* Manual Order Scheduling (fallback) */}
              {!isScheduledOrder && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Order Timing
                    </CardTitle>
                    <CardDescription>
                      Schedule your order for a specific time (optional)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="schedule-order" 
                        checked={isScheduled}
                        onCheckedChange={setIsScheduled}
                      />
                      <Label htmlFor="schedule-order">Schedule for later</Label>
                    </div>
                    
                    {isScheduled && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date-picker">Date</Label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  id="date-picker"
                                  className="w-full justify-start font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    setSelectedDate(date)
                                    setSelectedTime("") // Reset time when date changes
                                    setCalendarOpen(false)
                                  }}
                                  disabled={isDateDisabled}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="time-picker">Time</Label>
                            <select
                              id="time-picker"
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                              disabled={!selectedDate}
                            >
                              <option value="" disabled>Select time</option>
                              {getAvailableTimeSlots().map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• You can schedule orders up to 3 days in advance</p>
                          <p>• Available times: 08:00 - 22:30</p>
                          <p>• Times are in 30-minute intervals</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          
                          {/* Display addons */}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="text-sm text-green-600 mt-1">
                              <span className="font-medium">Add-ons: </span>
                              {item.selectedAddons.map((addon, index) => (
                                <span key={index}>
                                  {addon.name} (+€{addon.price.toFixed(2)})
                                  {index < item.selectedAddons.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Display removables */}
                          {item.selectedRemovables && item.selectedRemovables.length > 0 && (
                            <div className="text-sm text-red-600 mt-1">
                              <span className="font-medium">Removed: </span>
                              {item.selectedRemovables.map((removable, index) => (
                                <span key={index} className="capitalize">
                                  {removable}
                                  {index < item.selectedRemovables.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Display special instructions */}
                          {item.specialInstructions && (
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">Instructions: </span>
                              {item.specialInstructions}
                            </div>
                          )}
                        </div>
                        <div className="font-medium">€{((Number(item.price) || 0) * item.quantity).toFixed(2)}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            sessionStorage.removeItem(`item-instructions-${item.id}`);
                            removeFromCart(item.id);
                            toast.success(`Removed ${item.name} from cart`);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>€{(calculateTotal() - (deliveryMethod === 'delivery' ? 5 : 0)).toFixed(2)}</span>
                    </div>
                    {deliveryMethod === 'delivery' && (
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span>€5.00</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>€{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing Payment...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Review Order
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Address Edit Dialog */}
          <Dialog open={showAddressEdit} onOpenChange={setShowAddressEdit}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Delivery Address</DialogTitle>
                <DialogDescription>
                  Update your delivery address
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Enter new address"
                  className="w-full"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddressEdit(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleAddressSave}>
                  <Check className="h-4 w-4 mr-2" />
                  Save Address
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Order Confirmation Dialog */}
          <OrderConfirmation
            open={showOrderConfirmation}
            onClose={handleOrderConfirmationClose}
            onConfirm={handleOrderConfirm}
            cartItems={cartItems}
            total={calculateTotal()}
            isLoading={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}
