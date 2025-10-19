import { ShoppingCart, Clock, Utensils } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { t } from "@/utils/translations"

export default function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('home.howItWorksTitle')}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('home.howItWorksDesc')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Utensils className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">{t('home.browseMenuStep')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t('home.browseMenuDesc')}</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">{t('home.addToCartStep')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t('home.addToCartDesc')}</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 hover:border-orange-300 transition-colors">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">{t('home.enjoyFreshStep')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t('home.enjoyFreshDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
