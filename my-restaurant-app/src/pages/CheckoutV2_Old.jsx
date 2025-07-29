import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL } from "@/config/api"
import { toast } from "sonner"
import { CreditCard, DollarSign, ArrowLeft, Check, Minus, Plus, Trash2, Edit, MapPin, Store, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { fetchWithAuth } from "@/context/AuthContext"

export default function CheckoutV2() {
  const navigate = useNavigate()
  const { cartItems, clearCart, updateQuantity, removeFromCart } = useCart()
  const [selectedPayment, setSelectedPayment] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddressEdit, setShowAddressEdit] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  
  // Get delivery information from sessionStorage
  const deliveryAddress = sessionStorage.getItem('delivery_address')
  const deliveryCoords = sessionStorage.getItem('delivery_coords')
  const deliveryMethod = sessionStorage.getItem('delivery_method') || 'pickup'
  const selectedRestaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')
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
      sessionStorage.setItem('delivery_address', newAddress.trim())
      setShowAddressEdit(false)
    }
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

  const handleCheckout = async () => {
    setIsProcessing(true)
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')

      if (!user?.access_token || selectedRestaurant.length === 0) {
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

      const orderData = {
        restaurant_id: selectedRestaurant[0],
        products,
        payment_method: selectedPayment,
        delivery_method: deliveryMethod,
        address: deliveryMethod === 'pickup' ? selectedRestaurant[1] : deliveryAddress, 
        instructions,
        order_addons
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
