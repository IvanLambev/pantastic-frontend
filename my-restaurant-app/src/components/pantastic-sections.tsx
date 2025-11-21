import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

interface Section {
  image: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  imagePosition: "left" | "right"
}

const sections: Section[] = [
  {
    image: "/pancake1.jpg",
    title: "ДОСТАВЯМЕ ДО ВАС",
    description: "Поръчай любимата си палачинка или опитай нашия Deluxe Box!",
    ctaText: "ПОРЪЧАЙ ТУК!",
    ctaLink: "/food",
    imagePosition: "left"
  },
  {
    image: "/pancake2.jpg",
    title: "ИМА НИ И В ГЕО МИЛЕВ",
    description: "Ще ни намерите на ул. \"Акад. Никола Обрешков 2а\".",
    ctaText: "ПОРЪЧАЙ ТУК!",
    ctaLink: "/food",
    imagePosition: "right"
  },
  {
    image: "/pancake3.jpg",
    title: "СОФИЯ Е ВЕЧЕ ПО-ВКУСНА!",
    description: "Очакваме ви в нашия апетитен хотспот Пантастик на ул. \"Ангел Кънчев\" № 10!",
    ctaText: "КЪМ ЛОКАЦИЯТА",
    ctaLink: "/food",
    imagePosition: "left"
  },
  {
    image: "/pancake1.jpg",
    title: "PLOVEDIV, ЗДРАВЕЙ!",
    description: "Посетете ни в Пловдив в Мол Марково Тепе. Доставяме всеки ден от 10 до 22 ч.",
    ctaText: "ПОРЪЧАЙ В ПЛОВДИВ",
    ctaLink: "/food",
    imagePosition: "right"
  },
  {
    image: "/pancake2.jpg",
    title: "ИМА НИ И В EAT BOX",
    description: "Ще ни намерите на бул. Черни Връх 69 в EatBox. Тук е мястото, където можеш да разпуснеш с приятели и да хапнеш нещо вкусно!",
    ctaText: "НАШАТА КОНЦЕПЦИЯ",
    ctaLink: "/about",
    imagePosition: "left"
  },
  {
    image: "/pancake3.jpg",
    title: "АМЕРИКАНСКИ ПАЛАЧИНКИ",
    description: "Въздушни и пухкави... По оригинална рецепта с много неустоими съставки. Опитахте ли ги?",
    ctaText: "ПОРЪЧАЙ СЕГА!",
    ctaLink: "/food",
    imagePosition: "right"
  },
  {
    image: "/pancake1.jpg",
    title: "СТАНИ НАШ ПАРТНЬОР!",
    description: "16 години опит и гъвкава концепция без конкуренция. Разберете повече за нашия франчайз модел!",
    ctaText: "НАШАТА КОНЦЕПЦИЯ",
    ctaLink: "/about",
    imagePosition: "left"
  }
]

export function PantasticSections() {
  const navigate = useNavigate()

  return (
    <div className="w-full">
      {sections.map((section, index) => (
        <div 
          key={index} 
          className={`grid grid-cols-1 lg:grid-cols-2 min-h-[400px] md:min-h-[500px] ${
            index % 2 === 0 ? '' : 'bg-muted/30'
          }`}
        >
          {/* Image */}
          <div 
            className={`relative h-[300px] md:h-[400px] lg:h-auto ${
              section.imagePosition === "right" ? "lg:order-2" : ""
            }`}
          >
            <img 
              src={section.image} 
              alt={section.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Content */}
          <div 
            className={`flex items-center justify-center p-8 md:p-12 lg:p-16 ${
              section.imagePosition === "right" ? "lg:order-1" : ""
            }`}
          >
            <div className="max-w-xl space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {section.title}
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {section.description}
              </p>
              <Button 
                size="lg"
                className="text-base md:text-lg px-8 py-6 h-auto"
                onClick={() => navigate(section.ctaLink)}
              >
                {section.ctaText}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
