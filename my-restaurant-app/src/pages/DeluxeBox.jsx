import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Command, CommandInput, CommandList, CommandItem, CommandGroup, CommandEmpty } from "@/components/ui/command"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const TOPPING_OPTIONS = [
  { value: "nutella", label: "Nutella" },
  { value: "black-chocolate", label: "Black Chocolate" },
  { value: "white-chocolate", label: "White Chocolate" },
  { value: "bueno", label: "Bueno" },
]

export default function DeluxeBox() {
  const navigate = useNavigate()
  const [boxType, setBoxType] = useState("2") // "2" or "4"
  const [openCombos, setOpenCombos] = useState([false, false, false, false])
  const [toppings, setToppings] = useState(["", "", "", ""])

  const numToppings = boxType === "2" ? 3 : 4
  const boxImg = boxType === "2" ? "/pancake1.jpg" : "/pancake2.jpg"

  const handleToppingSelect = (idx, value) => {
    setToppings(prev => {
      const next = [...prev]
      next[idx] = value === next[idx] ? "" : value
      return next
    })
    setOpenCombos(prev => prev.map((o, i) => (i === idx ? false : o)))
  }

  const handleOrder = () => {
    if (toppings.slice(0, numToppings).every(t => t)) {
      const selected = {
        boxType: boxType === "2" ? "Box For 2 People" : "Box For 4 People",
        toppings: toppings.slice(0, numToppings).map(v => TOPPING_OPTIONS.find(o => o.value === v)?.label),
      }
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(selected))
      navigate("/food")
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-4 border-yellow-400 bg-yellow-100">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold text-yellow-900 tracking-wide mb-2">PANTASTIC DELUX BOX</CardTitle>
          <div className="text-lg text-yellow-800 font-semibold mb-4">The Ultimate Pancake Experience</div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8 items-stretch">
            {/* Left: Image */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <img
                src={boxImg}
                alt="Pantastic Deluxe Box"
                className="w-full max-w-xs h-64 object-cover rounded-xl mb-4 border-2 border-yellow-300"
              />
              <ul className="list-disc pl-6 space-y-2 text-md text-gray-800">
                <li>Selection of our best sweet and savory pancakes</li>
                <li>Exclusive sauces and toppings</li>
                <li>Special surprise item only in the Deluxe Box</li>
                <li>Perfect for sharing or indulging solo</li>
              </ul>
            </div>
            {/* Right: Selection UI */}
            <div className="flex-1 flex flex-col gap-4 justify-start">
              <div className="flex gap-4 mb-4">
                <Button
                  className={cn(
                    "flex-1 text-lg font-bold border-2 border-yellow-600",
                    boxType === "2"
                      ? "bg-yellow-400 text-yellow-900 shadow-lg"
                      : "bg-white text-yellow-700"
                  )}
                  onClick={() => setBoxType("2")}
                >
                  Box For 2 People
                </Button>
                <Button
                  className={cn(
                    "flex-1 text-lg font-bold border-2 border-yellow-600",
                    boxType === "4"
                      ? "bg-yellow-400 text-yellow-900 shadow-lg"
                      : "bg-white text-yellow-700"
                  )}
                  onClick={() => setBoxType("4")}
                >
                  Box For 4 People
                </Button>
              </div>
              {[...Array(numToppings)].map((_, idx) => (
                <div key={idx} className="mb-2">
                  <Popover open={openCombos[idx]} onOpenChange={o => setOpenCombos(prev => prev.map((v, i) => (i === idx ? o : v)))}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombos[idx]}
                        className="w-full justify-between"
                      >
                        {toppings[idx]
                          ? TOPPING_OPTIONS.find(o => o.value === toppings[idx])?.label
                          : `Select topping #${idx + 1}`}
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search topping..." />
                        <CommandList>
                          <CommandEmpty>No topping found.</CommandEmpty>
                          <CommandGroup>
                            {TOPPING_OPTIONS.map(option => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => handleToppingSelect(idx, option.value)}
                              >
                                <CheckIcon
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    toppings[idx] === option.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {option.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
              <Button
                className="w-full text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-2 border-yellow-600 shadow-lg mt-4"
                size="lg"
                disabled={!toppings.slice(0, numToppings).every(t => t)}
                onClick={handleOrder}
              >
                Order Deluxe Box
              </Button>
              <Button variant="outline" className="w-full mt-2" onClick={() => navigate(-1)}>
                Back to Menu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
