# Cart Item Grouping Fix

## Problem

The frontend was incorrectly grouping cart items by their `originalItemId`, which meant items with different customizations (addons/removables) were being merged together.

### Example of the Problem

**Cart contained:**
- Product X (no customizations) - quantity: 1
- Product Y (plain, no addons) - quantity: 1  
- Product Y (with addons: Кафяв шоколад, Крем Буенно; removables: Кокосово мляко) - quantity: 1

**Old checkout logic sent:**
```json
{
  "order_items": [
    {"item_id": "x", "quantity": 1, "addons": null, "removables": null},
    {
      "item_id": "y", 
      "quantity": 2,  // ❌ WRONG - grouped both Y items
      "addons": {"Кафяв шоколад": 1, "Крем Буенно": 1},  // ❌ Applied to BOTH
      "removables": ["Кокосово мляко"]  // ❌ Applied to BOTH
    }
  ]
}
```

**Backend received this as:**
- 1x Product X (plain)
- 2x Product Y, BOTH with the same addons and removables

## Solution

The fix removes the grouping logic entirely. Each cart item is sent separately with its own specific customizations and quantity.

**New checkout logic sends:**
```json
{
  "order_items": [
    {"item_id": "x", "quantity": 1, "addons": null, "removables": null},
    {"item_id": "y", "quantity": 1, "addons": null, "removables": null},  // ✅ Plain Y
    {
      "item_id": "y",
      "quantity": 1,  // ✅ Only the customized one
      "addons": {"Кафяв шоколад": 1, "Крем Буенно": 1},
      "removables": ["Кокосово мляко"]
    }
  ]
}
```

**Backend now correctly receives:**
- 1x Product X (plain)
- 1x Product Y (plain)
- 1x Product Y (with specific addons and removables)

## How It Works

1. **ItemDetails.jsx**: When adding items to cart, each unique combination of (item + addons + removables) gets a unique `configurationId`
   - Example: `"item-123-Кафяв шоколад,Крем Буенно-Кокосово мляко"`

2. **CartContext.jsx**: The `addToCart` function checks if the exact same configuration exists
   - If yes: increases quantity of that specific configuration
   - If no: adds as a new separate cart item

3. **CheckoutV2.jsx** (FIXED): Each cart item is sent as-is to the backend
   - No grouping by `originalItemId`
   - Each cart item maintains its own quantity and customizations

## Edge Cases Handled

### Case 1: User adds same customized item twice
**Cart:**
- Product Y (with addon A) - added once
- Product Y (with addon A) - added again

**Result:** Single cart entry with quantity: 2
```json
{"item_id": "y", "quantity": 2, "addons": {"A": 1}}
```

### Case 2: User manually increases quantity
**Cart:**
- Product Y (with addon A) - quantity increased to 3 via +/- buttons

**Result:** Single cart entry with quantity: 3
```json
{"item_id": "y", "quantity": 3, "addons": {"A": 1}}
```

### Case 3: Different customizations (the bug we fixed)
**Cart:**
- Product Y (plain) - quantity: 1
- Product Y (with addon A) - quantity: 1

**Result:** Two separate entries
```json
[
  {"item_id": "y", "quantity": 1, "addons": null},
  {"item_id": "y", "quantity": 1, "addons": {"A": 1}}
]
```

## Files Changed

- `src/pages/CheckoutV2.jsx`: Removed item grouping logic in `handleOrderConfirm` function
  - Lines ~490-540: Replaced grouping algorithm with direct mapping of cart items
  - Each cart item is now sent with its actual quantity and specific customizations

## Testing Recommendations

1. Add Product X to cart
2. Add Product Y (plain) to cart
3. Add Product Y with different addons to cart
4. Complete checkout
5. Verify order shows:
   - 1x Product X
   - 1x Product Y (plain)
   - 1x Product Y (with the specific addons)
