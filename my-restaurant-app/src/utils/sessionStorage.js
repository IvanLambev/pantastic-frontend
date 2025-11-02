/**
 * Session Storage Utility
 * Manages non-sensitive session data in localStorage for persistence across tabs
 * As per the migration to HttpOnly cookie authentication:
 * - Auth tokens are now in HttpOnly cookies (not accessible via JS)
 * - This utility manages only non-sensitive session data
 */

/**
 * Session data structure stored in localStorage
 */
const SESSION_KEYS = {
  DELIVERY_ADDRESS: 'delivery_address',
  DELIVERY_COORDINATES: 'delivery_coordinates',
  DELIVERY_METHOD: 'delivery_method',
  SELECTED_RESTAURANT: 'selectedRestaurant',
  CART: 'cart',
  ORDER_ID: 'orderId',
  SCHEDULED_ORDER: 'scheduled_order',
  ORDER_SCHEDULING_REASON: 'order_scheduling_reason',
  ORDER_SCHEDULED_DELIVERY: 'order_scheduled_delivery',
}

/**
 * Get delivery address from localStorage
 */
export function getDeliveryAddress() {
  return localStorage.getItem(SESSION_KEYS.DELIVERY_ADDRESS) || ''
}

/**
 * Set delivery address in localStorage
 */
export function setDeliveryAddress(address) {
  if (address) {
    localStorage.setItem(SESSION_KEYS.DELIVERY_ADDRESS, address)
  } else {
    localStorage.removeItem(SESSION_KEYS.DELIVERY_ADDRESS)
  }
}

/**
 * Get delivery coordinates from localStorage
 */
export function getDeliveryCoordinates() {
  try {
    const coords = localStorage.getItem(SESSION_KEYS.DELIVERY_COORDINATES)
    return coords ? JSON.parse(coords) : null
  } catch (error) {
    console.error('Error parsing delivery coordinates:', error)
    return null
  }
}

/**
 * Set delivery coordinates in localStorage
 */
export function setDeliveryCoordinates(coordinates) {
  if (coordinates && coordinates.latitude && coordinates.longitude) {
    localStorage.setItem(SESSION_KEYS.DELIVERY_COORDINATES, JSON.stringify(coordinates))
  } else {
    localStorage.removeItem(SESSION_KEYS.DELIVERY_COORDINATES)
  }
}

/**
 * Get delivery method from localStorage
 */
export function getDeliveryMethod() {
  return localStorage.getItem(SESSION_KEYS.DELIVERY_METHOD) || 'pickup'
}

/**
 * Set delivery method in localStorage
 */
export function setDeliveryMethod(method) {
  if (method) {
    localStorage.setItem(SESSION_KEYS.DELIVERY_METHOD, method)
  } else {
    localStorage.removeItem(SESSION_KEYS.DELIVERY_METHOD)
  }
}

/**
 * Get selected restaurant from localStorage
 */
export function getSelectedRestaurant() {
  try {
    const restaurant = localStorage.getItem(SESSION_KEYS.SELECTED_RESTAURANT)
    return restaurant ? JSON.parse(restaurant) : null
  } catch (error) {
    console.error('Error parsing selected restaurant:', error)
    return null
  }
}

/**
 * Set selected restaurant in localStorage
 * Stores minimal info: restaurant_id, name, address, city, latitude, longitude
 */
export function setSelectedRestaurant(restaurant) {
  if (restaurant) {
    // Store only necessary fields
    const minimalRestaurant = {
      restaurant_id: restaurant.restaurant_id || restaurant[0],
      name: restaurant.name || restaurant[6],
      address: restaurant.address || restaurant[1],
      city: restaurant.city || restaurant[2],
      latitude: restaurant.latitude || restaurant[3],
      longitude: restaurant.longitude || restaurant[4]
    }
    localStorage.setItem(SESSION_KEYS.SELECTED_RESTAURANT, JSON.stringify(minimalRestaurant))
  } else {
    localStorage.removeItem(SESSION_KEYS.SELECTED_RESTAURANT)
  }
}

/**
 * Get cart from localStorage
 * Cart items contain only: id, name, price, quantity
 * NO images or descriptions to minimize storage
 */
export function getCart() {
  try {
    const cart = localStorage.getItem(SESSION_KEYS.CART)
    return cart ? JSON.parse(cart) : []
  } catch (error) {
    console.error('Error parsing cart:', error)
    return []
  }
}

