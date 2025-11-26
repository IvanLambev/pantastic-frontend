// Utility functions for delivery scheduling based on restaurant working hours

/**
 * Get the current time in GMT+3 (restaurant timezone)
 * @returns {Date} Current date/time in GMT+3
 */
export function getCurrentGMT3Time() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 3600000);
}

/**
 * Parse opening hours data (handles string format from backend)
 * @param {string|Object} openingHoursData 
 * @returns {Object} Parsed hours object
 */
function parseOpeningHours(openingHoursData) {
  if (!openingHoursData) return {};

  // If it's already an object, return it
  if (typeof openingHoursData === 'object' && !Array.isArray(openingHoursData)) {
    return openingHoursData;
  }

  // If it's a string, parse it (handles Python dict format like "{'Friday': '10:00-03:00'}")
  if (typeof openingHoursData === 'string') {
    try {
      // Replace single quotes with double quotes for valid JSON
      const jsonString = openingHoursData
        .replace(/'/g, '"')
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("[DeliveryScheduler] Error parsing opening hours string:", error, openingHoursData);
      return {};
    }
  }

  return {};
}

/**
 * Helper to safely get hours from restaurant data (supports both array and object formats)
 * @param {Array|Object} restaurant 
 * @returns {Object} Hours object
 */
function getRestaurantHours(restaurant) {
  if (!restaurant) return {};
  // Support legacy array format (index 9) and new object format (opening_hours)
  const rawHours = Array.isArray(restaurant) ? restaurant[9] : restaurant.opening_hours;
  // Parse the hours (handles both string and object formats)
  return parseOpeningHours(rawHours);
}

/**
 * Check if a restaurant is currently open
 * @param {Array|Object} restaurant - Restaurant data
 * @returns {boolean} Whether the restaurant is open
 */
export function isRestaurantOpen(restaurant) {
  const gmt3 = getCurrentGMT3Time();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = days[gmt3.getDay()];

  const hours = getRestaurantHours(restaurant);
  const todayHours = hours[currentDay];

  // Debug logging
  console.log(`[DeliveryScheduler] Checking if open: ${currentDay}, Time: ${gmt3.toLocaleTimeString()}`);
  console.log(`[DeliveryScheduler] Restaurant hours for today:`, todayHours);

  if (!todayHours) {
    console.log(`[DeliveryScheduler] No hours found for today, assuming closed.`);
    return false;
  }

  try {
    const [open, close] = todayHours.split("-");
    const [openH, openM] = open.split(":").map(Number);
    const [closeH, closeM] = close.split(":").map(Number);

    const currentTime = gmt3.getHours() * 60 + gmt3.getMinutes();
    const openTime = openH * 60 + openM;
    const closeTime = closeH * 60 + closeM;

    // Check if this is a 24/7 restaurant
    const is24_7 = (openH === closeH && openM === closeM) ||
      (openH === 0 && openM === 0 && closeH === 23 && closeM === 59);

    if (is24_7) {
      return true; // Always open
    }

    // Check if the restaurant closes the next day (e.g., 20:00-03:00)
    if (closeTime < openTime) {
      // Restaurant is open if current time is after opening OR before closing (next day)
      const isOpen = currentTime >= openTime || currentTime <= closeTime;
      console.log(`[DeliveryScheduler] Next day closing. Open? ${isOpen} (Current: ${currentTime}, Open: ${openTime}, Close: ${closeTime})`);
      return isOpen;
    } else {
      // Normal case: restaurant opens and closes on the same day
      const isOpen = currentTime >= openTime && currentTime <= closeTime;
      console.log(`[DeliveryScheduler] Same day closing. Open? ${isOpen} (Current: ${currentTime}, Open: ${openTime}, Close: ${closeTime})`);
      return isOpen;
    }
  } catch (error) {
    console.error("[DeliveryScheduler] Error parsing restaurant hours:", error);
    return false;
  }
}

/**
 * Get available delivery time slots for a restaurant
 * @param {Array|Object} restaurant - Restaurant data
 * @param {number} preparationTimeMinutes - Time needed to prepare the order (default: 60 minutes)
 * @returns {Array} Array of available delivery time slots
 */
export function getAvailableDeliverySlots(restaurant, preparationTimeMinutes = 60) {
  const gmt3 = getCurrentGMT3Time();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours = getRestaurantHours(restaurant);
  const slots = [];

  // Check today and next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const checkDate = new Date(gmt3);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayName = days[checkDate.getDay()];
    const dayHours = hours[dayName];

    if (!dayHours) continue;

    try {
      const [open, close] = dayHours.split("-");
      const [openH, openM] = open.split(":").map(Number);
      const [closeH, closeM] = close.split(":").map(Number);

      // Check if this is a 24/7 restaurant (opens and closes at the same time, e.g., "00:00-00:00" or "00:00-23:59")
      const is24_7 = (openH === closeH && openM === closeM) ||
        (openH === 0 && openM === 0 && closeH === 23 && closeM === 59);

      // Calculate delivery window (30 minutes after opening to 1 hour before closing)
      const deliveryStart = new Date(checkDate);
      deliveryStart.setHours(openH, openM + 30, 0, 0); // 30 minutes after opening

      const deliveryEnd = new Date(checkDate);

      if (is24_7) {
        // For 24/7 restaurants, set end time to 23:59
        deliveryEnd.setHours(23, 59, 0, 0);
      } else if (closeH < openH || (closeH === openH && closeM < openM)) {
        // Restaurant closes the next day (e.g., 20:00-03:00)
        // Set deliveryEnd to next day at closing time minus 1 hour
        deliveryEnd.setDate(deliveryEnd.getDate() + 1);
        deliveryEnd.setHours(closeH, closeM - 60, 0, 0);
      } else {
        // Normal case: same day closing
        deliveryEnd.setHours(closeH, closeM - 60, 0, 0); // 1 hour before closing
      }

      // If it's today, make sure delivery time is in the future and accounts for preparation time
      if (dayOffset === 0) {
        const earliestDelivery = new Date(gmt3);
        earliestDelivery.setMinutes(earliestDelivery.getMinutes() + preparationTimeMinutes);

        if (earliestDelivery > deliveryStart) {
          deliveryStart.setTime(earliestDelivery.getTime());
        }
      }

      // Only add slot if there's at least 30 minutes delivery window
      if (deliveryEnd > deliveryStart) {
        slots.push({
          date: checkDate.toDateString(),
          dayName,
          startTime: deliveryStart,
          endTime: deliveryEnd,
          startTimeString: formatTime(deliveryStart),
          endTimeString: formatTime(deliveryEnd),
          isToday: dayOffset === 0,
          isTomorrow: dayOffset === 1
        });
      }
    } catch (error) {
      console.error(`[DeliveryScheduler] Error parsing hours for ${dayName}:`, error);
      continue;
    }
  }

  return slots;
}

