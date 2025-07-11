# Pantastic Restaurant Microservice API Documentation

This document contains comprehensive documentation for all endpoints in the Restaurant Microservice, including curl examples for testing and integration.

## Table of Contents

1. [Restaurant Management](#restaurant-management)
2. [Menu Item Management](#menu-item-management)
3. [Add-on Template Management](#add-on-template-management)
4. [Delivery Person Management](#delivery-person-management)

---

## Restaurant Management

### Add Restaurant

```bash
curl -X POST "https://api.palachinki.store/restaurant/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Pizza Palace",
    "address": "123 Main St, New York, NY 10001",
    "city": "New York",
    "opening_hours": {
      "Monday": "9:00-22:00",
      "Tuesday": "9:00-22:00",
      "Wednesday": "9:00-22:00",
      "Thursday": "9:00-22:00",
      "Friday": "9:00-23:00",
      "Saturday": "10:00-23:00",
      "Sunday": "10:00-22:00"
    }
  }'
```

**Response:**

```json
{
  "message": "Restaurant added successfully",
  "restaurant_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Get All Restaurants

```bash
curl -X GET "https://api.palachinki.store/restaurant/restaurants" \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Pizza Palace",
    "address": "123 Main St, New York, NY 10001",
    "city": "New York",
    "opening_hours": {
      "Monday": "9:00-22:00",
      "Tuesday": "9:00-22:00",
      "Wednesday": "9:00-22:00",
      "Thursday": "9:00-22:00",
      "Friday": "9:00-23:00",
      "Saturday": "10:00-23:00",
      "Sunday": "10:00-22:00"
    },
    "latitude": 40.7128,
    "longitude": -74.006,
    "created_at": "2025-07-11T10:00:00.000Z"
  }
]
```

### Get Restaurant by ID

```bash
curl -X GET "https://api.palachinki.store/restaurant/restaurants/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Pizza Palace",
  "address": "123 Main St, New York, NY 10001",
  "city": "New York",
  "opening_hours": {
    "Monday": "9:00-22:00",
    "Tuesday": "9:00-22:00",
    "Wednesday": "9:00-22:00",
    "Thursday": "9:00-22:00",
    "Friday": "9:00-23:00",
    "Saturday": "10:00-23:00",
    "Sunday": "10:00-22:00"
  },
  "latitude": 40.7128,
  "longitude": -74.006,
  "created_at": "2025-07-11T10:00:00.000Z"
}
```

### Update Restaurant

```bash
curl -X PUT "https://api.palachinki.store/restaurant/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "restaurant": {
      "name": "Pizza Palace Deluxe",
      "address": "124 Main St, New York, NY 10001",
      "city": "New York",
      "opening_hours": {
        "Monday": "8:00-22:00",
        "Tuesday": "8:00-22:00",
        "Wednesday": "8:00-22:00",
        "Thursday": "8:00-22:00",
        "Friday": "8:00-23:00",
        "Saturday": "9:00-23:00",
        "Sunday": "9:00-22:00"
      }
    }
  }'
```

**Response:**

```json
{
  "message": "Restaurant updated successfully"
}
```

### Delete Restaurant

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/restaurants" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response:**

```json
{
  "message": "Restaurant deleted successfully"
}
```

---

## Menu Item Management

### Create Single Menu Item

```bash
# Create a form with JSON data and file upload
curl -X POST "https://api.palachinki.store/restaurant/menu-items" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F 'data={
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Margherita Pizza",
    "description": "Classic pizza with tomato sauce and mozzarella",
    "price": 12.99,
    "addon_templates": []
  }' \
  -F "file=@/path/to/pizza_image.jpg"
```

**Response:**

```json
{
  "message": "Menu item created successfully",
  "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "name": "Margherita Pizza",
  "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg"
}
```

### Get Menu Item by ID

```bash
curl -X GET "https://api.palachinki.store/restaurant/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Margherita Pizza",
  "description": "Classic pizza with tomato sauce and mozzarella",
  "price": 12.99,
  "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg",
  "created_at": "2025-07-11T10:05:00.000Z",
  "addon_templates": []
}
```

### Update Menu Item

```bash
curl -X PUT "https://api.palachinki.store/restaurant/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F 'data={
    "name": "Deluxe Margherita Pizza",
    "price": 14.99,
    "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
  }' \
  -F "file=@/path/to/updated_pizza_image.jpg"
