import { Truck, MapPin, Clock, Leaf } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeliveryPickupInfo() {
  return (
    <section className="py-16 px-4 bg-orange-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Delivery and Pickup Information</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We offer both delivery and pickup options for all orders. Delivery is available every day between 8 AM and 4
            PM within the city limits. Orders typically arrive within 30–45 minutes. If you prefer to pick up your
            order, just select "Pickup" at checkout and stop by our location at your scheduled time. All packaging is
            eco-friendly and designed to keep your pancakes hot.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Delivery Service</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Daily: 8 AM - 4 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Within city limits</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">30-45 minutes delivery time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl text-gray-900">Pickup Option</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Schedule your pickup time</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Eco-friendly packaging</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Keeps pancakes hot</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
