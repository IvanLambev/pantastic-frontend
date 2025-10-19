import { Heart, Users, Coffee } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { t } from "@/utils/translations"

export default function AboutUs() {
  return (
    <section className="py-16 px-4 bg-orange-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('about.title')}</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center border-orange-200 bg-white">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('about.valuesTitle')}</h3>
              <p className="text-gray-600">{t('about.valuesDesc')}</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 bg-white">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('about.teamTitle')}</h3>
              <p className="text-gray-600">{t('about.teamDesc')}</p>
            </CardContent>
          </Card>

          <Card className="text-center border-orange-200 bg-white">
            <CardContent className="pt-8">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Coffee className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('about.kitchenTitle')}</h3>
              <p className="text-gray-600">{t('about.kitchenDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
