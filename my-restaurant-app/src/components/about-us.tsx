import { Heart, Users, Coffee } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutUs() {
  return (
    <section className="py-16 px-4 bg-orange-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Who We Are</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            We're a small team of breakfast lovers who believe pancakes should be easy to order and even easier to
            enjoy. Our mission is to deliver warm, comforting stacks that brighten your morning, whether you're at home,
            at work, or just craving something sweet.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-orange-200 bg-white">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Made with Love</h3>
              <p className="text-gray-600">Every pancake is crafted with care and passion for breakfast perfection</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 bg-white">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Small Team</h3>
              <p className="text-gray-600">A dedicated group of breakfast enthusiasts committed to quality</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 bg-white">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Coffee className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Morning Comfort</h3>
              <p className="text-gray-600">Bringing warmth and comfort to brighten your day</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
