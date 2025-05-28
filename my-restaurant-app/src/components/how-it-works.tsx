import { ShoppingCart, Clock, Utensils } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Order Your Pancakes</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ordering pancakes has never been easier. Just scroll through our menu, choose your favorite items, and add
            them to your cart. Once you're ready, head to checkout and choose your delivery or pickup option. You'll get
            hot, fluffy pancakes in no time — fresh off the griddle and made just for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Browse Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Explore our delicious selection of pancakes and toppings</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Add to Cart</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Select your favorites and customize your order</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Enjoy Fresh</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Get hot, fluffy pancakes delivered or pick them up</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
