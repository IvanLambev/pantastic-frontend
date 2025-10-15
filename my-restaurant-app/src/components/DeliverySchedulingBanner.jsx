import { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  generateTimeSlots, 
  checkOrderScheduling
} from '@/utils/deliveryScheduler';

export default function DeliverySchedulingBanner({ 
  restaurant, 
  onScheduleSelect,
  className = "" 
}) {
  const [schedulingInfo, setSchedulingInfo] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [initialized, setInitialized] = useState(false);
  // Initialize scheduling info and auto-select first available options
  useEffect(() => {
    if (!restaurant) {
      setInitialized(false);
      return;
    }

    const info = checkOrderScheduling(restaurant, 60); // 60 minutes preparation time
    setSchedulingInfo(info);

    if (info.needsScheduling && info.availableSlots.length > 0) {
      // Auto-select first available day
      const firstSlot = info.availableSlots[0];
      setSelectedDay(firstSlot.date);
      
      // Generate time slots for the first day
      const timeSlots = generateTimeSlots(firstSlot, 30); // 30-minute intervals
      setAvailableTimeSlots(timeSlots);
      
      // Auto-select first available time slot
      if (timeSlots.length > 0) {
        setSelectedTimeSlot(timeSlots[0].value);
        
        // Notify parent component immediately on initialization
        if (onScheduleSelect) {
          onScheduleSelect({
            date: firstSlot.date,
            dayName: firstSlot.dayName,
            timeSlot: timeSlots[0],
            isScheduled: true
          });
        }
      }
    }
    setInitialized(true);
  }, [restaurant, onScheduleSelect]);

  // Handle day changes
  useEffect(() => {
    if (!schedulingInfo || !selectedDay || !initialized) return;

    // Find the selected day's delivery window
    const daySlot = schedulingInfo.availableSlots.find(slot => slot.date === selectedDay);
    if (daySlot) {
      const timeSlots = generateTimeSlots(daySlot, 30);
      setAvailableTimeSlots(timeSlots);
      
      // Reset time slot selection when day changes
      if (timeSlots.length > 0) {
        setSelectedTimeSlot(timeSlots[0].value);
      }
    }
  }, [selectedDay, schedulingInfo, initialized]);



  const handleTimeSlotChange = (timeSlotValue) => {
    setSelectedTimeSlot(timeSlotValue);
    
    // Notify parent component immediately for user interactions
    const selectedSlot = availableTimeSlots.find(slot => slot.value === timeSlotValue);
    const daySlot = schedulingInfo.availableSlots.find(slot => slot.date === selectedDay);
    
    if (selectedSlot && daySlot && onScheduleSelect) {
      onScheduleSelect({
        date: selectedDay,
        dayName: daySlot.dayName,
        timeSlot: selectedSlot,
        isScheduled: true
      });
    }
  };

  const handleDayChange = (dayValue) => {
    setSelectedDay(dayValue);
    
    // Find the new day's delivery window and auto-select first time slot
    const daySlot = schedulingInfo.availableSlots.find(slot => slot.date === dayValue);
    if (daySlot) {
      const timeSlots = generateTimeSlots(daySlot, 30);
      setAvailableTimeSlots(timeSlots);
      
      if (timeSlots.length > 0) {
        const firstTimeSlot = timeSlots[0];
        setSelectedTimeSlot(firstTimeSlot.value);
        
        // Notify parent component
        if (onScheduleSelect) {
          onScheduleSelect({
            date: dayValue,
            dayName: daySlot.dayName,
            timeSlot: firstTimeSlot,
            isScheduled: true
          });
        }
      }
    }
  };

  if (!restaurant || !schedulingInfo || !Array.isArray(restaurant) || restaurant.length === 0) {
    return null;
  }

  // If restaurant is open and can deliver now, show success message
  if (!schedulingInfo.needsScheduling) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>{restaurant[8] || 'Restaurant'}</strong> is open now! Your order will be prepared and delivered as soon as possible.
        </AlertDescription>
      </Alert>
    );
  }

  // If no delivery slots available, show error
  if (schedulingInfo.availableSlots.length === 0) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>{restaurant[8] || 'Restaurant'}</strong> is currently closed and has no available delivery slots in the next 7 days. 
          {schedulingInfo.nextOpening && (
            <span> Next opening: {schedulingInfo.nextOpening}</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Show scheduling interface
  return (
    <Card className={`border-orange-200 bg-orange-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-orange-800 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Schedule Your Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-300 bg-orange-100">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{restaurant[8] || 'Restaurant'}</strong> is currently closed. Please select a delivery time that coordinates with the restaurant's working hours.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Day Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-800">Select Day</label>
            <Select value={selectedDay} onValueChange={handleDayChange}>
              <SelectTrigger className="border-orange-300">
                <SelectValue placeholder="Choose a day" />
              </SelectTrigger>
              <SelectContent>
                {schedulingInfo.availableSlots.map((slot) => (
                  <SelectItem key={slot.date} value={slot.date}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {slot.isToday ? 'Today' : slot.isTomorrow ? 'Tomorrow' : slot.dayName}
                        <span className="text-xs text-gray-500 ml-1">
                          ({slot.startTimeString} - {slot.endTimeString})
                        </span>
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-orange-800">Select Time</label>
            <Select value={selectedTimeSlot} onValueChange={handleTimeSlotChange}>
              <SelectTrigger className="border-orange-300">
                <SelectValue placeholder="Choose a time" />
              </SelectTrigger>
              <SelectContent>
                {availableTimeSlots.map((slot) => (
                  <SelectItem key={slot.value} value={slot.value}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{slot.startString} - {slot.endString}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedDay && selectedTimeSlot && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Delivery scheduled:</strong> Your order will be delivered on{' '}
              {schedulingInfo.availableSlots.find(s => s.date === selectedDay)?.isToday ? 'today' : 
               schedulingInfo.availableSlots.find(s => s.date === selectedDay)?.isTomorrow ? 'tomorrow' :
               schedulingInfo.availableSlots.find(s => s.date === selectedDay)?.dayName} at{' '}
              {availableTimeSlots.find(s => s.value === selectedTimeSlot)?.startString} - {' '}
              {availableTimeSlots.find(s => s.value === selectedTimeSlot)?.endString}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}