import { Truck, MapPin, Clock, Leaf } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { t } from "@/utils/translations"

export default function DeliveryPickupInfo() {
  return (
    <section className="py-16 px-4 bg-orange-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('delivery.title')}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('delivery.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">{t('delivery.deliveryService')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{t('delivery.daily')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{t('delivery.withinCityLimits')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{t('delivery.deliveryTime')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">{t('delivery.pickupOption')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{t('delivery.schedulePickup')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{t('delivery.ecoFriendly')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">{t('delivery.keepsPancakesHot')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
