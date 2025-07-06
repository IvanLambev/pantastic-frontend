import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DeluxeBox() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col items-center justify-center p-4">
      <Card className="max-w-xl w-full shadow-2xl border-4 border-yellow-400 bg-yellow-100 animate-pulse">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-extrabold text-yellow-900 tracking-wide mb-2">PANTASTIC DELUX BOX</CardTitle>
          <div className="text-lg text-yellow-800 font-semibold mb-4">The Ultimate Pancake Experience</div>
        </CardHeader>
        <CardContent>
          <img
            src="/pancake1.jpg"
            alt="Pantastic Deluxe Box"
            className="w-full h-64 object-cover rounded-xl mb-6 border-2 border-yellow-300"
          />
          <div className="text-md text-gray-800 mb-4">
            <ul className="list-disc pl-6 space-y-2">
              <li>Selection of our best sweet and savory pancakes</li>
              <li>Exclusive sauces and toppings</li>
              <li>Special surprise item only in the Deluxe Box</li>
              <li>Perfect for sharing or indulging solo</li>
            </ul>
          </div>
          <Button className="w-full text-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 border-2 border-yellow-600 shadow-lg mt-4 animate-bounce" size="lg">
            Order Deluxe Box
          </Button>
          <Button variant="outline" className="w-full mt-2" onClick={() => navigate(-1)}>
            Back to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
