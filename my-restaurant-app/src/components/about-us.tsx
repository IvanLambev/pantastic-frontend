import { Target, Lightbulb, CheckCircle2, Shield, Wrench, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutUs() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Ние сме Пантастик</h1>
        </div>

        {/* Story Section with Image */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-orange-600 mb-6">Нашата история</h2>
              <div className="text-gray-700 space-y-4 text-base leading-relaxed">
                <p>
                  Нашата история започва през 2009 година, когато изпълнени с ентусиазъм и множество идеи се хвърлихме в дълбините на динамичния и конкурентен Fast Food / Food To Go бранш. Първият ни обект в родния Бургас беше по-скоро скромен и импровизиран, но изграден с много желание и хъс. А скоро след това предлагането ни вече започваше да се радва на голяма популярност.
                </p>
                <p>
                  Преминахме през най-различни метаморфози. Познахме моменти както на експанзия, така и на свиване. Обучихме десетки служители, адаптирахме концепцията си към общо 14 разнородни локации и пространства, сред които обекти в молове, улични търговски обекти с и без седящи места, shop in shop концепции, плажни заведения и поп-ъп събития. След извънредно предизвикателната за целия бранш Ковид ситуация, успяхме да съхраним 3 от локациите си, които работят без прекъсване до днес.
                </p>
                <p>
                  Към днешна дата сме горди създатели на първия и единствен български фудбранд с фокус монопродукта палачинка, който работи с успешен скалируем бизнес модел. И нямаме търпение да изследваме неговия потенциал!
                </p>
                <p>
                  Множеството сценарии, през които сме преминали през годините, ни помагат да сме гъвкави координатори на дейността на нашите франчайз партньори и да имаме готови решения за всевъзможни бизнес предизвикателства.
                </p>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src="/pantastic-pancakes-manager-slavov-ivelin-683x1024.jpg" 
                alt="Пантастик Мениджър" 
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Concept Section */}
        <div className="mb-20 bg-white rounded-3xl p-10 shadow-lg">
          <h2 className="text-3xl font-bold text-orange-600 mb-6 text-center">Пантастична концепция</h2>
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Фаст фууд с изискан вкус. Мит или реалност?
          </h3>
          
          <div className="text-gray-700 space-y-4 text-base leading-relaxed max-w-4xl mx-auto">
            <p>
              В традиционното разбиране изисканият вкус е привилегия на високите слоеве на обществото и се приписва предимно на деликатеси, екзотичните плодове, морски дарове, скъпи вина и десерти, поднесени в сребърни блюда.
            </p>
            <p>
              Противоположно обаче е нашето виждане: има далеч по-непретенциозни храни, вариации и комбинации, които умело галят небцето, а са принудени да се задоволяват с резервната скамейка на "неделната закуска".
            </p>
            <p className="text-xl font-semibold text-orange-600 text-center py-4">
              Палачинката се завръща на трапезата!
            </p>
            <p className="text-center text-sm text-gray-600">
              (Mакар, че не е слизала от там.) Но в неподозирано многообразие и по всяко време на деня.
            </p>
            <p>
              С въображение и опит даваме заслужен нов хоризонт на това богато интерпретирано ястие в световната кухня. Защото изисканият вкус се дължи на познаване на вкусовите качества на продуктите и тяхното правилно комбиниране. Добре обмислените комбинации не претоварват сетивата, а ни оставят да усетим всички оттенъци на вкуса.
            </p>
          </div>
        </div>

        {/* Our Model Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-orange-600 mb-4 text-center">Нашият модел</h2>
          <p className="text-gray-700 text-center mb-10 text-lg">
            включва утвърдени работни практики, които през годините са доказали своята ефективност.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Постоянен контрол на качеството
                </h3>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Поддържане на фирмена етика, ориентирана към индивида
                </h3>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Оптимизация на труда
                </h3>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Спазване на високи хигиенни изисквания
                </h3>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-white to-orange-50 hover:shadow-lg transition-shadow">
              <CardContent className="pt-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Wrench className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Модерно технологично оборудване
                </h3>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mission Section */}
        <div className="mb-20 bg-gradient-to-r from-orange-100 to-orange-50 rounded-3xl p-10 shadow-lg">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mx-auto w-20 h-20 bg-orange-200 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-orange-600 mb-6">Нашата мисия</h2>
            <p className="text-2xl font-semibold text-gray-800 mb-6">
              Разкошът на избора. Достъпен. Ежедневно. И по твой вкус.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Палачинковите ни специалитети предлагат пълноценно и разнообразно хранене. Прилагайки гъвкава политика, ние се стремим нашите продукти да бъдат адаптирани според финансовите специфики на пазара, без компромиси с качество и ресурси. С нас, клиентът преоткрива любими вкусове от детството и създава нови за бъдещето.
            </p>
          </div>
        </div>

        {/* Vision Section */}
        <div className="text-center bg-orange-600 text-white rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6">Визията ни занапред</h2>
          <p className="text-2xl font-semibold">
            Сити и доволни клиенти във всеки голям български и европейски град!
          </p>
        </div>
      </div>
    </section>
  )
}
