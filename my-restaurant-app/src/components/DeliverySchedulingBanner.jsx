import { useState, useEffect } from 'react';
import { Clock, Calendar, AlertCircle, CheckCircle, Clock2Icon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { 
  checkOrderScheduling
} from '@/utils/deliveryScheduler';
import { t } from '@/utils/translations';

export default function DeliverySchedulingBanner({ 
  restaurant, 
  onScheduleSelect,
  className = "" 
}) {
  const [schedulingInfo, setSchedulingInfo] = useState(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Get time 30 minutes from now
  const getDefaultTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  // Initialize scheduling info and auto-select first available options
  useEffect(() => {
    if (!restaurant) {
      setInitialized(false);
      return;
    }

    const info = checkOrderScheduling(restaurant, 30); // 30 minutes preparation time
    setSchedulingInfo(info);

    if (info.needsScheduling && info.availableSlots.length > 0) {
      // Auto-select first available day
      const firstSlot = info.availableSlots[0];
      setSelectedDay(firstSlot.date);
      
      // Set default time to 30 minutes from now
      const defaultTime = getDefaultTime();
      setSelectedTime(defaultTime);
    }
    setInitialized(true);
  }, [restaurant]); // Remove onScheduleSelect dependency

  // Handle day changes
  useEffect(() => {
    if (!schedulingInfo || !selectedDay || !initialized) return;

    // Reset time to default when day changes
    const defaultTime = getDefaultTime();
    setSelectedTime(defaultTime);
  }, [selectedDay, schedulingInfo, initialized]);

  // Notify parent when both day and time are selected
  useEffect(() => {
    if (!initialized || !schedulingInfo?.needsScheduling || !selectedDay || !selectedTime) return;
    
    const daySlot = schedulingInfo.availableSlots.find(slot => slot.date === selectedDay);
    
    if (daySlot && onScheduleSelect) {
      onScheduleSelect({
        date: selectedDay,
        dayName: daySlot.dayName,
        timeSlot: {
          startString: selectedTime,
          endString: selectedTime,
          value: selectedTime
        },
        isScheduled: true
      });
    }
  }, [selectedDay, selectedTime, initialized]); // eslint-disable-line react-hooks/exhaustive-deps


  const handleTimeChange = (e) => {
    const time = e.target.value;
    setSelectedTime(time);
    
    // Notify parent component immediately for user interactions
    const daySlot = schedulingInfo.availableSlots.find(slot => slot.date === selectedDay);
    
    if (daySlot && onScheduleSelect) {
      onScheduleSelect({
        date: selectedDay,
        dayName: daySlot.dayName,
        timeSlot: {
          startString: time,
          endString: time,
          value: time
        },
        isScheduled: true
      });
    }
  };

  const handleDayChange = (dayValue) => {
    setSelectedDay(dayValue);
    
    // Find the new day's delivery window
    const daySlot = schedulingInfo.availableSlots.find(slot => slot.date === dayValue);
    if (daySlot) {
      // Maintain the selected time or use default
      const currentTime = selectedTime || getDefaultTime();
      
      // Notify parent component
      if (onScheduleSelect) {
        onScheduleSelect({
          date: dayValue,
          dayName: daySlot.dayName,
          timeSlot: {
            startString: currentTime,
            endString: currentTime,
            value: currentTime
          },
          isScheduled: true
        });
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
          <strong>{restaurant[8] || 'Restaurant'}</strong> {t('restaurantSelector.open')} сега! Вашата поръчка ще бъде приготвена и доставена възможно най-скоро.
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
          <strong>{restaurant[8] || 'Restaurant'}</strong> {t('checkout.restaurantClosedMsg')} и няма налични часове за доставка през следващите 7 дни. 
          {schedulingInfo.nextOpening && (
            <span> {t('checkout.nextOpening')}: {schedulingInfo.nextOpening}</span>
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
          {t('checkout.scheduleYourDelivery')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-300 bg-orange-100">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>{restaurant[8] || 'Restaurant'}</strong> {t('checkout.restaurantClosedSchedule')}
          </AlertDescription>
        </Alert>

        {/* Day Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-orange-800">{t('checkout.selectDay')}</label>
          <Select value={selectedDay} onValueChange={handleDayChange}>
            <SelectTrigger className="border-orange-300">
              <SelectValue placeholder={t('checkout.chooseDay')} />
            </SelectTrigger>
            <SelectContent>
              {schedulingInfo.availableSlots.map((slot) => (
                <SelectItem key={slot.date} value={slot.date}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {slot.isToday ? t('checkout.today') : slot.isTomorrow ? t('checkout.tomorrow') : slot.dayName}
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
      </CardContent>
      <CardFooter className="bg-card border-t">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="delivery-time">{t('checkout.selectTimeSlot')}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="delivery-time"
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              <InputGroupAddon>
                <Clock2Icon className="text-muted-foreground" />
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </FieldGroup>
      </CardFooter>
      <CardContent className="pt-0">

        {selectedDay && selectedTime && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>{t('checkout.deliveryScheduled')}:</strong> {t('checkout.deliveryScheduledMsg')}{' '}
              {schedulingInfo.availableSlots.find(s => s.date === selectedDay)?.isToday ? t('checkout.today') : 
               schedulingInfo.availableSlots.find(s => s.date === selectedDay)?.isTomorrow ? t('checkout.tomorrow') :
               schedulingInfo.availableSlots.find(s => s.date === selectedDay)?.dayName} {t('checkout.at')}{' '}
              {selectedTime}.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}