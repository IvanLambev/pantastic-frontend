import { useState, useEffect } from "react"
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
import { API_URL } from "@/config/api"
import { fetchWithAuth } from "@/lib/utils"

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
  const [{ isCheckingOut, error, orderDetails, showConfirmation }, setState] = useState({
    isCheckingOut: false,
    error: null,
    orderDetails: null,
    showConfirmation: true
  })

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Helper to fetch all orders and find the latest/matching one
  const fetchOrderDetails = async (orderId) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const response = await fetchWithAuth(`${API_URL}/order/orders/status`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) throw new Error('Failed to fetch orders')
      const orders = await response.json()
      // Find the order with the matching order_id
      return orders.find(order => order.order_id === orderId) || null
    } catch (err) {
      toast.error('Could not load order details')
      return null
    }
  }

  const handleCheckout = async () => {
    setState(prev => ({ ...prev, isCheckingOut: true, error: null }));
    try {      const result = await checkout();
      // Redirect immediately after successful checkout
      navigate(`/order-tracking-v2/${result.order_id}`);
      removeFromCart(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error('Failed to place order: ' + errorMessage);
    } finally {
      setState(prev => ({ ...prev, isCheckingOut: false }));
    }
  };

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
  const handleConfirmationClose = () => {
    setState(prev => ({ ...prev, showConfirmation: false }));
    if (orderDetails && orderDetails.order_id) {
      navigate(`/order-tracking-v2/${orderDetails.order_id}`);
    }
  }

  useEffect(() => {
    navigate('/cart')
  }, [navigate])

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="w-full max-w-sm space-y-6 mx-auto px-4">
            <h1 className="text-2xl font-bold text-center">Your Cart is Empty</h1>
            <p className="text-muted-foreground text-center">Add some delicious items to get started!</p>
            <Button onClick={() => navigate('/food')} className="w-full">Browse Menu</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 mt-16 pb-32">
        <h1 className="text-2xl font-bold mb-8">Your Cart</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="space-y-4 flex-grow">
            {cartItems.map((item) => (
              <Card key={item.id} className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-32 h-32">
                  <img
                    src={item.image || '/elementor-placeholder-image.webp'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between mb-4">
                    <h3 className="font-semibold mb-2 sm:mb-0">{item.name}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive self-end sm:self-start"
                      onClick={() => handleRemoveFromCart(item.id, item.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                    <div className="font-semibold text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="w-full lg:w-96 space-y-6">
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

        {/* <Dialog open={showConfirmation} onOpenChange={handleConfirmationClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order Confirmed!</DialogTitle>
              <DialogDescription>
                Your order has been successfully placed.
              </DialogDescription>
            </DialogHeader>
            
            {orderDetails && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Order ID</p>
                    <p className="text-sm text-muted-foreground">{orderDetails.order_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Price</p>
                    <p className="text-sm text-muted-foreground">${typeof orderDetails.total_price === 'number' ? orderDetails.total_price.toFixed(2) : '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery Method</p>
                    <p className="text-sm text-muted-foreground capitalize">{orderDetails.delivery_method || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      {orderDetails.estimated_delivery_time ? new Date(orderDetails.estimated_delivery_time).toLocaleString() : '-'}
                    </p>
                  </div>
                  {orderDetails.delivery_method === 'pickup' && orderDetails.address && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Pickup Address</p>
                      <p className="text-sm text-muted-foreground">{orderDetails.address}</p>
                    </div>
                  )}
                  {orderDetails.delivery_person_name && (
                    <>
                      <div>
                        <p className="text-sm font-medium">Delivery Person</p>
                        <p className="text-sm text-muted-foreground">{orderDetails.delivery_person_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Contact Number</p>
                        <p className="text-sm text-muted-foreground">{orderDetails.delivery_person_phone || '-'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={handleConfirmationClose}>
                Track Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> */}
      </div>
    </div>
  )
}

export default Cart