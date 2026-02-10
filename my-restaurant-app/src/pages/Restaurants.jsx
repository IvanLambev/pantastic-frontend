import { useState, useEffect } from "react";
import { API_URL } from '@/config/api';
import { fetchWithAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Store } from "lucide-react";
import { openInMaps } from "@/utils/mapsHelper";

// Helper function to parse opening hours (handles both string and object formats)
const parseOpeningHours = (hours) => {
  if (!hours) return {};
  
  // If it's already an object, return it
  if (typeof hours === 'object' && !Array.isArray(hours)) {
    return hours;
  }
  
  // If it's a string, try to parse it
  if (typeof hours === 'string') {
    try {
      return JSON.parse(hours);
    } catch (e) {
      console.error('Error parsing opening hours:', e);
      return {};
    }
  }
  
  return {};
};

// Helper function to translate day names to Bulgarian
const translateDay = (day) => {
  const dayTranslations = {
    'Monday': 'Понеделник',
    'Tuesday': 'Вторник',
    'Wednesday': 'Сряда',
    'Thursday': 'Четвъртък',
    'Friday': 'Петък',
    'Saturday': 'Събота',
    'Sunday': 'Неделя'
  };
  return dayTranslations[day] || day;
};

// Helper function to get current day
const getCurrentDay = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + 3 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[gmt3.getDay()];
};

// Helper function to check if restaurant is open now
const isRestaurantOpen = (openingHours) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const gmt3 = new Date(utc + 3 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = days[gmt3.getDay()];
  
  const hours = parseOpeningHours(openingHours);
  const todayHours = hours[currentDay];
  
  if (!todayHours) return false;
  
  const [open, close] = todayHours.split("-");
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  
  const currentTime = gmt3.getHours() * 60 + gmt3.getMinutes();
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  
  // Check if the restaurant closes the next day (e.g., 10:00-03:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  } else {
    return currentTime >= openTime && currentTime <= closeTime;
  }
};

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetchWithAuth(`${API_URL}/restaurant/restaurants`);
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        const data = await response.json();
        setRestaurants(data);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('Грешка при зареждане на ресторанти');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Нашите Ресторанти
          </h1>
          <p className="text-xl text-gray-600">
            Открийте локациите на всички наши ресторанти и работното им време
          </p>
        </div>

        {/* Restaurant Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {restaurants.map((restaurant) => {
            const hours = parseOpeningHours(restaurant.opening_hours);
            const isOpen = isRestaurantOpen(restaurant.opening_hours);
            const currentDay = getCurrentDay();
            const currentDayBG = translateDay(currentDay);
            const todayHours = hours[currentDay];

            return (
              <Card key={restaurant.restaurant_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-2xl">{restaurant.name}</CardTitle>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isOpen 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {isOpen ? 'Отворено' : 'Затворено'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Location */}
                  <div className="mb-6">
                    <div className="flex items-start gap-3 mb-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Адрес</p>
                        <p 
                          className="text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={() => openInMaps(restaurant.address, restaurant.city)}
                        >
                          {restaurant.address}, {restaurant.city}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Today's Hours - Prominent Display */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <p className="font-semibold text-gray-900">Днес ({currentDayBG})</p>
                    </div>
                    <div className="ml-8">
                      <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
                        isOpen 
                          ? 'bg-green-100/60 text-green-700' 
                          : 'bg-gray-200/60 text-gray-700'
                      }`}>
                        {todayHours || 'Затворено'}
                      </div>
                    </div>
                  </div>

                  {/* Full Week Working Hours */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <p className="font-semibold text-gray-900">Пълно работно време</p>
                    </div>
                    <div className="ml-8 space-y-2">
                      {daysOrder.map((day) => {
                        const dayHours = hours[day];
                        const isToday = day === currentDay;

                        return (
                          <div 
                            key={day} 
                            className={`flex justify-between py-2 px-3 rounded-lg ${
                              isToday ? 'bg-orange-50 font-semibold' : 'bg-gray-50'
                            }`}
                          >
                            <span className={isToday ? 'text-orange-700' : 'text-gray-700'}>
                              {translateDay(day)}
                            </span>
                            <span className={isToday ? 'text-orange-700' : 'text-gray-600'}>
                              {dayHours || 'Затворено'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
