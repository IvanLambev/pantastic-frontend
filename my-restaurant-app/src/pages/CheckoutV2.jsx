import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL } from "@/config/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

export default function CheckoutV2() {
  const navigate = useNavigate()
  const { cartItems, clearCart } = useCart()
  const [deliveryMethod, setDeliveryMethod] = useState("pickup")
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = 0 // TODO: Implement tax calculation
  const shipping = 0 // TODO: Implement shipping calculation
  const total = subtotal + tax + shipping

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
          payment_method: 'card',
          delivery_method: deliveryMethod,
          address: restaurant[1] // Using restaurant address for pickup orders
        })
      })

      if (!response.ok) throw new Error('Failed to create order')
      
      const data = await response.json()
      clearCart()
      sessionStorage.setItem('orderId', data.order_id)
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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-6 mx-auto px-4">
          <h1 className="text-2xl font-bold text-center">Your Cart is Empty</h1>
          <p className="text-muted-foreground text-center">Add some delicious items to get started!</p>
          <Button onClick={() => navigate('/food')} className="w-full">Browse Menu</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 mt-16 pb-32">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-start space-x-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-md">
                        <img
                          alt={item.name}
                          className="object-cover"
                          src={item.image || '/elementor-placeholder-image.webp'}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-sm">Quantity: {item.quantity}</span>
                          <Badge variant="secondary">${(item.price * item.quantity).toFixed(2)}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Delivery Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup">Pickup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery">Delivery</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/food')}
                >
                  Continue Shopping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
