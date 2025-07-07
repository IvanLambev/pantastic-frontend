import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";

const TOPPINGS = [
  { label: "Nutella", value: "nutella" },
  { label: "Black Chocolate", value: "black" },
  { label: "White Chocolate", value: "white" },
  { label: "Bueno", value: "bueno" },
];

const BOX_IMAGES = {
  2: "/pantastic-deluxe-box-za-dvama.jpeg",
  4: "/pantastic-deluxe-box-za-trima.jpeg",
};

const DeluxeBox = () => {
  const [boxSize, setBoxSize] = useState(2);
  const [toppings, setToppings] = useState([null, null, null, null]);
  const navigate = useNavigate();

  const handleToppingChange = (index, value) => {
    const newToppings = [...toppings];
    newToppings[index] = value;
    setToppings(newToppings);
  };

  const handleSubmit = () => {
    const selectedToppings = toppings.slice(0, boxSize);
    if (selectedToppings.some((t) => !t)) {
      alert("Please select all toppings.");
      return;
    }
    const result = {
      boxSize,
      toppings: selectedToppings,
    };
    console.log(JSON.stringify(result));
    navigate("/food");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
      <div className="bg-white rounded-xl shadow-lg flex w-full max-w-4xl overflow-hidden">
        {/* Left: Image */}
        <div className="w-1/2 flex items-center justify-center bg-gray-50 p-8">
          <img
            src={BOX_IMAGES[boxSize]}
            alt={`Deluxe Box for ${boxSize}`}
            className="max-h-96 max-w-full rounded-lg shadow"
          />
        </div>
        {/* Right: Controls */}
        <div className="w-1/2 p-8 flex flex-col gap-8">
          <div className="flex gap-4 mb-4">
            <Button
              variant={boxSize === 2 ? "default" : "outline"}
              className="flex-1 text-lg py-4 font-bold rounded-xl"
              onClick={() => setBoxSize(2)}
            >
              Box For 2 People
            </Button>
            <Button
              variant={boxSize === 4 ? "default" : "outline"}
              className="flex-1 text-lg py-4 font-bold rounded-xl"
              onClick={() => setBoxSize(4)}
            >
              Box For 4 People
            </Button>
          </div>
          <div className="flex flex-col gap-4">
            {[...Array(boxSize)].map((_, i) => (
              <div key={i}>
                <label className="block mb-1 font-semibold">
                  Sweet Topping {i + 1}
                </label>
                <Combobox
                  options={TOPPINGS}
                  value={toppings[i]}
                  onChange={(val) => handleToppingChange(i, val)}
                  placeholder="Select topping..."
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-8 w-full text-lg py-4 font-bold rounded-xl bg-orange-400 text-white border-0"
            onClick={handleSubmit}
          >
            Confirm Selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeluxeBox;
