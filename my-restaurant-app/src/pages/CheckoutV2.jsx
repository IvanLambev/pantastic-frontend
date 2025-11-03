import { useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL, FRONTEND_BASE_URL } from "@/config/api"
import { toast } from "sonner"
import { CreditCard, DollarSign, ArrowLeft, Check, Minus, Plus, Trash2, Edit, MapPin, Store, X, Calendar as CalendarIcon, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import OrderConfirmation from "@/components/OrderConfirmation"
import DeliverySchedulingBanner from "@/components/DeliverySchedulingBanner"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { t } from "@/utils/translations"
import { openInMaps } from "@/utils/mapsHelper"
import { api } from "@/utils/apiClient"

// Utility functions for restaurant status
function isRestaurantOpen(restaurant) {
  if (!restaurant) return false;
  
  // Get current time in GMT+3
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + 3 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = days[gmt3.getDay()];
  
  const hours = (Array.isArray(restaurant) ? restaurant[9] : restaurant.opening_hours) || {};
  const todayHours = hours[currentDay];
  
  if (!todayHours) return false;
  
  try {
    // Format: "09:00-18:00" or "10:00-03:00" (crosses midnight)
    const [open, close] = todayHours.split("-");
    const [openH, openM] = open.split(":").map(Number);
    const [closeH, closeM] = close.split(":").map(Number);
    
    const currentTime = gmt3.getHours() * 60 + gmt3.getMinutes(); // Current time in minutes
    const openTime = openH * 60 + openM; // Opening time in minutes
    const closeTime = closeH * 60 + closeM; // Closing time in minutes
    
    // Check if the restaurant closes the next day (e.g., 10:00-03:00)
    if (closeTime < openTime) {
      // Restaurant is open if current time is after opening OR before closing (next day)
      return currentTime >= openTime || currentTime <= closeTime;
    } else {
      // Normal case: restaurant opens and closes on the same day
      return currentTime >= openTime && currentTime <= closeTime;
    }
  } catch (error) {
    console.error("Error parsing restaurant hours:", error);
    return false;
  }
}

function getNextOpenTime(restaurant) {
  if (!restaurant) return null;
  
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + 3 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const hours = (Array.isArray(restaurant) ? restaurant[9] : restaurant.opening_hours) || {};
  
  // Check today and next few days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(gmt3);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayName = days[checkDate.getDay()];
    
    const dayHours = hours[dayName];
    
    if (dayHours) {
      try {
        const [open] = dayHours.split("-");
        const [openH, openM] = open.split(":").map(Number);
        const openTime = new Date(checkDate);
        openTime.setHours(openH, openM, 0, 0);
        
        // If it's today, make sure the opening time is in the future
        if (dayOffset === 0 && openTime <= gmt3) continue;
        
        if (dayOffset === 0) {
          return `${t('time.today')} ${t('time.at')} ${open}`;
        } else if (dayOffset === 1) {
          return `${t('time.tomorrow')} ${t('time.at')} ${open}`;
        } else {
          return `${dayName} ${t('time.at')} ${open}`;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

export default function CheckoutV2() {
  const navigate = useNavigate()
  const { cartItems, clearCart, updateQuantity, removeFromCart } = useCart()
  const [selectedPayment, setSelectedPayment] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddressEdit, setShowAddressEdit] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  
  // Guest checkout states
  const [isGuest, setIsGuest] = useState(false)
  const [guestData, setGuestData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    city: "",
    password: ""
  })
  const [guestRegistering, setGuestRegistering] = useState(false)
  const [guestError, setGuestError] = useState("")
  
  // Discount states
  const [discountCode, setDiscountCode] = useState("")
  const [discountInfo, setDiscountInfo] = useState(null)
  const [discountValidating, setDiscountValidating] = useState(false)
  const [discountError, setDiscountError] = useState("")
  
  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false)
  const [selectedDate, setSelectedDate] = useState(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [, setDeliverySchedule] = useState(null)
  const debounceTimeoutRef = useRef(null)
  
  // Memoized callback to prevent infinite re-renders
  const handleScheduleSelect = useCallback((schedule) => {
    console.log('handleScheduleSelect called with:', schedule);
    
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the actual update
    debounceTimeoutRef.current = setTimeout(() => {
      // Don't update if the schedule is the same as current
      const currentSchedule = sessionStorage.getItem('order_scheduled_delivery');
      const newScheduleString = JSON.stringify(schedule);
      
      if (currentSchedule === newScheduleString) {
        return; // No change, skip update
      }
      
      if (schedule && schedule.isScheduled) {
        setDeliverySchedule(schedule);
        setIsScheduled(true);
        // Store scheduling info for order processing
        sessionStorage.setItem('order_scheduled_delivery', newScheduleString);
      } else {
        setDeliverySchedule(null);
        setIsScheduled(false);
        sessionStorage.removeItem('order_scheduled_delivery');
      }
    }, 100); // 100ms debounce
  }, []);
  
  // Get delivery information from sessionStorage
  const deliveryAddress = sessionStorage.getItem('delivery_address')
  const deliveryMethod = sessionStorage.getItem('delivery_method') || 'pickup'
  const selectedRestaurant = JSON.parse(localStorage.getItem('selectedRestaurant') || '[]')
  const isScheduledOrder = sessionStorage.getItem('scheduled_order') === 'true'
  
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  // User is logged in if they have either access_token OR customer_id
  const isLoggedIn = !!(user?.access_token || user?.customer_id)
  
  // Check if restaurant is currently open
  const isOpen = isRestaurantOpen(selectedRestaurant)
  const nextOpenTime = !isOpen ? getNextOpenTime(selectedRestaurant) : null
  
  // Get delivery coordinates from sessionStorage
  const getDeliveryCoordinates = () => {
    const coordinates = sessionStorage.getItem('delivery_coordinates')
    return coordinates ? JSON.parse(coordinates) : { latitude: null, longitude: null }
  }

  // Calculate subtotal in BGN (without delivery fee)
  const calculateSubtotalBGN = () => {
    return cartItems.reduce((sum, item) => {
      const addOnsTotal = item.addOns ? 
        item.addOns.reduce((addOnSum, addOn) => addOnSum + addOn.price, 0) : 0;
      return sum + (item.price * item.quantity) + (addOnsTotal * item.quantity);
    }, 0);
  };

  // Calculate discount amount in BGN
  const calculateDiscountAmountBGN = () => {
    if (!discountInfo || !discountInfo.valid) return 0;
    const subtotal = calculateSubtotalBGN();
    return (subtotal * discountInfo.discount_percentage) / 100;
  };

  // Calculate total in BGN (with discount and delivery fee)
  const calculateTotalBGN = () => {
    const subtotal = calculateSubtotalBGN();
    const discountAmount = calculateDiscountAmountBGN();
    const deliveryFee = deliveryMethod === 'delivery' ? 9.78 : 0; // ~5 EUR in BGN
    return subtotal - discountAmount + deliveryFee;
  };



  // Handle address editing
  const handleAddressEdit = () => {
    setNewAddress(deliveryAddress || "")
    setShowAddressEdit(true)
  }

  const handleAddressSave = () => {
    if (newAddress.trim()) {
      // Normalize the address by removing special characters except commas
      const normalizedAddress = newAddress.trim().replace(/['"„"«»]/g, '').replace(/[^\w\s,.-]/g, '').trim()
      
      sessionStorage.setItem('delivery_address', normalizedAddress)
      
      // Note: When manually editing address, coordinates are cleared since we don't have exact coordinates
      // The user should use the map to set precise coordinates if needed
      sessionStorage.removeItem('delivery_coordinates')
      
      setShowAddressEdit(false)
    }
  }

  // Helper functions for scheduling
  const getAvailableTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }

  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 3) // 3 days ahead
    date.setHours(0, 0, 0, 0)
    return date < today || date > maxDate
  }

  // Discount validation function
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError(t('checkout.enterDiscountCodeError'))
      return
    }

    setDiscountValidating(true)
    setDiscountError("")

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (!user.customer_id) {
        setDiscountError(t('checkout.loginToApplyDiscount'))
        setDiscountValidating(false)
        return
      }

      const data = await api.post('/order/discount/validate', { 
        discount_code: discountCode.trim() 
      })

      if (data.valid) {
        setDiscountInfo(data)
        setDiscountError("")
        toast.success(data.message)
      } else {
        setDiscountError(data.message || t('checkout.invalidDiscountCode'))
        setDiscountInfo(null)
      }
    } catch (error) {
      console.error('Error validating discount:', error)
      setDiscountError(t('checkout.discountValidationError'))
      setDiscountInfo(null)
    } finally {
      setDiscountValidating(false)
    }
  }

  // Remove discount function
  const removeDiscount = () => {
    setDiscountCode("")
    setDiscountInfo(null)
    setDiscountError("")
  }

  // Guest registration function
  const handleGuestRegister = async () => {
    // Validate guest data
    if (!guestData.email || !guestData.first_name || !guestData.last_name || 
        !guestData.phone || !guestData.city || !guestData.password) {
      setGuestError("All fields are required")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestData.email)) {
      setGuestError("Please enter a valid email address")
      return
    }

    // Phone validation (Bulgarian format)
    const phoneRegex = /^\+359\d{9}$/
    if (!phoneRegex.test(guestData.phone)) {
      setGuestError("Phone must be in format: +359888000000")
      return
    }

    // Password validation
    if (guestData.password.length < 8) {
      setGuestError("Password must be at least 8 characters long")
      return
    }

    setGuestRegistering(true)
    setGuestError("")

    try {
      const response = await fetch(`${API_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(guestData)
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      const isJson = contentType && contentType.includes('application/json')

      if (!response.ok) {
        // Handle non-JSON responses (like 404 HTML pages)
        if (!isJson) {
          if (response.status === 404) {
            throw new Error("Quick registration is currently unavailable. Please use the Sign Up button above to create an account.")
          }
          if (response.status === 500) {
            throw new Error("Server error occurred. Please try again in a few moments.")
          }
          throw new Error(`Registration failed (Error ${response.status}). Please try the Sign Up option above.`)
        }

        // Parse JSON error response
        const errorData = await response.json()
        
        // Handle specific error messages from API
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            throw new Error(errorData.detail)
          } else if (Array.isArray(errorData.detail)) {
            // FastAPI validation errors
            const errorMessages = errorData.detail.map(err => err.msg || err.message).join(', ')
            throw new Error(errorMessages)
          }
        }
        
        throw new Error("Registration failed. Please check your information and try again.")
      }

      // Parse successful response
      if (!isJson) {
        throw new Error("Unexpected response from server")
      }

      const data = await response.json()
      
      // Validate response data
      if (!data.access_token) {
        throw new Error("Registration completed but login failed. Please sign in manually.")
      }

      // Save the access token to sessionStorage
      localStorage.setItem('user', JSON.stringify({
        access_token: data.access_token,
        token_type: data.token_type || 'bearer'
      }))

      // Reset guest state
      setIsGuest(false)
      setGuestData({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        city: "",
        password: ""
      })

      toast.success(t('checkout.accountCreatedSuccess'))
      
      // Proceed with order confirmation
      setShowOrderConfirmation(true)
    } catch (error) {
      console.error('Guest registration error:', error)
      
      // Display user-friendly error messages
      let errorMessage = t('checkout.accountCreationError')
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = t('checkout.networkError')
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setGuestError(errorMessage)
      toast.error(t('checkout.failedToCreateAccount'))
    } finally {
      setGuestRegistering(false)
    }
  }

  const getScheduledDeliveryTime = () => {
    // Check if there's a scheduled delivery from the banner component
    const scheduledDelivery = sessionStorage.getItem('order_scheduled_delivery');
    if (scheduledDelivery) {
      try {
        const schedule = JSON.parse(scheduledDelivery);
        if (schedule.timeSlot && schedule.timeSlot.start) {
          return new Date(schedule.timeSlot.start).toISOString();
        }
      } catch (error) {
        console.error('Error parsing scheduled delivery:', error);
      }
    }
    
    // Fallback to manual scheduling
    if (!isScheduled || !selectedDate || !selectedTime) return null;
    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":");
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return scheduledDateTime.toISOString();
  }

  const paymentMethods = [
    {
      id: "card",
      name: t('checkout.payment.card'),
      description: t('checkout.payment.cardDesc'),
      icon: CreditCard,
      available: true,
    },
    {
      id: "cash",
      name: t('checkout.payment.cash'),
      description: t('checkout.payment.cashDesc'),
      icon: DollarSign,
      available: true,
    },
  ]

  const handleCheckout = () => {
    setShowOrderConfirmation(true)
  }

  const handleOrderConfirm = async () => {
    setIsProcessing(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      // With cookie-based auth, check for customer_id instead of access_token
      if (!user?.customer_id || selectedRestaurant.length === 0) {
        throw new Error('User not logged in or no restaurant selected')
      }

      // Format order items according to new API structure
      const orderItems = []
      
      // Group items by their original item ID to combine quantities and addons/removables
      const groupedItems = {}
      
      cartItems.forEach(item => {
        const itemId = item.originalItemId || item.id
        
        if (!groupedItems[itemId]) {
          groupedItems[itemId] = {
            item_id: itemId,
            quantity: 0,
            addons: {},
            removables: [],
            special_instructions: null
          }
        }
        
        // Add quantity
        groupedItems[itemId].quantity += item.quantity
        
        // Add addons (count occurrences)
        if (item.selectedAddons && item.selectedAddons.length > 0) {
          item.selectedAddons.forEach(addon => {
            groupedItems[itemId].addons[addon.name] = (groupedItems[itemId].addons[addon.name] || 0) + item.quantity
          })
        }
        
        // Add removables (unique list)
        if (item.selectedRemovables && item.selectedRemovables.length > 0) {
          item.selectedRemovables.forEach(removable => {
            if (!groupedItems[itemId].removables.includes(removable)) {
              groupedItems[itemId].removables.push(removable)
            }
          })
        }
        
        // Add special instructions
        if (item.specialInstructions) {
          groupedItems[itemId].special_instructions = item.specialInstructions
        }
      })
      
      // Convert grouped items to order items format
      Object.values(groupedItems).forEach(groupedItem => {
        const orderItem = {
          item_id: groupedItem.item_id,
          quantity: groupedItem.quantity,
          addons: Object.keys(groupedItem.addons).length > 0 ? groupedItem.addons : null,
          removables: groupedItem.removables.length > 0 ? groupedItem.removables : null,
          special_instructions: groupedItem.special_instructions
        }
        orderItems.push(orderItem)
      })

      // Get delivery coordinates if delivery method is delivery
      const coordinates = getDeliveryCoordinates()

      const orderData = {
        restaurant_id: Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant.restaurant_id,
        order_items: orderItems,
        discount: discountInfo && discountInfo.valid ? discountCode.trim() : null,
        payment_method: selectedPayment,
        delivery_method: deliveryMethod,
        address: deliveryMethod === 'pickup' ? null : deliveryAddress,
        latitude: deliveryMethod === 'delivery' && coordinates.latitude ? coordinates.latitude : null,
        longitude: deliveryMethod === 'delivery' && coordinates.longitude ? coordinates.longitude : null,
        scheduled_delivery_time: getScheduledDeliveryTime(),
        success_url: `${FRONTEND_BASE_URL}/payment-success`,
        cancel_url: `${FRONTEND_BASE_URL}/cart`
      }

      console.log('Placing order with:', orderData)

      const data = await api.post('/order/orders', orderData)

      if (!data.order_id) throw new Error('No order ID received')
      
      // Clean up scheduling session data
      sessionStorage.removeItem('scheduled_order');
      sessionStorage.removeItem('order_scheduling_reason');
      sessionStorage.removeItem('order_scheduled_delivery');
      
      // Clean up discount data
      setDiscountCode("");
      setDiscountInfo(null);
      setDiscountError("");

      // Handle different payment methods
      if (selectedPayment === 'cash') {
        // Cash payment - redirect directly to order tracking
        clearCart()
        cartItems.forEach(item => {
          sessionStorage.removeItem(`item-instructions-${item.id}`);
        });
        toast.success(t('checkout.orderPlacedSuccess'))
        navigate(`/order-tracking-v2/${data.order_id}`)
      } else if (selectedPayment === 'card') {
        // Card payment - save payment info and redirect to payment URL
        if (!data.payment_url || !data.payment_id) {
          throw new Error('Payment information missing')
        }
        
        // Save payment info to session storage
        sessionStorage.setItem('pending_order_id', data.order_id)
        sessionStorage.setItem('pending_payment_id', data.payment_id)
        
        // Clear cart before redirecting to payment
        clearCart()
        cartItems.forEach(item => {
          sessionStorage.removeItem(`item-instructions-${item.id}`);
        });
        
        // Redirect to payment URL
        window.location.href = data.payment_url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(error.message || t('checkout.failedToPlaceOrder'))
    } finally {
      setIsProcessing(false)
      setShowOrderConfirmation(false)
    }
  }

  const handleOrderConfirmationClose = () => {
    setShowOrderConfirmation(false)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('cart.empty')}</h2>
          <Button onClick={() => navigate('/food')}>
            {t('cart.continueShopping')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{t('checkout.title')}</h1>
              <p className="text-muted-foreground">{t('checkout.subtitle')}</p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Discount Code */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.discountCode')}</CardTitle>
                  <CardDescription>{t('checkout.discountCodeDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!discountInfo ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('checkout.enterDiscountCode')}
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && validateDiscountCode()}
                          disabled={discountValidating}
                        />
                        <Button 
                          onClick={validateDiscountCode}
                          disabled={!discountCode.trim() || discountValidating}
                          size="default"
                        >
                          {discountValidating ? t('checkout.checking') : t('checkout.apply')}
                        </Button>
                      </div>
                      {discountError && (
                        <p className="text-sm text-red-600">{discountError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {discountCode} - {discountInfo.discount_percentage}% off
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={removeDiscount}
                          className="text-green-600 hover:text-green-800"
                        >
                          {t('checkout.remove')}
                        </Button>
                      </div>
                      <p className="text-sm text-green-600">{discountInfo.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Guest Checkout Section - Only show if not logged in */}
              {!isLoggedIn && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('checkout.accountRequired')}</CardTitle>
                    <CardDescription>{t('checkout.accountRequiredDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!isGuest ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="default"
                            className="flex-1"
                            onClick={() => navigate('/login', { state: { from: '/checkout-v2' } })}
                          >
                            {t('nav.login')}
                          </Button>
                          <Button 
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate('/signup', { state: { from: '/checkout-v2' } })}
                          >
                            {t('nav.signup')}
                          </Button>
                        </div>
                        
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span>
                          </div>
                        </div>
                        
                        <Button 
                          variant="secondary"
                          className="w-full"
                          onClick={() => setIsGuest(true)}
                        >
                          {t('checkout.createAccountAndCheckout')}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first_name">{t('checkout.guest.firstName')} *</Label>
                            <Input
                              id="first_name"
                              placeholder={t('checkout.guest.firstNamePlaceholder')}
                              value={guestData.first_name}
                              onChange={(e) => setGuestData({ ...guestData, first_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="last_name">{t('checkout.guest.lastName')} *</Label>
                            <Input
                              id="last_name"
                              placeholder={t('checkout.guest.lastNamePlaceholder')}
                              value={guestData.last_name}
                              onChange={(e) => setGuestData({ ...guestData, last_name: e.target.value })}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="email">{t('checkout.guest.email')} *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t('checkout.guest.emailPlaceholder')}
                            value={guestData.email}
                            onChange={(e) => setGuestData({ ...guestData, email: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone">{t('checkout.guest.phone')} *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder={t('checkout.guest.phonePlaceholder')}
                            value={guestData.phone}
                            onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{t('checkout.guest.phoneFormat')}</p>
                        </div>
                        
                        <div>
                          <Label htmlFor="city">{t('checkout.guest.city')} *</Label>
                          <Input
                            id="city"
                            placeholder={t('checkout.guest.cityPlaceholder')}
                            value={guestData.city}
                            onChange={(e) => setGuestData({ ...guestData, city: e.target.value })}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="password">{t('checkout.guest.password')} *</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder={t('checkout.guest.passwordPlaceholder')}
                            value={guestData.password}
                            onChange={(e) => setGuestData({ ...guestData, password: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground mt-1">{t('checkout.guest.passwordHint')}</p>
                        </div>
                        
                        {guestError && (
                          <p className="text-sm text-red-600">{guestError}</p>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setIsGuest(false)
                              setGuestData({
                                email: "",
                                first_name: "",
                                last_name: "",
                                phone: "",
                                city: "",
                                password: ""
                              })
                              setGuestError("")
                            }}
                            disabled={guestRegistering}
                          >
                            {t('common.back')}
                          </Button>
                          <Button
                            variant="default"
                            className="flex-1"
                            onClick={handleGuestRegister}
                            disabled={guestRegistering}
                          >
                            {guestRegistering ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t('checkout.creatingAccount')}
                              </div>
                            ) : (
                              t('checkout.createAccountAndContinue')
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.paymentMethod')}</CardTitle>
                  <CardDescription>{t('checkout.paymentMethodDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                    <div className="space-y-4">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon
                        return (
                          <div key={method.id} className="flex items-center space-x-3">
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label
                              htmlFor={method.id}
                              className="flex items-center gap-3 cursor-pointer flex-1 p-4 rounded-lg border hover:bg-accent transition-colors"
                            >
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{method.name}</div>
                                <div className="text-sm text-muted-foreground">{method.description}</div>
                              </div>
                              {method.available && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('checkout.available')}
                                </Badge>
                              )}
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              {deliveryMethod === 'delivery' && deliveryAddress && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {t('checkout.deliveryAddress')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p 
                          className="font-medium hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={() => openInMaps(deliveryAddress)}
                        >
                          {deliveryAddress}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('checkout.deliveryToAddress')}
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddressEdit}
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        {t('common.edit')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Restaurant Information for Pickup */}
              {deliveryMethod === 'pickup' && selectedRestaurant.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {t('checkout.pickupLocation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{Array.isArray(selectedRestaurant) ? selectedRestaurant[8] : selectedRestaurant.name}</p>
                      <p 
                        className="text-sm text-muted-foreground hover:text-blue-600 hover:underline cursor-pointer"
                        onClick={() => {
                          const address = Array.isArray(selectedRestaurant) ? selectedRestaurant[1] : selectedRestaurant.address;
                          const city = Array.isArray(selectedRestaurant) ? selectedRestaurant[3] : selectedRestaurant.city;
                          openInMaps(address, city);
                        }}
                      >
                        {Array.isArray(selectedRestaurant) ? selectedRestaurant[1] : selectedRestaurant.address}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Scheduling Banner - Only show when restaurant is open */}
              {selectedRestaurant.length > 0 && isOpen && (
                <DeliverySchedulingBanner
                  restaurant={selectedRestaurant}
                  onScheduleSelect={handleScheduleSelect}
                  className="mb-4"
                />
              )}

              {/* Manual Order Scheduling (fallback) - Only show when restaurant is open */}
              {!isScheduledOrder && isOpen && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      {t('checkout.orderTiming')}
                    </CardTitle>
                    <CardDescription>
                      {t('checkout.orderTimingDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="schedule-order" 
                        checked={isScheduled}
                        onCheckedChange={setIsScheduled}
                      />
                      <Label htmlFor="schedule-order">{t('checkout.scheduleForLater')}</Label>
                    </div>
                    
                    {isScheduled && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date-picker">Date</Label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  id="date-picker"
                                  className="w-full justify-start font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={(date) => {
                                    setSelectedDate(date)
                                    setSelectedTime("") // Reset time when date changes
                                    setCalendarOpen(false)
                                  }}
                                  disabled={isDateDisabled}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="time-picker">Time</Label>
                            <select
                              id="time-picker"
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                              disabled={!selectedDate}
                            >
                              <option value="" disabled>Select time</option>
                              {getAvailableTimeSlots().map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• You can schedule orders up to 3 days in advance</p>
                          <p>• Available times: 08:00 - 22:30</p>
                          <p>• Times are in 30-minute intervals</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t('cart.orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          
                          {/* Display addons */}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="text-sm text-green-600 mt-1">
                              <span className="font-medium">{t('cart.addons')}: </span>
                              {item.selectedAddons.map((addon, index) => (
                                <span key={index}>
                                  {addon.name} (+{formatDualCurrencyCompact(addon.price)})
                                  {index < item.selectedAddons.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Display removables */}
                          {item.selectedRemovables && item.selectedRemovables.length > 0 && (
                            <div className="text-sm text-red-600 mt-1">
                              <span className="font-medium">{t('menu.removed')}: </span>
                              {item.selectedRemovables.map((removable, index) => (
                                <span key={index} className="capitalize">
                                  {removable}
                                  {index < item.selectedRemovables.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {/* Display special instructions */}
                          {item.specialInstructions && (
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium">{t('menu.instructions')}: </span>
                              {item.specialInstructions}
                            </div>
                          )}
                        </div>
                        <div className="font-medium">{formatDualCurrencyCompact((Number(item.price) || 0) * item.quantity)}</div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            sessionStorage.removeItem(`item-instructions-${item.id}`);
                            removeFromCart(item.id);
                            toast.success(t('cart.removedFromCart', { name: item.name }));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t('cart.subtotal')}</span>
                      <span>{formatDualCurrencyCompact(calculateSubtotalBGN())}</span>
                    </div>
                    {discountInfo && discountInfo.valid && (
                      <div className="flex justify-between text-green-600">
                        <span>{t('cart.discount')} ({discountInfo.discount_percentage}%)</span>
                        <span>-{formatDualCurrencyCompact(calculateDiscountAmountBGN())}</span>
                      </div>
                    )}
                    {deliveryMethod === 'delivery' && (
                      <div className="flex justify-between">
                        <span>{t('cart.deliveryFee')}</span>
                        <span>{formatDualCurrencyCompact(9.78)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('cart.total')}</span>
                      <span>{formatDualCurrencyCompact(calculateTotalBGN())}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                  {!isLoggedIn && (
                    <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-lg w-full">
                      <p className="text-sm text-blue-800 font-medium">{t('checkout.pleaseSignIn')}</p>
                    </div>
                  )}
                  {!isOpen && nextOpenTime && (
                    <div className="text-center p-2 bg-orange-50 border border-orange-200 rounded-lg w-full">
                      <p className="text-sm text-orange-800 font-medium">{t('checkout.restaurantClosed')}</p>
                      <p className="text-xs text-orange-600">{t('checkout.nextOpening')}: {nextOpenTime}</p>
                    </div>
                  )}
                  <Button 
                    className={`w-full ${(!isOpen || !isLoggedIn) ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                    size="lg"
                    onClick={handleCheckout} 
                    disabled={isProcessing || !isOpen || !isLoggedIn}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('checkout.processingPayment')}
                      </div>
                    ) : !isLoggedIn ? (
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {t('checkout.accountRequired')}
                      </div>
                    ) : !isOpen ? (
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {t('checkout.restaurantClosed')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {t('checkout.reviewOrder')}
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          {/* Address Edit Dialog */}
          <Dialog open={showAddressEdit} onOpenChange={setShowAddressEdit}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('checkout.editDeliveryAddress')}</DialogTitle>
                <DialogDescription>
                  {t('checkout.updateDeliveryAddress')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder={t('checkout.enterNewAddress')}
                  className="w-full"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddressEdit(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleAddressSave}>
                  <Check className="h-4 w-4 mr-2" />
                  {t('checkout.saveAddress')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Order Confirmation Dialog */}
          <OrderConfirmation
            open={showOrderConfirmation}
            onClose={handleOrderConfirmationClose}
            onConfirm={handleOrderConfirm}
            cartItems={cartItems}
            subtotal={calculateSubtotalBGN()}
            discountInfo={discountInfo}
            discountAmount={calculateDiscountAmountBGN()}
            total={calculateTotalBGN()}
            deliveryFee={deliveryMethod === 'delivery' ? 9.78 : 0}
            isLoading={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}
