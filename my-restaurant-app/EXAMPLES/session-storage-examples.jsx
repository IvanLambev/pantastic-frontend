/**
 * Example: Using the new session storage utilities
 * 
 * This file demonstrates how to use the sessionStorage utilities
 * instead of directly accessing sessionStorage/localStorage
 */

import {
  // Delivery methods
  getDeliveryAddress,
  setDeliveryAddress,
  getDeliveryCoordinates,
  setDeliveryCoordinates,
  getDeliveryMethod,
  setDeliveryMethod,
  
  // Restaurant methods
  getSelectedRestaurant,
  setSelectedRestaurant,
  
  // Cart methods
  getCart,
  setCart,
  
  // Order methods
  getOrderId,
  setOrderId,
  
  // Scheduled order methods
  getScheduledOrder,
  setScheduledOrder,
  getOrderSchedulingReason,
  setOrderSchedulingReason,
  getOrderScheduledDelivery,
  setOrderScheduledDelivery,
  
  // Cleanup methods
  clearCartData,
  clearDeliveryData,
  clearScheduledOrderData,
  clearAllSessionData
} from '@/utils/sessionStorage'

// Example 1: Setting and getting delivery information
export function ExampleDeliveryInfo() {
  const handleSetDelivery = () => {
    // OLD WAY:
    // sessionStorage.setItem('delivery_address', 'Sofia, Bulgaria')
    // sessionStorage.setItem('delivery_coordinates', JSON.stringify({lat: 42.7, lng: 23.3}))
    
    // NEW WAY:
    setDeliveryAddress('Sofia, Bulgaria')
    setDeliveryCoordinates({ latitude: 42.7, longitude: 23.3 })
    setDeliveryMethod('delivery')
  }
  
  const handleGetDelivery = () => {
    // OLD WAY:
    // const address = sessionStorage.getItem('delivery_address')
    // const coords = JSON.parse(sessionStorage.getItem('delivery_coordinates') || '{}')
    
    // NEW WAY:
    const address = getDeliveryAddress()
    const coords = getDeliveryCoordinates()
    const method = getDeliveryMethod()
    
    console.log({ address, coords, method })
  }
  
  return (
    <div>
      <button onClick={handleSetDelivery}>Set Delivery Info</button>
      <button onClick={handleGetDelivery}>Get Delivery Info</button>
    </div>
  )
}

// Example 2: Setting and getting restaurant
export function ExampleRestaurantSelection() {
  const handleSelectRestaurant = () => {
    // OLD WAY (array format):
    // sessionStorage.setItem('selectedRestaurant', JSON.stringify([
    //   'b5add894-8d03-422f-acce-0b0e44bb721b',
    //   'zh.k. Lyulin 1, bul. Pancho Vladigerov',
    //   'София',
    //   42.7267966,
    //   23.261824,
    //   'https://example.com/image.jpg',
    //   'Edin Resturant'
    // ]))
    
    // NEW WAY (object format - minimal data):
    setSelectedRestaurant({
      restaurant_id: 'b5add894-8d03-422f-acce-0b0e44bb721b',
      name: 'Edin Resturant',
      address: 'zh.k. Lyulin 1, bul. Pancho Vladigerov',
      city: 'София',
      latitude: 42.7267966,
      longitude: 23.261824
    })
  }
  
  const handleGetRestaurant = () => {
    // OLD WAY:
    // const restaurant = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')
    // const restaurantId = restaurant[0]
    // const restaurantName = restaurant[6]
    
    // NEW WAY:
    const restaurant = getSelectedRestaurant()
    console.log('Restaurant:', restaurant?.name)
    console.log('ID:', restaurant?.restaurant_id)
  }
  
  return (
    <div>
      <button onClick={handleSelectRestaurant}>Select Restaurant</button>
      <button onClick={handleGetRestaurant}>Get Restaurant</button>
    </div>
  )
}

