import { useState, useEffect } from "react"
import { API_URL } from '@/config/api'
import { CartContext } from './cart'

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const savedCart = sessionStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }

    const savedOrderId = sessionStorage.getItem('orderId')
    if (savedOrderId) {
      setOrderId(savedOrderId)
    }
  }, [])

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id)
      let newItems
      if (existingItem) {
        newItems = prevItems.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        newItems = [...prevItems, { ...item, quantity: 1 }]
      }
      sessionStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== itemId)
      sessionStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) return
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
      sessionStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const clearCart = () => {
    setCartItems([])
    sessionStorage.removeItem('cart')
    sessionStorage.removeItem('orderId')
    setOrderId(null)
  }

  const checkout = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const restaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')

      if (!user?.access_token || !restaurant?.[0]) {
        throw new Error('User not logged in or no restaurant selected')
      }      const products = {}
      const instructions = {}
      cartItems.forEach(item => {
        products[item.id] = item.quantity
        if (item.specialInstructions) {
          instructions[item.id] = item.specialInstructions
        }
      })

      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },        body: JSON.stringify({
          restaurant_id: restaurant[0],
          products,
          instructions,
          payment_method: 'card',
          delivery_method: 'pickup',
          address: restaurant[1] // Adding restaurant address for pickup orders
        })
      })

      if (!response.ok) throw new Error('Failed to create order')
      
      const data = await response.json()
      setOrderId(data.order_id)
      sessionStorage.setItem('orderId', data.order_id)
      clearCart();
      return data
    } catch (error) {
      console.error('Error during checkout:', error)
      throw error
    }
  }

  const updateOrder = async (newItems) => {
    if (!orderId) return

    try {      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const products = {}
      const instructions = {}
      newItems.forEach(item => {
        products[item.id] = item.quantity
        if (item.specialInstructions) {
          instructions[item.id] = item.specialInstructions
        }
      })

      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },        body: JSON.stringify({
          order_id: orderId,
          products,
          instructions,
          delivery_method: 'pickup'
        })
      })

      if (!response.ok) throw new Error('Failed to update order')
      return await response.json()
    } catch (error) {
      console.error('Error updating order:', error)
      throw error
    }
  }

  const cancelOrder = async () => {
    if (!orderId) return

    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}')
      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderId
        })
      })

      if (!response.ok) throw new Error('Failed to cancel order')
      
      clearCart()
      return await response.json()
    } catch (error) {
      console.error('Error canceling order:', error)
      throw error
    }
  }

  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    updateOrder,
    cancelOrder,
    orderId
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}