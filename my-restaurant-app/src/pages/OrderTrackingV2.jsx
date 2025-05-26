import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '@/config/api'
import { useCart } from '@/hooks/use-cart'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function OrderTrackingV2() {
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { orderId } = useParams()
  const { clearCart } = useCart()
  const navigate = useNavigate()

  const getItemNameById = (itemId) => {
    const item = items.find(item => item[0] === itemId)
    return item ? item[4] : `Unknown Item (${itemId})`
  }

  const fetchOrder = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const response = await fetch(`${API_URL}/order/orders/status`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()
      
      // Find the order with the matching order_id
      const found = data.find(o => o.order_id === orderId)
      
      if (found && found.restaurant_id) {
        // Fetch items for the restaurant
        const itemsResponse = await fetch(`${API_URL}/restaurant/${found.restaurant_id}/items`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          setItems(itemsData)
        }
      }
      
      setOrder(found || null)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order details')
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    fetchOrder()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrder, 30000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  const handleCancelOrder = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const response = await fetch(`${API_URL}/order/orders/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      if (!response.ok) throw new Error('Failed to cancel order')
      toast.success('Order cancelled successfully')
      clearCart()
      navigate('/')
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading order details...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your order information.</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Order not found</h2>
          <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
          <Button 
            onClick={() => navigate('/food')}
            className="mt-4"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-8 mt-16 pb-32">
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Order #{order.order_id.substring(0, 8)}</CardTitle>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {order.products && Object.entries(order.products).map(([productId, quantity]) => (
                      <div key={productId} className="flex justify-between items-center">
                        <span>{quantity}x {getItemNameById(productId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span>${order.total_price ? order.total_price.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Delivery Method</p>
                  <p className="text-sm capitalize">{order.delivery_method}</p>
                </div>
                {order.address && (
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm break-words">{order.address}</p>
                  </div>
                )}
                {order.estimated_delivery_time && (
                  <div>
                    <p className="text-sm font-medium">Estimated Delivery</p>
                    <p className="text-sm">{new Date(order.estimated_delivery_time).toLocaleString()}</p>
                  </div>
                )}
                {order.delivery_person_name && (
                  <>
                    <div>
                      <p className="text-sm font-medium">Delivery Person</p>
                      <p className="text-sm">{order.delivery_person_name}</p>
                    </div>
                    {order.delivery_person_phone && (
                      <div>
                        <p className="text-sm font-medium">Contact</p>
                        <p className="text-sm">{order.delivery_person_phone}</p>
                      </div>
                    )}
                  </>
                )}
                <div className="flex flex-col gap-4 pt-4">
                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelOrder}
                    >
                      Cancel Order
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => navigate('/food')}
                  >
                    Order More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
