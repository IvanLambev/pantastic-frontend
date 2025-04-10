import React from "react"


export function CarouselDots({ api, count }) {
    const [selectedIndex, setSelectedIndex] = React.useState(0)
  
    React.useEffect(() => {
      if (!api) return
  
      api.on("select", () => {
        setSelectedIndex(api.selectedScrollSnap())
      })
    }, [api])
  
    const dots = Array.from({ length: count }, (_, i) => (
      <button
        key={i}
        onClick={() => api?.scrollTo(i)}
        className={`w-2 h-2 rounded-full mx-1 py-1 transition-all ${
          selectedIndex === i ? "bg-black" : "bg-white/50"
        }`}
      />
    ))
  
    return (
      <div className="absolute bottom-4 left-0 py-4 right-0 flex justify-center">
        {dots}
      </div>
    )
  }