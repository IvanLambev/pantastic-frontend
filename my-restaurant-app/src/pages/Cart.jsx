import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    checkout,
    cancelOrder,
    orderId 
  } = useCart()
  const navigate = useNavigate()
  const [{ isCheckingOut, error }, setState] = useState({
    isCheckingOut: false,
    error: null
  })

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleCheckout = async () => {
    setState(prev => ({ ...prev, isCheckingOut: true, error: null }))
    try {
      const result = await checkout()
      toast.success('Order placed successfully!')
      // Redirect to order tracking page
      navigate(`/order/${result.order_id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error('Failed to place order: ' + errorMessage)
    } finally {
      setState(prev => ({ ...prev, isCheckingOut: false }))
    }
  }

  const handleCancelOrder = async () => {
    try {
      await cancelOrder()
      toast.success('Order cancelled successfully')
      navigate('/food')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setState(prev => ({ ...prev, error: errorMessage }))
      toast.error('Failed to cancel order: ' + errorMessage)
    }
  }

  const handleRemoveFromCart = (itemId, itemName) => {
    removeFromCart(itemId)
    toast.info(`Removed ${itemName} from cart`)
  }

  if (cartItems.length === 0) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-6">Add some delicious items to get started!</p>
        <Button onClick={() => navigate('/food')}>Browse Menu</Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} className="flex">
              <div className="flex-1 p-6">
                <div className="flex justify-between mb-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleRemoveFromCart(item.id, item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                <div className="flex items-center justify-between">
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
                  <div className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
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
                  Cancel Order
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? 'Processing...' : 'Checkout'}
                </Button>
              )}
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
  )
}

export default Cart