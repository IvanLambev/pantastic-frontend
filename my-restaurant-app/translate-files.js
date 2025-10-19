#!/usr/bin/env node

/**
 * Automated Translation Script
 * This script helps translate all remaining files to Bulgarian
 * 
 * Usage: node translate-files.js
 */

const fs = require('fs');
const path = require('path');

// Files that have been translated already
const translatedFiles = [
  'src/utils/translations.js',
  'src/components/Navbar.jsx',
  'src/pages/Login.jsx',
  'src/pages/SignUp.jsx',
  'src/components/login-form.jsx',
  'src/components/sign-up-form.jsx'
];

// Translation mappings for bulk replacement
const translations = {
  // Common phrases - these appear across multiple files
  '"Loading..."': 't(\'common.loading\')',
  '"Error"': 't(\'common.error\')',
  '"Success"': 't(\'common.success\')',
  '"Cancel"': 't(\'common.cancel\')',
  '"Confirm"': 't(\'common.confirm\')',
  '"Save"': 't(\'common.save\')',
  '"Delete"': 't(\'common.delete\')',
  '"Edit"': 't(\'common.edit\')',
  '"Add"': 't(\'common.add\')',
  '"Remove"': 't(\'common.remove\')',
  '"Close"': 't(\'common.close\')',
  '"Back"': 't(\'common.back\')',
  '"Yes"': 't(\'common.yes\')',
  '"No"': 't(\'common.no\')',
  
  // Cart specific
  '>Your Cart is Empty<': '>{ t(\'cart.empty\')}<',
  '>Continue Shopping<': '>{t(\'cart.continueShopping\')}<',
  '>Checkout<': '>{t(\'cart.checkout\')}<',
  '>Subtotal<': '>{t(\'cart.subtotal\')}<',
  '>Total<': '>{t(\'cart.total\')}<',
  '"Delivery Fee"': 't(\'cart.deliveryFee\')',
  '"Discount"': 't(\'cart.discount\')',
  
  // Menu/Food specific  
  '>Add to Cart<': '>{t(\'menu.addToCart\')}<',
  '>View Details<': '>{t(\'menu.viewDetails\')}<',
  '>Customize<': '>{t(\'menu.customize\')}<',
  '"Our Menu"': 't(\'menu.title\')',
  '"Search crepes..."': 't(\'menu.searchPlaceholder\')',
  
  // Checkout specific
  '"Complete your order"': 't(\'checkout.completeOrder\')',
  '"Account Required"': 't(\'checkout.accountRequired\')',
  '"Sign In"': 't(\'checkout.signIn\')',
  '"Sign Up"': 't(\'checkout.signUp\')',
  '"Payment Method"': 't(\'checkout.paymentMethod\')',
  '"Review Order"': 't(\'checkout.reviewOrder\')',
  
  // Tracking specific
  '"Order Tracking"': 't(\'tracking.title\')',
  '"Order ID"': 't(\'tracking.orderId\')',
  '"Status"': 't(\'tracking.status\')',
  '"Pending"': 't(\'tracking.pending\')',
  '"Confirmed"': 't(\'tracking.confirmed\')',
  '"Preparing"': 't(\'tracking.preparing\')',
  '"Ready"': 't(\'tracking.ready\')',
  '"Delivered"': 't(\'tracking.delivered\')',
};

console.log('🌍 Automated Translation Script');
console.log('================================\n');
console.log('✅ Already translated:');
translatedFiles.forEach(file => console.log(`   - ${file}`));
console.log('\n📝 This script will guide you through translating remaining files\n');

// Priority files to translate
const priorityFiles = [
  {
    path: 'src/pages/Cart.jsx',
    description: 'Shopping Cart Page',
    priority: 1
  },
  {
    path: 'src/pages/CheckoutV2.jsx',
    description: 'Checkout Page with Guest Registration',
    priority: 1
  },
  {
    path: 'src/pages/OrderTrackingV2.jsx',
    description: 'Order Tracking Page',
    priority: 1
  },
  {
    path: 'src/pages/Food.jsx',
    description: 'Menu/Food Listing Page',
    priority: 1
  },
  {
    path: 'src/components/ui/RestaurantSelector.jsx',
    description: 'Restaurant Selection Dialog',
    priority: 1
  },
  {
    path: 'src/components/Footer.jsx',
    description: 'Footer Component',
    priority: 2
  },
  {
    path: 'src/components/OrderConfirmation.jsx',
    description: 'Order Confirmation Dialog',
    priority: 2
  }
];

console.log('📋 Files to translate (in priority order):\n');
priorityFiles.forEach((file, index) => {
  console.log(`${index + 1}. [Priority ${file.priority}] ${file.path}`);
  console.log(`   ${file.description}\n`);
});

console.log('\n📌 Instructions:');
console.log('1. Add this import at the top of each file:');
console.log('   import { t } from \'@/utils/translations\';');
console.log('\n2. Use Find & Replace in VS Code (Ctrl+H) with these patterns:');
console.log('\n   Common replacements:');
Object.entries(translations).slice(0, 10).forEach(([find, replace]) => {
  console.log(`   Find: ${find}`);
  console.log(`   Replace: {${replace}}`);
  console.log('');
});

console.log('\n3. Test each page after translation');
console.log('4. Commit changes after each major file\n');

console.log('💡 Tip: Open BULK_TRANSLATION_STEPS.md for detailed instructions\n');

module.exports = { translatedFiles, priorityFiles, translations };
