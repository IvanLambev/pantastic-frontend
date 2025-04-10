import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useState } from "react"
import { CarouselDots } from "@/components/carousel-dots"

const Home = () => {
  const [api, setApi] = useState(null)
  const images = [
    "/pancake1.jpg",
    "/pancake2.jpg",
    "/pancake3.jpg"
  ]

  return (
    <div className="w-full relative">
      <Carousel 
        plugins={[
          Autoplay({
            delay: 2000,
          }),
        ]} 
        className="w-full"
        setApi={setApi}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <Card className="border-none">
                <CardContent className="p-0">
                  <img 
                    src={image} 
                    alt={`Pancake ${index + 1}`}
                    className="w-full h-[calc(100vh-6rem)] object-cover"
                  />
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots api={api} count={images.length} />
      </Carousel>
    </div>
  )
}

export default Home