// Example 3: Working with cart
export function ExampleCart() {
  const handleAddToCart = () => {
    // OLD WAY:
    // const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
    // cart.push({
    //   id: '123',
    //   name: 'Pancake',
    //   price: 12,
    //   quantity: 1,
    //   image: 'data:image/png;base64...', // LARGE!
    //   description: 'Very long description...' // UNNECESSARY!
    // })
    // sessionStorage.setItem('cart', JSON.stringify(cart))
    
    // NEW WAY (automatically strips images/descriptions):
    const currentCart = getCart()
    const newCart = [
      ...currentCart,
      {
        id: '123',
        name: 'Pancake',
        price: 12,
        quantity: 1,
        // image and description will be stripped automatically
        image: 'will-be-removed',
        description: 'will-be-removed'
      }
    ]
    setCart(newCart)
    
    // Result in localStorage will be:
    // [{"id":"123","name":"Pancake","price":12,"quantity":1}]
  }
  
  const handleGetCart = () => {
    // OLD WAY:
    // const cart = JSON.parse(sessionStorage.getItem('cart') || '[]')
    
    // NEW WAY:
    const cart = getCart()
    console.log('Cart items:', cart)
  }
  
  const handleClearCart = () => {
    // OLD WAY:
    // sessionStorage.removeItem('cart')
    // sessionStorage.removeItem('orderId')
    
    // NEW WAY:
    clearCartData()
  }
  
  return (
    <div>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <button onClick={handleGetCart}>Get Cart</button>
      <button onClick={handleClearCart}>Clear Cart</button>
    </div>
  )
}

// Example 4: Order scheduling
export function ExampleOrderScheduling() {
  const handleScheduleOrder = () => {
    // OLD WAY:
    // sessionStorage.setItem('scheduled_order', 'true')
    // sessionStorage.setItem('order_scheduling_reason', 'restaurant_closed')
    // sessionStorage.setItem('order_scheduled_delivery', '2025-11-03T10:00:00')
    
    // NEW WAY:
    setScheduledOrder(true)
    setOrderSchedulingReason('restaurant_closed')
    setOrderScheduledDelivery('2025-11-03T10:00:00')
  }
  
  const handleGetSchedule = () => {
    // OLD WAY:
    // const isScheduled = sessionStorage.getItem('scheduled_order') === 'true'
    // const reason = sessionStorage.getItem('order_scheduling_reason')
    // const time = sessionStorage.getItem('order_scheduled_delivery')
    
    // NEW WAY:
    const isScheduled = getScheduledOrder()
    const reason = getOrderSchedulingReason()
    const time = getOrderScheduledDelivery()
    
    console.log({ isScheduled, reason, time })
  }
  
  const handleClearSchedule = () => {
    // OLD WAY:
    // sessionStorage.removeItem('scheduled_order')
    // sessionStorage.removeItem('order_scheduling_reason')
    // sessionStorage.removeItem('order_scheduled_delivery')
    
    // NEW WAY:
    clearScheduledOrderData()
  }
  
  return (
    <div>
      <button onClick={handleScheduleOrder}>Schedule Order</button>
      <button onClick={handleGetSchedule}>Get Schedule</button>
      <button onClick={handleClearSchedule}>Clear Schedule</button>
    </div>
  )
}

// Example 5: Cleanup on logout
export function ExampleLogout() {
  const handleLogout = async () => {
    // OLD WAY:
    // sessionStorage.removeItem('user')
    // sessionStorage.removeItem('selectedRestaurant')
    // sessionStorage.removeItem('cart')
    // sessionStorage.removeItem('delivery_address')
    // ... etc
    
    // NEW WAY:
    import { logout } from '@/utils/cookieAuth'
    
    // Logout clears cookies AND localStorage
    await logout()
    
    // Or if you want to keep some data (like cart):
    // await logout()
    // Keep cart: don't call clearAllSessionData()
    
    // Or clear everything manually:
    // clearAllSessionData()
  }
  
  return (
    <button onClick={handleLogout}>Logout</button>
  )
}

/**
 * Migration Checklist for Each File:
 * 
 * 1. Find: sessionStorage.setItem('delivery_address', ...)
 *    Replace: setDeliveryAddress(...)
 * 
 * 2. Find: sessionStorage.getItem('delivery_address')
 *    Replace: getDeliveryAddress()
 * 
 * 3. Find: JSON.parse(sessionStorage.getItem('selectedRestaurant') || '[]')
 *    Replace: getSelectedRestaurant()
 * 
 * 4. Find: sessionStorage.setItem('cart', JSON.stringify(cart))
 *    Replace: setCart(cart)
 * 
 * 5. Find: sessionStorage.removeItem('cart'); sessionStorage.removeItem('orderId')
 *    Replace: clearCartData()
 * 
 * And so on...
 */
