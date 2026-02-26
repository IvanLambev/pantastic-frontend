export const COMING_SOON_RESTAURANT_IDS = [
  "09c2b688-33da-4f8b-a3c4-5b32364b9953",
];

export function getRestaurantId(restaurant) {
  if (!restaurant) return null;

  if (typeof restaurant === 'string') {
    return restaurant;
  }

  if (Array.isArray(restaurant)) {
    return restaurant[0] || null;
  }

  return restaurant.restaurant_id || restaurant.id || null;
}

export function isComingSoonRestaurant(restaurantOrId) {
  const restaurantId = getRestaurantId(restaurantOrId);
  if (!restaurantId) return false;
  return COMING_SOON_RESTAURANT_IDS.includes(restaurantId);
}
