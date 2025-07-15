import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL } from "@/config/api"
import { toast } from "sonner"
import { CreditCard, Wallet, DollarSign, ArrowLeft, Check, Minus, Plus, Trash2, ChevronDownIcon, Calendar as CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchWithAuth } from "@/context/AuthContext"

export default function CheckoutV2() {  const navigate = useNavigate()
  const { cartItems, clearCart, updateQuantity, removeFromCart } = useCart()
  const [selectedPayment, setSelectedPayment] = useState("card")
  const [deliveryMethod, setDeliveryMethod] = useState("pickup")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false)
  const [selectedDate, setSelectedDate] = useState(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Helper: get valid time slots for selected date (24h format, every 15 min)
  const getTimeSlots = () => {
    if (!selectedDate) return [];
    const slots = [];
    const now = new Date();
    const gmtPlus3Now = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const today = new Date(gmtPlus3Now);
    today.setHours(0, 0, 0, 0);
    const isToday = selected.getTime() === today.getTime();
    let minTime = 0;
    if (isToday) {
      // Minimum 1 hour from now
      minTime = gmtPlus3Now.getHours() * 60 + gmtPlus3Now.getMinutes() + 60;
    }
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const totalMins = h * 60 + m;
        if (totalMins < minTime) continue;
        slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    return slots;
  };

  // Update: allow 3 days in advance
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 2); // today + 2 = 3 days
    date.setHours(0, 0, 0, 0);
    return date < today || date > maxDate;
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * item.quantity), 0)
  const tax = 0 // TODO: Implement tax calculation
  const shipping = 0 // TODO: Implement shipping calculation
  const total = subtotal + tax + shipping

  // Time validation for GMT+3 timezone
  const validateScheduledTime = () => {
    if (!isScheduled || !selectedDate || !selectedTime) return true
    const now = new Date()
    const gmtPlus3Now = new Date(now.getTime() + (3 * 60 * 60 * 1000))
    const scheduledDateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(":")
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    const oneHourFromNow = new Date(gmtPlus3Now.getTime() + (60 * 60 * 1000))
    const threeDaysFromNow = new Date(gmtPlus3Now.getTime() + (3 * 24 * 60 * 60 * 1000))
    if (scheduledDateTime < oneHourFromNow) {
      return false
    }
    if (scheduledDateTime > threeDaysFromNow) {
      return false
    }
    return true
  }

  // Create ISO 8601 formatted scheduled time
  const getScheduledDeliveryTime = () => {
    if (!isScheduled || !selectedDate || !selectedTime) return null
    const scheduledDateTime = new Date(selectedDate)
    const [hours, minutes] = selectedTime.split(":")
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    return scheduledDateTime.toISOString()
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
      id: "google-pay",
      name: "Google Pay",
      description: "Pay quickly with Google Pay",
      icon: Wallet,
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

  const handleCheckout = async () => {
    // Validate scheduled time before processing
    if (!validateScheduledTime()) {
      return
    }

    setIsProcessing(true)
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const restaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')

      if (!user?.access_token || !restaurant?.[0]) {
        throw new Error('User not logged in or no restaurant selected')
      }

      const products = {}
      const instructions = {}
      const order_addons = {}
      
      cartItems.forEach(item => {
        products[item.id] = item.quantity
        if (item.specialInstructions) {
          instructions[item.id] = item.specialInstructions
        }
        // Add selected addons to order_addons
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          const addonsObj = {}
          item.selectedAddons.forEach(addon => {
            // Count how many times each addon is selected (for multiple quantities)
            addonsObj[addon.name] = (addonsObj[addon.name] || 0) + 1
          })
          order_addons[item.id] = addonsObj
        }
      })
      console.log('Cart items:', cartItems)

      const orderData = {
        restaurant_id: restaurant[0],
        products,
        payment_method: selectedPayment,
        delivery_method: deliveryMethod,
        address: deliveryMethod === 'pickup' ? restaurant[1] : user.address, // Use restaurant address for pickup, user's address for delivery
        instructions,
        order_addons
      }

      // Add scheduled delivery time if applicable
      const scheduledTime = getScheduledDeliveryTime()
      if (scheduledTime) {
        orderData.scheduled_delivery_time = scheduledTime
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
      
      clearCart()
      cartItems.forEach(item => {
        sessionStorage.removeItem(`item-instructions-${item.id}`);
      });
      toast.success('Order placed successfully!')
      // Navigate using the complete UUID without any parsing
      navigate(`/order-tracking-v2/${data.order_id}`)
    } catch (error) {
      console.error('Error during checkout:', error)
      toast.error(error.message || 'Failed to place order')
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <h1 className="text-2xl font-bold text-center">Your Cart is Empty</h1>
          <p className="text-muted-foreground text-center">Add some delicious items to get started!</p>
          <Button onClick={() => navigate('/food')} className="w-full">Browse Menu</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">Complete your purchase</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment and Delivery Methods */}
          <div className="space-y-6">
            {/* Payment Methods */}
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

            {/* Delivery Method */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Method</CardTitle>
                <CardDescription>Choose how you'd like to receive your order</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label
                        htmlFor="pickup"
                        className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Pickup</div>
                          <div className="text-sm text-muted-foreground">Pick up your order at the restaurant</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Free</Badge>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label
                        htmlFor="delivery"
                        className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Delivery</div>
                          <div className="text-sm text-muted-foreground">Get your order delivered to your address</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Free</Badge>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Scheduling Options */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Timing</CardTitle>
                <CardDescription>Choose when you want to receive your order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="schedule-delivery" 
                    checked={isScheduled}
                    onCheckedChange={setIsScheduled}
                  />
                  <Label htmlFor="schedule-delivery">Schedule for later</Label>
                </div>
                
                {isScheduled && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-3 flex-1">
                        <Label htmlFor="date-picker" className="px-1">
                          Date
                        </Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              id="date-picker"
                              className="justify-between font-normal border-orange-400 text-orange-400"
                            >
                              {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              captionLayout="dropdown"
                              onSelect={(date) => {
                                setSelectedDate(date)
                                setSelectedTime(""); // reset time when date changes
                                setCalendarOpen(false)
                              }}
                              disabled={isDateDisabled}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-3 flex-1">
                        <Label htmlFor="time-picker" className="px-1">
                          Time
                        </Label>
                        <select
                          id="time-picker"
                          value={selectedTime}
                          onChange={e => setSelectedTime(e.target.value)}
                          className="bg-background border border-orange-400 text-orange-400 rounded px-2 py-2 focus:ring-2 focus:ring-orange-400"
                        >
                          <option value="" disabled>Select time</option>
                          {getTimeSlots().map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>• Minimum 1 hour from now</p>
                      <p>• Maximum 3 days in advance</p>
                      <p>• Times are in GMT+3 timezone</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">                {cartItems.map((item) => (
                  <div key={item.id} className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.specialInstructions && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium">Instructions: </span>
                            {item.specialInstructions}
                          </div>
                        )}
                      </div>
                      <div className="font-medium">${((Number(item.price) || 0) * item.quantity).toFixed(2)}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >                          <Minus className="h-4 w-4" />
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
                      >                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
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
                      Complete Payment
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
