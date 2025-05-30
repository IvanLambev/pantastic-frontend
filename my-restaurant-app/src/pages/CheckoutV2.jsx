import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL } from "@/config/api"
import { toast } from "sonner"
import { CreditCard, Smartphone, Wallet, DollarSign, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function CheckoutV2() {
  const navigate = useNavigate()
  const { cartItems, clearCart } = useCart()
  const [selectedPayment, setSelectedPayment] = useState("card")
  const [deliveryMethod, setDeliveryMethod] = useState("pickup")
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = 0 // TODO: Implement tax calculation
  const shipping = 0 // TODO: Implement shipping calculation
  const total = subtotal + tax + shipping

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
    setIsProcessing(true)
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const restaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')

      if (!user?.access_token || !restaurant?.[0]) {
        throw new Error('User not logged in or no restaurant selected')
      }

      const products = {}
      cartItems.forEach(item => {
        products[item.id] = item.quantity
      })

      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          restaurant_id: restaurant[0],
          products,
          payment_method: selectedPayment,
          delivery_method: deliveryMethod,
          address: restaurant[1] // Using restaurant address for pickup orders
        })
      })

      if (!response.ok) throw new Error('Failed to create order')
      
      const data = await response.json()
      if (!data.order_id) throw new Error('No order ID received')
      
      clearCart()
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
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-medium">${(item.price * item.quantity).toFixed(2)}</div>
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
