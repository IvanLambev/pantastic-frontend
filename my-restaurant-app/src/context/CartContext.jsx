import { useState, useEffect } from "react"
import { API_URL } from '@/config/api'
import { CartContext } from './cart'

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }

    const savedOrderId = localStorage.getItem('orderId')
    if (savedOrderId) {
      setOrderId(savedOrderId)
    }
  }, [])

  const addToCart = (item) => {
    setCartItems(prevItems => {
      const quantityToAdd = Number(item?.quantity) > 0 ? Number(item.quantity) : 1
      const existingItem = prevItems.find(i => i.id === item.id)
      let newItems
      if (existingItem) {
        newItems = prevItems.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
        )
      } else {
        // Defensive: always use correct indices if item is an array
        let cartItem = { ...item };
        if (Array.isArray(item)) {
          cartItem = {
            id: item[0],
            originalItemId: item[0],
            name: item[6],
            price: Number(item[7]) || 0,
            image: item[5],
            description: item[4],
            quantity: 1
          };
        } else {
          cartItem = {
            ...cartItem,
            quantity: quantityToAdd
          }
        }

        if (!cartItem.originalItemId) {
          const idSource = cartItem.item_id || cartItem.id
          if (typeof idSource === 'string') {
            const match = idSource.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
            cartItem.originalItemId = match ? match[0] : idSource
          } else {
            cartItem.originalItemId = idSource
          }
        }
        newItems = [...prevItems, cartItem]
      }
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== itemId)
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity < 1) return
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
    localStorage.removeItem('orderId')
    setOrderId(null)
  }

  const checkout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const restaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '[]')

      // With cookie-based auth, we just need to check if user exists (has customer_id)
      // The backend will validate the HttpOnly cookie
      if (!user?.customer_id || !restaurant?.[0]) {
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
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          // New API expects: order_addons[item_id] = { addonName: price, ... }
          const addonsObj = {};
          item.selectedAddons.forEach(addon => {
            addonsObj[addon.name] = Number(addon.price);
          });
          order_addons[item.id] = addonsObj;
        }
      });

      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HttpOnly cookies
        body: JSON.stringify({
          restaurant_id: restaurant[0],
          products,
          instructions,
          order_addons,
          payment_method: 'card',
          delivery_method: 'pickup',
          address: restaurant[1]
        })
      });

      if (!response.ok) throw new Error('Failed to create order');

      const data = await response.json();
      setOrderId(data.order_id);
      localStorage.setItem('orderId', data.order_id);
      clearCart();
      return data;
    } catch (error) {
      console.error('Error during checkout:', error)
      throw error
    }
  }

  const updateOrder = async (newItems) => {
    if (!orderId) return

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
            addonsByName[addon.name] = (addonsByName[addon.name] || 0) + 1
          })
          order_addons[item.id] = addonsByName
        }
      })

      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HttpOnly cookies
        body: JSON.stringify({
          order_id: orderId,
          products,
          instructions,
          order_addons,
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
      const response = await fetch(`${API_URL}/order/orders`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send HttpOnly cookies
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

  const updateCartItem = (oldId, newItem) => {
    setCartItems(prevItems => {
      // Remove the old item
      const itemsWithoutOld = prevItems.filter(item => item.id !== oldId)

      // Check if the new item configuration already exists in the remaining items
      const existingItemIndex = itemsWithoutOld.findIndex(i => i.id === newItem.id)

      let newItems
      if (existingItemIndex > -1) {
        // If it exists, update the quantity
        newItems = [...itemsWithoutOld]
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + newItem.quantity
        }
      } else {
        // If it doesn't exist, add it as a new item
        newItems = [...itemsWithoutOld, newItem]
      }

      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
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
    updateCartItem,
    orderId
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}