```

**Response:**

```json
{
  "message": "Menu item updated successfully",
  "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
}
```

### Delete Menu Item

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "message": "Menu item deleted successfully"
}
```

### List Menu Items

```bash
# Get all menu items (with pagination)
curl -X GET "https://api.palachinki.store/restaurant/menu-items?skip=0&limit=10" \
  -H "Content-Type: application/json"

# Get menu items for a specific restaurant
curl -X GET "https://api.palachinki.store/restaurant/menu-items?restaurant_id=550e8400-e29b-41d4-a716-446655440000&skip=0&limit=10" \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Deluxe Margherita Pizza",
    "description": "Classic pizza with tomato sauce and mozzarella",
    "price": 14.99,
    "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg",
    "created_at": "2025-07-11T10:05:00.000Z",
    "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
  },
  {
    "item_id": "7bc8d910-9dad-11d1-80b4-00c04fd430c9",
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Pepperoni Pizza",
    "description": "Classic pizza with tomato sauce, mozzarella, and pepperoni",
    "price": 15.99,
    "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/7bc8d910-9dad-11d1-80b4-00c04fd430c9.jpg",
    "created_at": "2025-07-11T10:10:00.000Z",
    "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
  }
]
```

### Bulk Create Menu Items

```bash
curl -X POST "https://api.palachinki.store/restaurant/menu-items/bulk" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F 'data=[
    {
      "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Veggie Pizza",
      "description": "Pizza with assorted vegetables",
      "price": 13.99,
      "addon_templates": []
    },
    {
      "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Supreme Pizza",
      "description": "Pizza with the works",
      "price": 16.99,
      "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
    }
  ]' \
  -F "item_0=@/path/to/veggie_pizza.jpg" \
  -F "item_1=@/path/to/supreme_pizza.jpg"
```

**Response:**

```json
{
  "success_count": 2,
  "failed_items": [],
  "message": "Created 2 menu items successfully with 0 failures"
}
```

### Bulk Update Menu Items

```bash
curl -X PUT "https://api.palachinki.store/restaurant/menu-items/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '[
    {
      "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "price": 16.99
    },
    {
      "item_id": "7bc8d910-9dad-11d1-80b4-00c04fd430c9",
      "price": 17.99
    }
  ]'
```

**Response:**

```json
{
  "success_count": 2,
  "failed_items": [],
  "message": "Updated 2 menu items successfully with 0 failures"
}
```

### Bulk Delete Menu Items

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/menu-items/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "item_ids": [
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "7bc8d910-9dad-11d1-80b4-00c04fd430c9"
    ]
  }'
```

**Response:**

```json
{
  "success_count": 2,
  "failed_items": [],
  "message": "Deleted 2 menu items successfully with 0 failures"
}
```

### Get Restaurant Items

```bash
curl -X GET "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/items" \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "Deluxe Margherita Pizza",
    "description": "Classic pizza with tomato sauce and mozzarella",
    "price": 16.99,
    "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg",
    "created_at": "2025-07-11T10:05:00.000Z",
    "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
  },
  {
    "item_id": "7bc8d910-9dad-11d1-80b4-00c04fd430c9",
    "name": "Pepperoni Pizza",
    "description": "Classic pizza with tomato sauce, mozzarella, and pepperoni",
    "price": 17.99,
    "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/7bc8d910-9dad-11d1-80b4-00c04fd430c9.jpg",
    "created_at": "2025-07-11T10:10:00.000Z",
    "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
  }
]
```

### Get Restaurant Item Names

```bash
curl -X GET "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/item-names" \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "Deluxe Margherita Pizza"
  },
  {
    "item_id": "7bc8d910-9dad-11d1-80b4-00c04fd430c9",
    "name": "Pepperoni Pizza"
  }
]
```

### Get Restaurant Item Info

```bash
curl -X GET "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/items/6ba7b810-9dad-11d1-80b4-00c04fd430c8" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "item_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Deluxe Margherita Pizza",
  "description": "Classic pizza with tomato sauce and mozzarella",
  "price": 16.99,
  "image_url": "https://pantastic-images.s3.amazonaws.com/menu-items/6ba7b810-9dad-11d1-80b4-00c04fd430c8.jpg",
  "created_at": "2025-07-11T10:05:00.000Z",
  "addon_templates": ["a1b2c3d4-e5f6-7890-abcd-1234567890ab"]
}
```

---

## Add-on Template Management

### Create Add-on Template

```bash
curl -X POST "https://api.palachinki.store/restaurant/addon-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "template": {
      "name": "Extra Toppings",
      "addons": [
        {
          "name": "Extra Cheese",
          "price": 2.50,
          "description": "Additional mozzarella cheese"
        },
        {
          "name": "Pepperoni",
          "price": 2.00,
          "description": "Sliced pepperoni"
        },
        {
          "name": "Mushrooms",
          "price": 1.50,
          "description": "Fresh sliced mushrooms"
        }
      ],
      "is_predefined": false
    }
  }'
