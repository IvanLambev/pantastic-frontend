import { useState, useEffect } from "react";
import { API_URL } from '@/config/api';
import { fetchWithAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Store } from "lucide-react";
import { openInMaps } from "@/utils/mapsHelper";
import { parseOpeningHours } from "@/utils/ipGeolocation";

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
  const eetTime = new Date(utc + 2 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[eetTime.getDay()];
};

// Helper function to check if restaurant is open now
const isRestaurantOpen = (openingHours) => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const eetTime = new Date(utc + 2 * 3600000);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = days[eetTime.getDay()];
  
  const hours = parseOpeningHours(openingHours);
  const todayHours = hours[currentDay];
  
  if (!todayHours) return false;
  
  const [open, close] = todayHours.split("-");
  const [openH, openM] = open.split(":").map(Number);
  const [closeH, closeM] = close.split(":").map(Number);
  
  const currentTime = eetTime.getHours() * 60 + eetTime.getMinutes();
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  
  // Check if the restaurant closes the next day (e.g., 10:00-03:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  } else {
    return currentTime >= openTime && currentTime <= closeTime;
  }
};

// Helper function to check if restaurant is open on a specific day and time
const isRestaurantOpenOnDay = (openingHours, day) => {
  const hours = parseOpeningHours(openingHours);
  const dayHours = hours[day];
  return dayHours && dayHours !== 'Затворено';
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight break-words mb-4 px-2">
            Нашите Ресторанти
          </h1>
          <p className="text-base sm:text-xl text-gray-600 px-2">
            Открийте локациите на всички наши ресторанти и работното им време
          </p>
        </div>

        {/* Restaurant Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {restaurants.map((restaurant) => {
            const hours = parseOpeningHours(restaurant.opening_hours);
            const isOpen = isRestaurantOpen(restaurant.opening_hours);
            const currentDay = getCurrentDay();

            return (
              <Card key={restaurant.restaurant_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="bg-white border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-gray-600" />
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
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-left">Адрес</p>
                        <p 
                          className="text-gray-600 hover:text-blue-600 hover:underline cursor-pointer text-left"
                          onClick={() => openInMaps(restaurant.address, restaurant.city)}
                        >
                          {restaurant.address}, {restaurant.city}
                        </p>
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
                        const isDayOpen = isRestaurantOpenOnDay(restaurant.opening_hours, day);

                        return (
                          <div 
                            key={day} 
                            className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                              isToday && isDayOpen ? 'bg-green-50' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`${isToday ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {translateDay(day)}
                              </span>
                              {isToday && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  isDayOpen 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {isDayOpen ? 'Отворено' : 'Затворено'}
                                </span>
                              )}
                            </div>
                            <span className={`${isToday ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
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
