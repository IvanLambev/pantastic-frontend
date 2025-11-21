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
    title: "Поръчай за вкъщи",
    subtitle: "Насладете се на любимите си палачинки от комфорта на дома си",
    ctaText: "Поръчай сега",
    ctaLink: "/food"
  },
  {
    image: "/pancake2.jpg",
    title: "Свежи и вкусни палачинки",
    subtitle: "Приготвени с любов и качествени съставки",
    ctaText: "Виж менюто",
    ctaLink: "/food"
  },
  {
    image: "/pancake3.jpg",
    title: "Deluxe Box",
    subtitle: "Перфектният избор за споделяне",
    ctaText: "Научи повече",
    ctaLink: "/deluxe-box"
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
                  <div className="relative h-[60vh] md:h-[70vh] lg:h-[85vh] w-full overflow-hidden">
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center">
                      <div className="container mx-auto px-4 md:px-8 lg:px-12">
                        <div className="max-w-2xl text-white space-y-4 md:space-y-6">
                          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-left-8 duration-700">
                            {slide.title}
                          </h1>
                          {slide.subtitle && (
                            <p className="text-lg md:text-xl lg:text-2xl text-gray-200 animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
                              {slide.subtitle}
                            </p>
                          )}
                          <div className="animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                            <Button 
                              size="lg" 
                              className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 h-auto bg-primary hover:bg-primary/90 shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                              onClick={() => navigate(slide.ctaLink)}
                            >
                              {slide.ctaText}
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
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
              className={`w-3 h-3 rounded-full transition-all ${
                selectedIndex === index ? "bg-white scale-110" : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  )
}