```

**Response:**

```json
{
  "message": "Add-on template created successfully",
  "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
}
```

### Get Restaurant Add-on Templates

```bash
curl -X GET "https://api.palachinki.store/restaurant/addon-templates/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "name": "Extra Toppings",
    "addons": [
      {
        "name": "Extra Cheese",
        "price": 2.5,
        "description": "Additional mozzarella cheese"
      },
      {
        "name": "Pepperoni",
        "price": 2.0,
        "description": "Sliced pepperoni"
      },
      {
        "name": "Mushrooms",
        "price": 1.5,
        "description": "Fresh sliced mushrooms"
      }
    ],
    "is_predefined": false,
    "created_at": "2025-07-11T10:15:00.000Z"
  }
]
```

### Get Specific Add-on Template

```bash
curl -X GET "https://api.palachinki.store/restaurant/addon-templates/550e8400-e29b-41d4-a716-446655440000/a1b2c3d4-e5f6-7890-abcd-1234567890ab" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
  "name": "Extra Toppings",
  "addons": [
    {
      "name": "Extra Cheese",
      "price": 2.5,
      "description": "Additional mozzarella cheese"
    },
    {
      "name": "Pepperoni",
      "price": 2.0,
      "description": "Sliced pepperoni"
    },
    {
      "name": "Mushrooms",
      "price": 1.5,
      "description": "Fresh sliced mushrooms"
    }
  ],
  "is_predefined": false,
  "created_at": "2025-07-11T10:15:00.000Z"
}
```

### Update Add-on Template

```bash
curl -X PUT "https://api.palachinki.store/restaurant/addon-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "name": "Premium Toppings",
    "addons": [
      {
        "name": "Extra Cheese",
        "price": 2.50,
        "description": "Additional mozzarella cheese"
      },
      {
        "name": "Pepperoni",
        "price": 2.00,
        "description": "Sliced pepperoni"
      },
      {
        "name": "Mushrooms",
        "price": 1.50,
        "description": "Fresh sliced mushrooms"
      },
      {
        "name": "Bacon",
        "price": 2.50,
        "description": "Crispy bacon bits"
      }
    ]
  }'
```

**Response:**

```json
{
  "message": "Add-on template updated successfully"
}
```

### Delete Add-on Template

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/addon-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab"
  }'
```

**Response:**

```json
{
  "message": "Add-on template deleted successfully"
}
```

### Get Item Add-ons

```bash
curl -X GET "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/items/6ba7b810-9dad-11d1-80b4-00c04fd430c8/addons" \
  -H "Content-Type: application/json"
```

**Response:**

```json
[
  {
    "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "name": "Premium Toppings",
    "addons": [
      {
        "name": "Extra Cheese",
        "price": 2.5,
        "description": "Additional mozzarella cheese"
      },
      {
        "name": "Pepperoni",
        "price": 2.0,
        "description": "Sliced pepperoni"
      },
      {
        "name": "Mushrooms",
        "price": 1.5,
        "description": "Fresh sliced mushrooms"
      },
      {
        "name": "Bacon",
        "price": 2.5,
        "description": "Crispy bacon bits"
      }
    ]
  }
]
```

### Add Add-on Template to Item

```bash
curl -X POST "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/items/6ba7b810-9dad-11d1-80b4-00c04fd430c8/addons/a1b2c3d4-e5f6-7890-abcd-1234567890ab" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "message": "Add-on template added to item successfully"
}
```