/**
 * Set cart in localStorage
 * Automatically strips out images and descriptions to minimize storage
 */
export function setCart(cartItems) {
  if (cartItems && Array.isArray(cartItems)) {
    // Strip out large fields like images and descriptions
    const minimalCart = cartItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      // Include addons and instructions as they're small
      ...(item.specialInstructions && { specialInstructions: item.specialInstructions }),
      ...(item.selectedAddons && { selectedAddons: item.selectedAddons })
    }))
    localStorage.setItem(SESSION_KEYS.CART, JSON.stringify(minimalCart))
  } else {
    localStorage.removeItem(SESSION_KEYS.CART)
  }
}

/**
 * Get order ID from localStorage
 */
export function getOrderId() {
  return localStorage.getItem(SESSION_KEYS.ORDER_ID) || null
}

/**
 * Set order ID in localStorage
 */
export function setOrderId(orderId) {
  if (orderId) {
    localStorage.setItem(SESSION_KEYS.ORDER_ID, orderId)
  } else {
    localStorage.removeItem(SESSION_KEYS.ORDER_ID)
  }
}

/**
 * Get scheduled order flag
 */
export function getScheduledOrder() {
  return localStorage.getItem(SESSION_KEYS.SCHEDULED_ORDER) === 'true'
}

/**
 * Set scheduled order flag
 */
export function setScheduledOrder(isScheduled) {
  if (isScheduled) {
    localStorage.setItem(SESSION_KEYS.SCHEDULED_ORDER, 'true')
  } else {
    localStorage.removeItem(SESSION_KEYS.SCHEDULED_ORDER)
  }
}

/**
 * Get order scheduling reason
 */
export function getOrderSchedulingReason() {
  return localStorage.getItem(SESSION_KEYS.ORDER_SCHEDULING_REASON) || ''
}

/**
 * Set order scheduling reason
 */
export function setOrderSchedulingReason(reason) {
  if (reason) {
    localStorage.setItem(SESSION_KEYS.ORDER_SCHEDULING_REASON, reason)
  } else {
    localStorage.removeItem(SESSION_KEYS.ORDER_SCHEDULING_REASON)
  }
}

/**
 * Get order scheduled delivery time
 */
export function getOrderScheduledDelivery() {
  return localStorage.getItem(SESSION_KEYS.ORDER_SCHEDULED_DELIVERY) || null
}

/**
 * Set order scheduled delivery time
 */
export function setOrderScheduledDelivery(deliveryTime) {
  if (deliveryTime) {
    localStorage.setItem(SESSION_KEYS.ORDER_SCHEDULED_DELIVERY, deliveryTime)
  } else {
    localStorage.removeItem(SESSION_KEYS.ORDER_SCHEDULED_DELIVERY)
  }
}

/**
 * Clear all cart-related data
 */
export function clearCartData() {
  localStorage.removeItem(SESSION_KEYS.CART)
  localStorage.removeItem(SESSION_KEYS.ORDER_ID)
}

/**
 * Clear all scheduled order data
 */
export function clearScheduledOrderData() {
  localStorage.removeItem(SESSION_KEYS.SCHEDULED_ORDER)
  localStorage.removeItem(SESSION_KEYS.ORDER_SCHEDULING_REASON)
  localStorage.removeItem(SESSION_KEYS.ORDER_SCHEDULED_DELIVERY)
}

/**
 * Clear all delivery-related data
 */
export function clearDeliveryData() {
  localStorage.removeItem(SESSION_KEYS.DELIVERY_ADDRESS)
  localStorage.removeItem(SESSION_KEYS.DELIVERY_COORDINATES)
  localStorage.removeItem(SESSION_KEYS.DELIVERY_METHOD)
}

/**
 * Clear all session data (useful on logout if needed)
 * Note: This does NOT clear authentication - that's handled by HttpOnly cookies
 */
export function clearAllSessionData() {
  Object.values(SESSION_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}

/**
 * Get all session data as an object (for debugging)
 */
export function getAllSessionData() {
  return {
    deliveryAddress: getDeliveryAddress(),
    deliveryCoordinates: getDeliveryCoordinates(),
    deliveryMethod: getDeliveryMethod(),
    selectedRestaurant: getSelectedRestaurant(),
    cart: getCart(),
    orderId: getOrderId(),
    scheduledOrder: getScheduledOrder(),
    orderSchedulingReason: getOrderSchedulingReason(),
    orderScheduledDelivery: getOrderScheduledDelivery()
  }
}
