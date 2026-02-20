import { useState, useCallback, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useCart } from "@/hooks/use-cart"
import { API_URL, FRONTEND_BASE_URL } from "@/config/api"
import { toast } from "sonner"
import { CreditCard, DollarSign, ArrowLeft, Check, Minus, Plus, Trash2, Edit, MapPin, Store, X, Calendar as CalendarIcon, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { PhoneInput } from "@/components/ui/phone-input"
import OrderConfirmation from "@/components/OrderConfirmation"
import DeliverySchedulingBanner from "@/components/DeliverySchedulingBanner"
import MiscItemsSuggestion from "@/components/MiscItemsSuggestion"
import CartItemEditModal from "@/components/CartItemEditModal"
import { api } from "@/utils/apiClient"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { t } from "@/utils/translations"
import { openInMaps } from "@/utils/mapsHelper"
import {
  getAvailableDeliverySlots,
  generateTimeSlots,
  isRestaurantOpen,
  getNextOpenTime
} from "@/utils/deliveryScheduler"

export default function CheckoutV2() {
  const { cartItems, clearCart, updateQuantity, removeFromCart } = useCart()
  const navigate = useNavigate()
  const [selectedPayment, setSelectedPayment] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddressEdit, setShowAddressEdit] = useState(false)
  const [newAddress, setNewAddress] = useState("")
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [selectedCartItem, setSelectedCartItem] = useState(null)

  // Discount states
  const [discountCode, setDiscountCode] = useState("")
  const [discountInfo, setDiscountInfo] = useState(null)
  const [discountValidating, setDiscountValidating] = useState(false)
  const [discountError, setDiscountError] = useState("")

  // Delivery estimation states
  const [deliveryEstimate, setDeliveryEstimate] = useState(null)
  const [estimatingDelivery, setEstimatingDelivery] = useState(false)

  // Scheduling states
  const [isScheduled, setIsScheduled] = useState(false)
  const [selectedDate, setSelectedDate] = useState(undefined)
  const [selectedTime, setSelectedTime] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Phone number modal states
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)
  const [, setDeliverySchedule] = useState(null)
  const debounceTimeoutRef = useRef(null)

  // Cutlery request state
  const [cutleryRequested, setCutleryRequested] = useState(false)

  // Restaurant state
  const [selectedRestaurant, setSelectedRestaurant] = useState(() =>
    JSON.parse(localStorage.getItem('selectedRestaurant') || '[]')
  )

  console.log('[CheckoutV2] Selected restaurant:', selectedRestaurant)

  // Restaurant change warning state
  const [showRestaurantChangeWarning, setShowRestaurantChangeWarning] = useState(false)

  // Get delivery information from sessionStorage - MOVED HERE to avoid initialization errors
  const deliveryAddress = sessionStorage.getItem('delivery_address')
  const deliveryMethod = sessionStorage.getItem('delivery_method') || 'pickup'
  const isScheduledOrder = sessionStorage.getItem('scheduled_order') === 'true'

  const handleEditItem = (item) => {
    setSelectedCartItem(item)
    setIsItemModalOpen(true)
  }

  // Fetch restaurant details if hours are missing
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      if (!selectedRestaurant || (Array.isArray(selectedRestaurant) && selectedRestaurant.length === 0)) return;

      // Check if we have hours data
      const hasHours = Array.isArray(selectedRestaurant)
        ? !!selectedRestaurant[9]
        : !!selectedRestaurant.opening_hours;

      if (!hasHours) {
        try {
          const restaurantId = Array.isArray(selectedRestaurant)
            ? selectedRestaurant[0]
            : selectedRestaurant.restaurant_id;

          if (!restaurantId) return;

          console.log('Fetching full restaurant details for:', restaurantId);
          const data = await api.get(`/restaurant/restaurants/${restaurantId}`);

          // Update state and localStorage
          setSelectedRestaurant(data);
          localStorage.setItem('selectedRestaurant', JSON.stringify(data));
          console.log('Updated restaurant details:', data);
        } catch (error) {
          console.error("Failed to fetch restaurant details", error);
        }
      }
    };

    fetchRestaurantDetails();
  }, []); // Run once on mount

  // Fetch delivery estimate when coordinates and restaurant are available
  useEffect(() => {
    const fetchDeliveryEstimate = async () => {
      // Only estimate for delivery orders
      const method = sessionStorage.getItem('delivery_method') || 'pickup';
      if (method !== 'delivery') {
        setDeliveryEstimate(null);
        return;
      }

      // Get coordinates from sessionStorage
      const coordsString = sessionStorage.getItem('delivery_coordinates');
      if (!coordsString) {
        console.log('No delivery coordinates available');
        return;
      }

      try {
        const coords = JSON.parse(coordsString);
        
        // Get restaurant ID
        const restaurantId = Array.isArray(selectedRestaurant)
          ? selectedRestaurant[0]
          : selectedRestaurant.restaurant_id;

        if (!restaurantId || !coords.latitude || !coords.longitude) {
          console.log('Missing required data for delivery estimate');
          return;
        }

        console.log('Fetching delivery estimate for:', { restaurantId, coords });
        setEstimatingDelivery(true);

        const estimate = await api.estimateDelivery(restaurantId, {
          latitude: coords.latitude,
          longitude: coords.longitude
        });

        console.log('Delivery estimate received:', estimate);
        setDeliveryEstimate(estimate);
      } catch (error) {
        console.error('Failed to fetch delivery estimate:', error);
        // Fallback to default delivery fee if estimation fails
        setDeliveryEstimate({
          delivery_fee: 9.78,
          distance_km: null,
          estimated_delivery_minutes: null
        });
      } finally {
        setEstimatingDelivery(false);
      }
    };

    fetchDeliveryEstimate();
  }, [selectedRestaurant, deliveryMethod]); // Re-run when restaurant or delivery method changes

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

  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  // User is logged in if they have either access_token OR customer_id
  const isLoggedIn = !!(user?.access_token || user?.customer_id)

  // Check if it's a guest checkout
  const guestCheckoutData = sessionStorage.getItem('guest_checkout_data')
  const isGuestCheckout = !!guestCheckoutData

  // If not logged in and not guest checkout, redirect to checkout login
  if (!isLoggedIn && !isGuestCheckout) {
    navigate('/checkout-login')
    return null
  }

  // Check if restaurant is currently open
  const isOpen = isRestaurantOpen(selectedRestaurant)
  const nextOpenTime = !isOpen ? getNextOpenTime(selectedRestaurant) : null

  // Handle restaurant change
  const handleChangeRestaurant = () => {
    // Clear cart and navigate back to home/restaurant selection
    clearCart()
    localStorage.removeItem('selectedRestaurant')
    sessionStorage.removeItem('delivery_address')
    sessionStorage.removeItem('delivery_coordinates')
    sessionStorage.removeItem('delivery_method')
    sessionStorage.removeItem('scheduled_order')
    sessionStorage.removeItem('order_scheduled_delivery')
    toast.success(t('checkout.cartWillBeCleared'))
    navigate('/')
  }

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
    const deliveryFee = deliveryMethod === 'delivery' ? (deliveryEstimate?.delivery_fee || 0) : 0;
    return subtotal - discountAmount + deliveryFee;
  };

  // Get delivery fee for display
  const getDeliveryFee = () => {
    if (deliveryMethod !== 'delivery') return 0;
    return deliveryEstimate?.delivery_fee || 0;
  };

  // Handle address editing
  const handleAddressEdit = () => {
    setNewAddress(deliveryAddress || "")
    setShowAddressEdit(true)
  }

  const handleAddressSave = () => {
    if (newAddress.trim()) {
      // Normalize the address by removing special characters except commas
      // \p{L} matches any Unicode letter (including Cyrillic), \p{N} matches any Unicode number
      const normalizedAddress = newAddress.trim()
        .replace(/['"„"«»]/g, '')  // Remove various types of quotes
        .replace(/[^\p{L}\p{N}\s,.\-–—/]/gu, '')  // Keep Unicode letters, numbers, spaces, commas, dots, hyphens, slashes
        .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
        .trim()

      sessionStorage.setItem('delivery_address', normalizedAddress)
      sessionStorage.removeItem('delivery_coordinates')

      setShowAddressEdit(false)
    }
  }

  // Helper functions for scheduling
  const getAvailableTimeSlots = () => {
    if (!selectedDate || !selectedRestaurant || (Array.isArray(selectedRestaurant) && selectedRestaurant.length === 0)) return [];

    // Use the utility function to get available slots for the restaurant
    const deliverySlots = getAvailableDeliverySlots(selectedRestaurant);

    // Find the slot for the selected date
    const selectedDateString = selectedDate.toDateString();
    const daySlot = deliverySlots.find(slot => slot.date === selectedDateString);

    if (!daySlot) return [];

    // Generate specific time slots (30 min intervals)
    const timeSlots = generateTimeSlots(daySlot, 30);

    // Return just the time strings (HH:MM)
    return timeSlots.map(slot => slot.startString);
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
        // Translate common backend error messages
        let errorMessage = data.message || t('checkout.invalidDiscountCode')
        if (errorMessage === 'Discount code has expired') {
          errorMessage = t('checkout.discountExpired')
        }
        setDiscountError(errorMessage)
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
      await createOrder()
    } catch (error) {
      console.error('Order creation failed:', error)
      setIsProcessing(false)
      setShowOrderConfirmation(false)

      // Check if error is due to missing phone number
      const errorMessage = error.message || error.detail || error.toString()
      if (errorMessage.includes('Phone number required') || errorMessage.includes('phone number') || errorMessage.includes('phone')) {
        // Store the order data and show phone modal
        setShowPhoneModal(true)
        toast.error(t('checkout.phoneRequired'))
      } else {
        toast.error(error.message || t('checkout.orderError'))
      }
    }
  }

  // Extract order creation logic to a separate function for retry
  const createOrder = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    // Check authentication (works for both regular users and guest users)
    // Guest users have customer_id set during CheckoutLogin authentication
    if (!user?.customer_id) {
      throw new Error(t('checkout.userNotLoggedIn'))
    }

    // Check if restaurant is selected
    if (!selectedRestaurant || selectedRestaurant.length === 0) {
      throw new Error('No restaurant selected')
    }

    // Format order items according to new API structure
    // Do NOT group items with different customizations
    // Each unique cart item (with its specific addons/removables) should be sent separately
    const orderItems = cartItems.map(item => {
      const itemId = item.originalItemId || item.id

      // Build addons object
      const addons = {}
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach(addon => {
          addons[addon.name] = (addons[addon.name] || 0) + 1
        })
      }

      // Build removables array
      const removables = item.selectedRemovables && item.selectedRemovables.length > 0
        ? item.selectedRemovables
        : []

      return {
        item_id: itemId,
        quantity: item.quantity || 1, // Use the cart item's quantity
        selected_dough: item.selectedDoughType || null,
        selected_chocolate_type: item.selectedChocolateType || null,
        addons: Object.keys(addons).length > 0 ? addons : null,
        removables: removables.length > 0 ? removables : null,
        special_instructions: item.specialInstructions || null
      }
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
      cutlery_requested: cutleryRequested,
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

    // Clean up guest checkout data if this was a guest order
    if (user.is_guest) {
      sessionStorage.removeItem('guest_checkout_data')
      // Note: Keep the customer_id in localStorage for order tracking
      // It will be cleared when the user closes the browser or navigates away
    }

    // Handle different payment methods
    if (selectedPayment === 'cash') {
      // Cash payment - redirect directly to order tracking
      clearCart()
      cartItems.forEach(item => {
        sessionStorage.removeItem(`item-instructions-${item.id}`);
      });
      setIsProcessing(false)
      setShowOrderConfirmation(false)
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

      setIsProcessing(false)
      setShowOrderConfirmation(false)

      // Redirect to payment URL
      window.location.href = data.payment_url
    }
  }

  // Handle phone number submission
  const handlePhoneSubmit = async () => {
    setPhoneError("")

    // Validate phone format
    const phoneRegex = /^\+359\d{9}$/
    if (!phoneRegex.test(phoneNumber)) {
      setPhoneError(t('checkout.invalidPhone'))
      return
    }

    setIsUpdatingPhone(true)
    try {
      // Update user phone number
      await api.put('/user/update-phone', { phone: phoneNumber })

      // Update local user data
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      user.phone = phoneNumber
      localStorage.setItem('user', JSON.stringify(user))

      // Close modal
      setShowPhoneModal(false)
      setPhoneNumber("")

      // Retry order creation
      toast.info(t('checkout.retryingOrder'))
      setIsProcessing(true)
      setShowOrderConfirmation(true)

      await createOrder()
    } catch (error) {
      console.error('Failed to update phone:', error)
      setPhoneError(error.message || t('checkout.phoneUpdateError'))
    } finally {
      setIsUpdatingPhone(false)
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
                            </Label>
                          </div>
                        )
                      })}
                    </div>
                  </RadioGroup>
                  
                  {/* Cutlery Request */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cutlery-request"
                        checked={cutleryRequested}
                        onCheckedChange={setCutleryRequested}
                      />
                      <Label htmlFor="cutlery-request" className="cursor-pointer">
                        {t('checkout.requestCutlery')}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {t('checkout.requestCutleryDesc')}
                    </p>
                  </div>
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
                        onClick={() => setShowRestaurantChangeWarning(true)}
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

              {/* Delivery Scheduling Banner - Show for both open and closed restaurants */}
              {selectedRestaurant.length > 0 && (
                <DeliverySchedulingBanner
                  restaurant={selectedRestaurant}
                  onScheduleSelect={handleScheduleSelect}
                  className="mb-4"
                />
              )}

              {/* Misc Items Suggestions */}
              {selectedRestaurant && (Array.isArray(selectedRestaurant) ? selectedRestaurant.length > 0 : selectedRestaurant.restaurant_id) && (
                <MiscItemsSuggestion 
                  restaurantId={Array.isArray(selectedRestaurant) ? selectedRestaurant[0] : selectedRestaurant.restaurant_id}
                  limit={2}
                />
              )}

              {/* Manual Order Scheduling (fallback) - Only show when restaurant is open and not scheduled via banner */}
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
                            <Label htmlFor="date-picker">{t('checkout.selectDate')}</Label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  id="date-picker"
                                  className="w-full justify-start font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedDate ? selectedDate.toLocaleDateString('bg-BG') : t('checkout.selectDate')}
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
                            <Label htmlFor="time-picker">{t('checkout.time')}</Label>
                            <select
                              id="time-picker"
                              value={selectedTime}
                              onChange={(e) => setSelectedTime(e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                              disabled={!selectedDate}
                            >
                              <option value="" disabled>{t('checkout.selectTime')}</option>
                              {getAvailableTimeSlots().map(slot => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• {t('checkout.scheduleNote1')}</p>
                          <p>• {t('checkout.scheduleNote3')}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              {/* Selected Restaurant Box */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="h-4 w-4" />
                    {t('checkout.selectedRestaurant')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium">
                        {Array.isArray(selectedRestaurant) ? selectedRestaurant[8] : selectedRestaurant.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {Array.isArray(selectedRestaurant) ? selectedRestaurant[1] : selectedRestaurant.address}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRestaurantChangeWarning(true)}
                      className="shrink-0"
                    >
                      {t('checkout.changeRestaurant')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('cart.orderSummary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2">
                      <div
                        className="flex justify-between items-start cursor-pointer hover:bg-muted/40 rounded-md p-2 -m-2"
                        onClick={() => handleEditItem(item)}
                      >
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

                          {item.selectedDoughType && (
                            <div className="text-sm text-blue-700 mt-1">
                              <span className="font-medium">Тесто: </span>
                              <span>{item.selectedDoughType}</span>
                            </div>
                          )}

                          {item.selectedChocolateType && (
                            <div className="text-sm text-amber-700 mt-1">
                              <span className="font-medium">Шоколад: </span>
                              <span>{item.selectedChocolateType}</span>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(item.id, item.quantity - 1)
                            }}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateQuantity(item.id, item.quantity + 1)
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
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
                    {/* Inline Discount Code Input */}
                    <div className="space-y-2">
                      {!discountInfo ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder={t('checkout.enterDiscountCode')}
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && validateDiscountCode()}
                            disabled={discountValidating}
                            className="h-9 text-sm"
                          />
                          <Button
                            onClick={validateDiscountCode}
                            disabled={!discountCode.trim() || discountValidating}
                            size="sm"
                            variant="outline"
                          >
                            {discountValidating ? t('checkout.checking') : t('checkout.apply')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-800">
                              {discountCode} - {discountInfo.discount_percentage}% off
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeDiscount}
                            className="h-6 text-green-600 hover:text-green-800 p-1"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {discountError && (
                        <p className="text-xs text-red-600">{discountError}</p>
                      )}
                    </div>

                    <Separator />

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
                        <span>
                          {estimatingDelivery ? (
                            <span className="text-muted-foreground text-sm">{t('checkout.calculating')}...</span>
                          ) : (
                            formatDualCurrencyCompact(getDeliveryFee())
                          )}
                        </span>
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
                  {!isOpen && nextOpenTime && !isScheduled && (
                    <div className="text-center p-2 bg-orange-50 border border-orange-200 rounded-lg w-full">
                      <p className="text-sm text-orange-800 font-medium">{t('checkout.restaurantClosed')}</p>
                      <p className="text-xs text-orange-600">{t('checkout.nextOpening')}: {nextOpenTime}</p>
                    </div>
                  )}
                  <Button
                    className={`w-full ${(!isOpen && !isScheduled) ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing || (!isOpen && !isScheduled)}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('checkout.processingPayment')}
                      </div>
                    ) : (!isOpen && !isScheduled) ? (
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {t('checkout.restaurantClosed')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {isScheduled ? t('checkout.scheduleOrder') : t('checkout.reviewOrder')}
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <CartItemEditModal
              isOpen={isItemModalOpen}
              onClose={() => setIsItemModalOpen(false)}
              cartItem={selectedCartItem}
              restaurantId={Array.isArray(selectedRestaurant)
                ? selectedRestaurant[0]
                : (selectedRestaurant?.restaurant_id || selectedRestaurant?.id)
              }
            />
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

          {/* Phone Number Required Dialog */}
          <Dialog open={showPhoneModal} onOpenChange={setShowPhoneModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('checkout.phoneRequiredTitle')}</DialogTitle>
                <DialogDescription>
                  {t('checkout.phoneRequiredDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('checkout.phone')}</Label>
                  <PhoneInput
                    id="phone"
                    value={phoneNumber}
                    onChange={(value) => {
                      setPhoneNumber(value || "")
                      setPhoneError("")
                    }}
                    defaultCountry="BG"
                    disabled={isUpdatingPhone}
                  />
                  <p className="text-xs text-muted-foreground">{t('checkout.phoneFormat')}</p>
                  {phoneError && (
                    <p className="text-sm text-red-500">{phoneError}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPhoneModal(false)
                    setPhoneNumber("")
                    setPhoneError("")
                  }}
                  disabled={isUpdatingPhone}
                >
                  {t('checkout.cancel')}
                </Button>
                <Button
                  onClick={handlePhoneSubmit}
                  disabled={isUpdatingPhone || !phoneNumber}
                >
                  {isUpdatingPhone ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('checkout.updating')}
                    </div>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t('checkout.saveAndContinue')}
                    </>
                  )}
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
            deliveryFee={getDeliveryFee()}
            deliveryEstimate={deliveryEstimate}
            isLoading={isProcessing}
            cutleryRequested={cutleryRequested}
          />

          {/* Restaurant Change Warning Dialog */}
          <AlertDialog open={showRestaurantChangeWarning} onOpenChange={setShowRestaurantChangeWarning}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  {t('checkout.changeRestaurantTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-left">
                  {t('checkout.changeRestaurantWarning')}
                  <br /><br />
                  {t('checkout.changeRestaurantConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleChangeRestaurant} className="bg-orange-500 hover:bg-orange-600">
                  {t('checkout.yesChangeRestaurant')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