### Remove Add-on Template from Item

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/items/6ba7b810-9dad-11d1-80b4-00c04fd430c8/addons/a1b2c3d4-e5f6-7890-abcd-1234567890ab" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
{
  "message": "Add-on template removed from item successfully"
}
```

### List Available Add-on Templates

```bash
curl -X GET "https://api.palachinki.store/restaurant/550e8400-e29b-41d4-a716-446655440000/addon-templates" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
[
  {
    "template_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
    "name": "Premium Toppings",
    "addons": [
      {
        "name": "Extra Cheese",
        "price": 2.5,
        "description": "Additional mozzarella cheese"
      },
      {
        "name": "Pepperoni",
        "price": 2.0,
        "description": "Sliced pepperoni"
      },
      {
        "name": "Mushrooms",
        "price": 1.5,
        "description": "Fresh sliced mushrooms"
      },
      {
        "name": "Bacon",
        "price": 2.5,
        "description": "Crispy bacon bits"
      }
    ],
    "created_at": "2025-07-11T10:15:00.000Z",
    "is_predefined": false
  },
  {
    "template_id": "b2c3d4e5-f6a7-8901-bcde-23456789abcd",
    "name": "Standard Toppings",
    "addons": [
      {
        "name": "Extra Cheese",
        "price": 1.0,
        "description": "Additional cheese on top"
      },
      {
        "name": "Chocolate Sauce",
        "price": 0.5,
        "description": "Sweet chocolate topping"
      },
      {
        "name": "Whipped Cream",
        "price": 0.75,
        "description": "Fresh whipped cream"
      },
      {
        "name": "Caramel",
        "price": 0.5,
        "description": "Sweet caramel drizzle"
      },
      {
        "name": "Nuts",
        "price": 1.0,
        "description": "Mixed nuts topping"
      }
    ],
    "created_at": "2025-07-11T00:00:00.000Z",
    "is_predefined": true
  }
]
```

---

## Delivery Person Management

### Add Delivery Person

```bash
curl -X POST "https://api.palachinki.store/restaurant/delivery-people" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "John Doe",
    "phone": "+1234567890"
  }'
```

**Response:**

```json
{
  "message": "Delivery person added successfully",
  "delivery_person_id": "c3d4e5f6-a7b8-9012-cdef-3456789abcde"
}
```

### Get All Delivery People

```bash
curl -X GET "https://api.palachinki.store/restaurant/delivery-people" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**

```json
[
  {
    "delivery_person_id": "c3d4e5f6-a7b8-9012-cdef-3456789abcde",
    "name": "John Doe",
    "phone": "+1234567890",
    "created_at": "2025-07-11T10:20:00.000Z"
  }
]
```

### Update Delivery Person

```bash
curl -X PUT "https://api.palachinki.store/restaurant/delivery-people" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "delivery_person_id": "c3d4e5f6-a7b8-9012-cdef-3456789abcde",
    "person": {
      "name": "John Smith",
      "phone": "+1987654321"
    }
  }'
```

**Response:**

```json
{
  "message": "Delivery person updated successfully"
}
```

### Delete Delivery Person

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/delivery-people" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "delivery_person_id": "c3d4e5f6-a7b8-9012-cdef-3456789abcde"
  }'
```

**Response:**

```json
{
  "message": "Delivery person removed successfully"
}
```

### Assign Delivery Person to Restaurant

```bash
curl -X POST "https://api.palachinki.store/restaurant/assign-delivery-person-to-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "delivery_person_id": "c3d4e5f6-a7b8-9012-cdef-3456789abcde"
  }'
```

**Response:**

```json
{
  "message": "Delivery person assigned to restaurant successfully"
}
```

### Unassign Delivery Person from Restaurant

```bash
curl -X DELETE "https://api.palachinki.store/restaurant/unassign-delivery-person-from-restaurant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "restaurant_id": "550e8400-e29b-41d4-a716-446655440000",
    "delivery_person_id": "c3d4e5f6-a7b8-9012-cdef-3456789abcde"
  }'
```

**Response:**

```json
{
  "message": "Delivery person unassigned from restaurant successfully"
}
```

---

## Notes on Authentication

All endpoints that require authorization need a valid JWT token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

To obtain an access token, you'll need to use the User Microservice authentication endpoints.
