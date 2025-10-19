/**
 * Bulk Translation Replacement Guide
 * 
 * Use Find & Replace in VS Code with these patterns:
 * 
 * 1. Find: "Your Cart is Empty"
 *    Replace: {t('cart.empty')}
 * 
 * 2. Find: "Continue Shopping"
 *    Replace: {t('cart.continueShopping')}
 * 
 * 3. Find: "Add to Cart"
 *    Replace: {t('menu.addToCart')}
 * 
 * Remember to add at the top of each file:
 * import { t } from '@/utils/translations';
 */

// Common translation patterns for Cart.jsx
export const cartTranslations = {
  "Your Cart is Empty": "cart.empty",
  "Your cart is empty": "cart.empty",
  "Add items from our menu to get started": "cart.emptyDesc",
  "Continue Shopping": "cart.continueShopping",
  "Subtotal": "cart.subtotal",
  "Delivery Fee": "cart.deliveryFee",
  "Discount": "cart.discount",
  "Total": "cart.total",
  "Checkout": "cart.checkout",
  "Remove": "cart.remove",
  "Quantity": "cart.quantity",
  "Add-ons": "cart.addons",
  "Removables": "cart.removables",
  "Special Instructions": "cart.specialInstructions",
  "Edit Instructions": "cart.editInstructions"
};

// Common translation patterns for Checkout
export const checkoutTranslations = {
  "Checkout": "checkout.title",
  "Complete your order": "checkout.completeOrder",
  "Account Required": "checkout.accountRequired",
  "Sign in or create an account to complete your order": "checkout.accountRequiredDesc",
  "Sign In": "checkout.signIn",
  "Sign Up": "checkout.signUp",
  "Or": "checkout.or",
  "Create Account & Checkout": "checkout.createAccountCheckout",
  "Back": "checkout.back",
  "Create Account & Continue": "checkout.createAccountContinue",
  "Creating Account...": "checkout.creatingAccount",
  "First Name": "checkout.firstName",
  "Last Name": "checkout.lastName",
  "Email": "checkout.email",
  "Phone": "checkout.phone",
  "City": "checkout.city",
  "Password": "checkout.password",
  "Format: +359888000000": "checkout.phoneFormat",
  "Minimum 8 characters": "checkout.passwordMin",
  "All fields are required": "checkout.allFieldsRequired",
  "Discount Code": "checkout.discountCode",
  "Have a promotional code? Apply it here": "checkout.discountCodeDesc",
  "Enter discount code": "checkout.enterCode",
  "Apply": "checkout.apply",
  "Checking...": "checkout.checking",
  "Payment Method": "checkout.paymentMethod",
  "Choose how you'd like to pay for your order": "checkout.paymentMethodDesc",
  "Credit/Debit Card": "checkout.creditCard",
  "Pay with your credit or debit card": "checkout.creditCardDesc",
  "Cash on Delivery/Pickup": "checkout.cash",
  "Pay with cash when your order arrives": "checkout.cashDesc",
  "Available": "checkout.available",
  "Delivery Address": "checkout.deliveryAddress",
  "Delivery to this address": "checkout.deliveryTo",
  "Edit": "checkout.edit",
  "Pickup Location": "checkout.pickupLocation",
  "Review Order": "checkout.reviewOrder",
  "Restaurant Closed": "checkout.restaurantClosed",
  "Restaurant is currently closed": "checkout.restaurantClosedMsg",
  "Next opening": "checkout.nextOpening",
  "Processing Payment...": "checkout.processingPayment",
  "Please sign in or create an account to continue": "checkout.pleaseSignIn"
};

// Common translation patterns for Order Tracking
export const trackingTranslations = {
  "Order Tracking": "tracking.title",
  "Order ID": "tracking.orderId",
  "Status": "tracking.status",
  "Estimated Time": "tracking.estimatedTime",
  "Payment Status": "tracking.paymentStatus",
  "Pending": "tracking.pending",
  "Confirmed": "tracking.confirmed",
  "Preparing": "tracking.preparing",
  "Ready": "tracking.ready",
  "On the Way": "tracking.onTheWay",
  "Delivered": "tracking.delivered",
  "Cancelled": "tracking.cancelled",
  "Paid": "tracking.paid",
  "Unpaid": "tracking.unpaid",
  "Delivery": "tracking.delivery",
  "Pickup": "tracking.pickup",
  "Order Placed": "tracking.orderPlaced",
  "Order Confirmed": "tracking.orderConfirmed",
  "Preparing Your Order": "tracking.preparingOrder",
  "Ready for Pickup": "tracking.readyForPickup",
  "Out for Delivery": "tracking.outForDelivery",
  "Order Delivered": "tracking.orderDelivered",
  "Your order has been received": "tracking.orderReceived",
  "Restaurant confirmed your order": "tracking.restaurantConfirmed",
  "Our chef is preparing your order": "tracking.chefPreparing",
  "Your order is ready for pickup": "tracking.readyMessage",
  "Driver is on the way to you": "tracking.driverOnWay",
  "Enjoy your meal!": "tracking.enjoyMeal",
  "Loading order information...": "tracking.loading",
  "Error loading order": "tracking.error",
  "Order not found": "tracking.notFound",
  "Back to Home": "tracking.backToHome"
};

// Common translation patterns for Menu/Food
export const menuTranslations = {
  "Our Menu": "menu.title",
  "Choose from our selection of delicious crepes": "menu.subtitle",
  "Search crepes...": "menu.searchPlaceholder",
  "No results found": "menu.noResults",
  "Add to Cart": "menu.addToCart",
  "View Details": "menu.viewDetails",
  "Customize": "menu.customize",
  "from": "menu.from",
  "Loading...": "menu.loading",
  "Error loading menu": "menu.error",
  "Please select a restaurant first": "menu.selectRestaurant",
  "Category": "menu.category",
  "All Categories": "menu.allCategories"
};

// Common buttons and actions
export const commonTranslations = {
  "Loading...": "common.loading",
  "Error": "common.error",
  "Success": "common.success",
  "Cancel": "common.cancel",
  "Confirm": "common.confirm",
  "Save": "common.save",
  "Delete": "common.delete",
  "Edit": "common.edit",
  "Add": "common.add",
  "Remove": "common.remove",
  "Close": "common.close",
  "Back": "common.back",
  "Next": "common.next",
  "Search": "common.search",
  "Yes": "common.yes",
  "No": "common.no",
  "OK": "common.ok"
};

export default {
  cart: cartTranslations,
  checkout: checkoutTranslations,
  tracking: trackingTranslations,
  menu: menuTranslations,
  common: commonTranslations
};
