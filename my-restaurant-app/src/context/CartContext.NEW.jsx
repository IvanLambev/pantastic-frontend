import { useState, useEffect } from "react"
import { CartContext } from './cart'
import { cookieApi } from "@/utils/cookieAuth"
import { 
  getCart, 
  setCart as saveCart, 
  getOrderId, 
  setOrderId as saveOrderId,
  clearCartData,
  getSelectedRestaurant 
} from "@/utils/sessionStorage"

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [orderId, setOrderIdState] = useState(null)

  // Load cart and orderId from localStorage on mount
  useEffect(() => {
    const savedCart = getCart()
    if (savedCart && savedCart.length > 0) {
      setCartItems(savedCart)
    }

    const savedOrderId = getOrderId()
    if (savedOrderId) {
      setOrderIdState(savedOrderId)
    }
  }, [])

  /**
   * Add item to cart
   * Stores minimal data (no images/descriptions) in localStorage
   */
  const addToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.id === item.id)
      let newItems
      
      if (existingItem) {
        newItems = prevItems.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      } else {
        // Handle both object and array formats
        let cartItem = { ...item }
        if (Array.isArray(item)) {
          cartItem = {
            id: item[0],
            name: item[6],
            price: Number(item[7]) || 0,
            quantity: 1
          }
        } else {
          // Strip out image and description to minimize storage
          cartItem = {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            ...(item.specialInstructions && { specialInstructions: item.specialInstructions }),
            ...(item.selectedAddons && { selectedAddons: item.selectedAddons })
          }
        }
        newItems = [...prevItems, cartItem]
      }
      
      // Save to localStorage (automatically strips images/descriptions)
      saveCart(newItems)
      return newItems
    })
  }

  /**
   * Remove item from cart
   */
  const removeFromCart = (itemId) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== itemId)
      saveCart(newItems)
      return newItems
    })
  }

  /**
   * Update item quantity
   */
  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) return
    
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
      saveCart(newItems)
      return newItems
    })
  }

  /**
   * Clear cart and order data
   */
  const clearCart = () => {
    setCartItems([])
    setOrderIdState(null)
    clearCartData()
  }

  /**
   * Checkout - create order using cookie authentication
   * No need to manually get/attach tokens - handled by cookies
   */
  const checkout = async (paymentMethod = 'card', deliveryMethod = 'pickup', address = null) => {
    try {
      const restaurant = getSelectedRestaurant()
      
      if (!restaurant || !restaurant.restaurant_id) {
        throw new Error('No restaurant selected')
      }

      // Prepare order data
      const products = {}
      const instructions = {}
      const order_addons = {}

      cartItems.forEach(item => {
        products[item.id] = item.quantity
        
        if (item.specialInstructions) {
          instructions[item.id] = item.specialInstructions
        }
        
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          const addonsObj = {}
          item.selectedAddons.forEach(addon => {
            addonsObj[addon.name] = Number(addon.price)
          })
          order_addons[item.id] = addonsObj
        }
      })

      // Make authenticated request using cookies
      const data = await cookieApi.post('/order/orders', {
        restaurant_id: restaurant.restaurant_id,
        products,
        instructions,
        order_addons,
        payment_method: paymentMethod,
        delivery_method: deliveryMethod,
        address: address || restaurant.address
      })

      // Save order ID
      setOrderIdState(data.order_id)
      saveOrderId(data.order_id)
      
      // Clear cart after successful checkout
      clearCart()
      
      return data
    } catch (error) {
      console.error('Error during checkout:', error)
      throw error
    }
  }

  /**
   * Update existing order
   */
  const updateOrder = async (newItems) => {
    if (!orderId) {
      throw new Error('No active order to update')
    }

    try {
      const products = {}
      const instructions = {}
      const order_addons = {}
      
      newItems.forEach(item => {
        products[item.id] = item.quantity
        
        if (item.specialInstructions) {
          instructions[item.id] = item.specialInstructions
        }
        
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          const addonsByName = {}
          item.selectedAddons.forEach(addon => {
            addonsByName[addon.name] = Number(addon.price)
          })
          order_addons[item.id] = addonsByName
        }
      })

      // Make authenticated request using cookies
      const data = await cookieApi.put('/order/orders', {
        order_id: orderId,
        products,
        instructions,
        order_addons,
        delivery_method: 'pickup'
      })

      return data
    } catch (error) {
      console.error('Error updating order:', error)
      throw error
    }
  }

  /**
   * Cancel existing order
   */
  const cancelOrder = async () => {
    if (!orderId) {
      throw new Error('No active order to cancel')
    }

    try {
      // Make authenticated request using cookies
      const data = await cookieApi.delete('/order/orders', {
        body: JSON.stringify({ order_id: orderId })
      })
      
      clearCart()
      return data
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
