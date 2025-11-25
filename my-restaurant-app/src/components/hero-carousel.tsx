import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import Autoplay from "embla-carousel-autoplay"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"

interface HeroSlide {
  image: string
  title: string
  subtitle?: string
  ctaText: string
  ctaLink: string
}

const slides: HeroSlide[] = [
  {
    image: "/pancake1.jpg",
    title: "ПАНТАСТИК В МОЛ ЯМБОЛ!",
    subtitle: "Заповядайте в мол Ямбол на ул. \"Александър Стамболийски\" 30. Работим всеки ден от 8:00 до 00:00ч. в полунощ!",
    ctaText: "",
    ctaLink: ""
  },
  {
    image: "/pancake2.jpg",
    title: "СКОРО И В СТУДЕНТСКИ ГРАД!",
    subtitle: "Очаквайте скоро нашия нов обект. Отваряме в края на м. Септермври! Ще работим всеки ден от 10:00 до 03:00ч. в полунощ!",
    ctaText: "",
    ctaLink: ""
  },
  {
    image: "/pancake3.jpg",
    title: "ВЕЛИКО ТЪРНОВО ВЕЧЕ НИ Е ОЩЕ ПО-ЛЮБИМ!",
    subtitle: "Заповядайте на ул. \"Христо Караминков\" 33 всеки ден от 8:00 до 00:00ч. в полунощ!",
    ctaText: "ВИЖ ЛОКАЦИЯТА",
    ctaLink: "/food"
  },
  {
    image: "/pancake1.jpg",
    title: "ПАНТАСТИК ВЕЧЕ И В МЕДЕН РУДНИК!",
    subtitle: "Заповядайте в новооткрития ни обект в комплекс ''Меден Рудник'' гр. Бургас. Работим всеки ден от 10:00 до 24:00 ч.",
    ctaText: "ПОРЪЧАЙ ЗА ВКЪЩИ",
    ctaLink: "/food"
  },
  {
    image: "/pancake2.jpg",
    title: "ДОСТАВЯМЕ ДО ВАС",
    subtitle: "Поръчай любимата си палачинка или опитай нашия Deluxe Box!",
    ctaText: "ПОРЪЧАЙ ТУК!",
    ctaLink: "/food"
  },
  {
    image: "/pancake3.jpg",
    title: "ИМА НИ И В ГЕО МИЛЕВ",
    subtitle: "Ще ни намерите на ул. \"Акад. Никола Обрешков 2а\".",
    ctaText: "ПОРЪЧАЙ ТУК!",
    ctaLink: "/food"
  },
  {
    image: "/pancake1.jpg",
    title: "СОФИЯ Е ВЕЧЕ ПО-ВКУСНА!",
    subtitle: "Очакваме ви в нашия апетитен хотспот Пантастик на ул. \"Ангел Кънчев\" № 10!",
    ctaText: "КЪМ ЛОКАЦИЯТА",
    ctaLink: "/food"
  },
  {
    image: "/pancake2.jpg",
    title: "PLOVEDIV, ЗДРАВЕЙ!",
    subtitle: "Посетете ни в Пловдив в Мол Марково Тепе. Доставяме всеки ден от 10 до 22 ч.",
    ctaText: "ПОРЪЧАЙ В ПЛОВДИВ",
    ctaLink: "/food"
  },
  {
    image: "/pancake3.jpg",
    title: "ИМА НИ И В EAT BOX",
    subtitle: "Ще ни намерите на бул. Черни Връх 69 в EatBox. Тук е мястото, където можеш да разпуснеш с приятели и да хапнеш нещо вкусно!",
    ctaText: "НАШАТА КОНЦЕПЦИЯ",
    ctaLink: "/about"
  },
  {
    image: "/pancake1.jpg",
    title: "АМЕРИКАНСКИ ПАЛАЧИНКИ",
    subtitle: "Въздушни и пухкави... По оригинална рецепта с много неустоими съставки. Опитахте ли ги?",
    ctaText: "ПОРЪЧАЙ СЕГА!",
    ctaLink: "/food"
  },
  {
    image: "/pancake2.jpg",
    title: "СТАНИ НАШ ПАРТНЬОР!",
    subtitle: "16 години опит и гъвкава концепция без конкуренция. Разберете повече за нашия франчайз модел!",
    ctaText: "НАШАТА КОНЦЕПЦИЯ",
    ctaLink: "/about"
  }
]

export function HeroCarousel() {
  const [api, setApi] = React.useState<any>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!api) return

    api.on("select", () => {
      setSelectedIndex(api.selectedScrollSnap())
    })
  }, [api])

  return (
    <div className="w-full relative">
      <Carousel
        plugins={[
          Autoplay({
            delay: 5000,
          }),
        ]}
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <Card className="border-none rounded-none">
                <CardContent className="p-0 relative">
                  {/* Image */}
                  <div className="relative h-[45vh] md:h-[70vh] lg:h-[85vh] w-full overflow-hidden">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="container mx-auto px-4 md:px-8 lg:px-12">
                        <div className="max-w-2xl mx-auto text-white space-y-4 md:space-y-6 text-center">
                          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight animate-in fade-in duration-700">
                            {slide.title}
                          </h1>
                          {slide.subtitle && (
                            <p className="text-base md:text-lg lg:text-xl text-gray-200 animate-in fade-in duration-700 delay-100">
                              {slide.subtitle}
                            </p>
                          )}
                          {slide.ctaText && (
                            <div className="animate-in fade-in duration-700 delay-200">
                              <Button
                                size="default"
                                className="text-sm md:text-base bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                                onClick={() => navigate(slide.ctaLink)}
                              >
                                {slide.ctaText}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Carousel dots positioned at bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all ${selectedIndex === index ? "bg-white scale-110" : "bg-white/50 hover:bg-white/70"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  )
}
