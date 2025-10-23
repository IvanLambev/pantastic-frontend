import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL, FRONTEND_BASE_URL } from '@/config/api'
import { useCart } from '@/hooks/use-cart'
import { toast } from "sonner"
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  ShoppingBag,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fetchWithAuth } from "@/context/AuthContext"
import { formatDualCurrencyCompact } from "@/utils/currency"

export default function OrderTrackingV2() {
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { orderId } = useParams()
  const { clearCart } = useCart()
  const navigate = useNavigate()

  // Helper function to get item name by ID
  const getItemNameById = (itemId) => {
    console.log('Looking up item:', itemId, 'in items:', items)
    const item = items.find(item => String(item[0]) === String(itemId))
    return item ? item[4] : `Непознат артикул (${itemId})`
  }

  // Define the tracking steps with icons based on delivery method
  const getTrackingSteps = () => {
    if (order?.delivery_method === "pickup") {
      return [
        {
          id: 1,
          title: "Поръчката е получена",
          description: "Вашата поръчка е получена и потвърдена",
          icon: CheckCircle,
          status: "Pending",
        },
        {
          id: 2,
          title: "Подготвя се",
          description: "Вашата поръчка се подготвя",
          icon: Package,
          status: "In Progress",
        },
        {
          id: 3,
          title: "Готова за вземане",
          description: "Вашата поръчка е готова за вземане",
          icon: MapPin,
          status: "Ready",
        },
      ]
    } else {
      // Delivery orders
      return [
        {
          id: 1,
          title: "Поръчката е получена",
          description: "Вашата поръчка е получена и потвърдена",
          icon: CheckCircle,
          status: "Pending",
        },
        {
          id: 2,
          title: "Подготвя се",
          description: "Вашата поръчка се подготвя",
          icon: Package,
          status: "In Progress",
        },
        {
          id: 3,
          title: "В доставка",
          description: "Вашата поръчка е на път",
          icon: Truck,
          status: "Ready",
        },
        {
          id: 4,
          title: "Доставена",
          description: "Вашата поръчка е доставена",
          icon: CheckCircle,
          status: "Delivered",
        },
      ]
    }
  }

  const trackingSteps = getTrackingSteps()

  // Helper function to determine step status
  const getStepStatus = (stepStatus, orderStatus) => {
    if (orderStatus === 'Cancelled') return 'cancelled'
    
    const statusOrder = {
      'Pending': 0,
      'In Progress': 1,
      'Ready': 2,
      'Delivered': 3,
      'Cancelled': -1
    }

    const currentStepIndex = statusOrder[stepStatus]
    const orderStepIndex = statusOrder[orderStatus] || 0

    if (currentStepIndex === orderStepIndex) return 'current'
    if (currentStepIndex < orderStepIndex) return 'completed'
    return 'pending'
  }  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      console.log('Fetching orders with user token:', user.access_token ? '[PRESENT]' : '[MISSING]')
      
      const response = await fetchWithAuth(`${API_URL}/order/orders/status`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        }
      })
        if (!response.ok) throw new Error('Failed to fetch orders')
      const orders = await response.json()
      
      console.log('Searching for order ID:', orderId, 'Type:', typeof orderId)
      console.log('Available orders:', orders.map(o => ({ id: o.order_id, type: typeof o.order_id })))
      
      const orderData = orders.find(o => {
        console.log(`Comparing order ${o.order_id} (${typeof o.order_id}) with ${orderId} (${typeof orderId})`)
        return String(o.order_id) === String(orderId)
      })
      
      if (orderData) {
        console.log('Found matching order:', orderData)
      } else {
        console.log('No matching order found in response')
      }

      if (orderData && orderData.restaurant_id) {
        const itemsResponse = await fetchWithAuth(`${API_URL}/restaurant/${orderData.restaurant_id}/items`)
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          console.log('Fetched items:', itemsData)
          setItems(itemsData)
        }
      }
      
      setOrder(orderData || null)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Неуспешно зареждане на детайли за поръчката')
      setLoading(false)
    }
  }, [orderId])

  // Set up polling for order updates
  useEffect(() => {
    fetchOrder()
    const interval = setInterval(fetchOrder, 30000)
    return () => clearInterval(interval)
  }, [fetchOrder])

  // Handle order cancellation
  const handleCancelOrder = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const response = await fetchWithAuth(`${API_URL}/order/orders`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      })
      if (!response.ok) throw new Error('Failed to cancel order')
      toast.success('Поръчката е отменена успешно')
      clearCart()
      navigate('/')
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast.error('Неуспешно отменяне на поръчката')
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Зареждане на детайли за поръчката...</h2>
            <p className="text-muted-foreground">Моля изчакайте, докато зареждаме информацията за вашата поръчка.</p>
          </div>
        </div>
      </div>
    )
  }

  // No order found state
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Поръчката не е намерена</h2>
            <p className="text-muted-foreground mb-8">Поръчката, която търсите, не съществува.</p>
            <Button 
              onClick={() => navigate('/food')}
              className="mt-4"
            >
              Разгледай менюто
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main order tracking view
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Поръчката е направена!</h1>
          <p className="text-muted-foreground">Ето информацията за проследяване на вашата поръчка.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Детайли за поръчката</CardTitle>
              <CardDescription>Информация за вашата поръчка и данни за плащането</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">              <div className="flex justify-between items-center">
                <span className="font-medium">ID на поръчката</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {order.order_id.substring(0, 6)}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">Начин на плащане</span>
                <span className="capitalize">
                  {order.payment_method === 'cash' ? 'Кеш' : 
                   order.payment_method === 'card' ? 'Плащане с карта' : 
                   order.payment_method || 'Не е посочен'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-medium">Общо за поръчката</span>
                <span className="font-bold">{order.total_price ? formatDualCurrencyCompact(order.total_price) : '0.00 лв / €0.00'}</span>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Артикули от поръчката</h4>
                <div className="space-y-2">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div key={item.item_id} className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{item.item_name}</span>
                          <span>x{item.item_quantity}</span>
                        </div>
                        {item.applied_addons && item.applied_addons.length > 0 && (
                          <div className="text-xs text-muted-foreground pl-4">
                            <span className="font-medium">Добавки: </span>
                            {item.applied_addons.map((addon) => 
                              `${addon.name} (+${formatDualCurrencyCompact(addon.total)})`
                            ).join(', ')}
                          </div>
                        )}
                        {item.removables && item.removables.length > 0 && (
                          <div className="text-xs text-muted-foreground pl-4">
                            <span className="font-medium">Премахнато: </span>
                            {item.removables.join(', ')}
                          </div>
                        )}
                        {item.special_instructions && (
                          <div className="text-sm text-muted-foreground pl-4">
                            <span className="font-medium">Инструкции: </span>
                            {item.special_instructions}
                          </div>
                        )}
                      </div>
                    ))
                  ) : order.products && Object.entries(order.products).map(([productId, quantity]) => (
                    <div key={productId} className="space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{getItemNameById(productId)}</span>
                        <span>x{quantity}</span>
                      </div>
                      {order.instructions?.[productId] && (
                        <div className="text-sm text-muted-foreground pl-4">
                          <span className="font-medium">Инструкции: </span>
                          {order.instructions[productId]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">{order.delivery_method === 'delivery' ? 'Доставка' : 'Вземане'} Детайли</h4>
                <div className="text-sm text-muted-foreground">
                  <div>Метод: <span className="capitalize">{order.delivery_method === 'delivery' ? 'Доставка' : 'Вземане'}</span></div>
                  {order.address && <div>Адрес: {order.address}</div>}
                  {order.delivery_person_name && (
                    <>
                      <div>Куриер: {order.delivery_person_name}</div>
                      {order.delivery_person_phone && <div>Контакт: {order.delivery_person_phone}</div>}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Проследяване на поръчката</CardTitle>
              <CardDescription>Проследявайте статуса на вашата поръчка в реално време</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trackingSteps.map((step) => {
                  const Icon = step.icon
                  const stepStatus = getStepStatus(step.status, order.status)
                  const isCompleted = stepStatus === 'completed'
                  const isCurrent = stepStatus === 'current'
                  const isCancelled = stepStatus === 'cancelled'

                  return (
                    <div key={step.id} className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCancelled
                            ? "bg-red-100 text-red-600"
                            : isCompleted
                            ? "bg-green-100 text-green-600"
                            : isCurrent
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`font-medium ${
                              isCancelled
                                ? "text-red-600"
                                : isCompleted
                                ? "text-green-600"
                                : isCurrent
                                ? "text-blue-600"
                                : "text-gray-500"
                            }`}
                          >
                            {step.title}
                          </h4>
                          {isCompleted && (
                            <Badge variant="secondary" className="text-xs">
                              Завършено
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge className="text-xs">
                              {order.delivery_method === 'pickup' && step.status === 'Ready' ? 'Готово' : 'В процес'}
                            </Badge>
                          )}
                          {isCancelled && (
                            <Badge variant="destructive" className="text-xs">
                              Отменено
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{step.description}</p>
                        {order.estimated_delivery_time && step.status === 'Delivered' && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Очаквано: {new Date(order.estimated_delivery_time).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center space-x-4">
          {order.status === 'Pending' && (
            <Button variant="destructive" onClick={handleCancelOrder}>
              Отмени поръчката
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/food')}>
            Продължи пазаруването
          </Button>
        </div>
      </div>
    </div>
  )
}