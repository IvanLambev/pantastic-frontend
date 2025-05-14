import { RestaurantManager } from "@/components/restaurant-manager.jsx"

export default function RestaurantPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Restaurant Management</h2>
      </div>
      <div className="space-y-4">
        <RestaurantManager />
      </div>
    </div>
  )
}