/**
 * Generate specific time slots within a delivery window
 * @param {Object} deliveryWindow - Delivery window object from getAvailableDeliverySlots
 * @param {number} slotIntervalMinutes - Interval between time slots (default: 30 minutes)
 * @returns {Array} Array of specific time slots
 */
export function generateTimeSlots(deliveryWindow, slotIntervalMinutes = 30) {
  const slots = [];
  const current = new Date(deliveryWindow.startTime);
  const end = new Date(deliveryWindow.endTime);

  while (current <= end) {
    const slotEnd = new Date(current);
    slotEnd.setMinutes(slotEnd.getMinutes() + slotIntervalMinutes);

    if (slotEnd <= end) {
      slots.push({
        start: new Date(current),
        end: new Date(slotEnd),
        startString: formatTime(current),
        endString: formatTime(slotEnd),
        value: current.toISOString()
      });
    }

    current.setMinutes(current.getMinutes() + slotIntervalMinutes);
  }

  return slots;
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time string (HH:MM)
 */
export function formatTime(date) {
  return date.toTimeString().slice(0, 5);
}

/**
 * Get next opening time for a restaurant
 * @param {Array|Object} restaurant - Restaurant data
 * @returns {string|null} Next opening time description
 */
export function getNextOpenTime(restaurant) {
  const gmt3 = getCurrentGMT3Time();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours = getRestaurantHours(restaurant);

  // Check today and next 7 days
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
          return `Today at ${open}`;
        } else if (dayOffset === 1) {
          return `Tomorrow at ${open}`;
        } else {
          return `${dayName} at ${open}`;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

/**
 * Check if an order needs to be scheduled based on restaurant hours
 * @param {Array|Object} restaurant - Restaurant data
 * @param {number} preparationTimeMinutes - Time needed to prepare the order
 * @returns {Object} Scheduling information
 */
export function checkOrderScheduling(restaurant, preparationTimeMinutes = 60) {
  // Debug input
  console.log("[DeliveryScheduler] Checking scheduling for:", restaurant?.name || (Array.isArray(restaurant) ? restaurant[8] : 'Unknown'));

  const isOpen = isRestaurantOpen(restaurant);
  const availableSlots = getAvailableDeliverySlots(restaurant, preparationTimeMinutes);
  const nextOpening = getNextOpenTime(restaurant);

  return {
    needsScheduling: !isOpen || availableSlots.length === 0,
    isRestaurantOpen: isOpen,
    availableSlots,
    nextOpening,
    canDeliverToday: availableSlots.some(slot => slot.isToday),
    earliestDelivery: availableSlots.length > 0 ? availableSlots[0] : null
  };
}