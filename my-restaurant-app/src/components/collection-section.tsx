import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from '@/config/api'
// @ts-ignore - useCart is exported from use-cart.js
import { useCart } from "@/hooks/use-cart"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, ChevronRight, ArrowRight } from "lucide-react"

// @ts-ignore - fetchWithAuth is exported from AuthContext.jsx
import { fetchWithAuth } from "@/context/AuthContext"
import { t } from "@/utils/translations"

interface MenuItem {
  item_id: string
  name: string
  price: number
  image_url: string
  description: string
  item_type: string
}

interface Collection {
  collection_id: string
  name: string
  description: string
  item_ids: string[]
  item_count: number
}

interface CollectionSectionProps {
  restaurantId: string
  collectionId?: string
  collectionIndex?: number // Index of collection to display (0-based)
  title?: string
  limit?: number
}

export function CollectionSection({
  restaurantId,
  collectionId,
  collectionIndex = 0,
  title,
  limit = 8
}: CollectionSectionProps) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [items, setItems] = useState<MenuItem[]>([])
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCollectionAndItems = async () => {
      setLoading(true)
      try {
        // Fetch collection data
        const collectionsResponse = await fetchWithAuth(
          `${API_URL}/restaurant/collections/${restaurantId}`
        )

        if (!collectionsResponse.ok) {
          throw new Error('Failed to fetch collections')
        }

        const collectionsData = await collectionsResponse.json()

        // Find the specific collection by ID, index, or use the first one
        let targetCollection: Collection | null = null

        if (collectionId) {
          // Find by specific collection ID
          targetCollection = collectionsData.collections.find(
            (c: Collection) => c.collection_id === collectionId
          )
        } else if (collectionsData.collections.length > collectionIndex) {
          // Use the collection at the specified index
          targetCollection = collectionsData.collections[collectionIndex]
        } else if (collectionsData.collections.length > 0) {
          // Fallback to first collection
          targetCollection = collectionsData.collections[0]
        }

        if (!targetCollection) {
          setLoading(false)
          return
        }

        setCollection(targetCollection)

        // Fetch all items from the restaurant
        const itemsResponse = await fetchWithAuth(
          `${API_URL}/restaurant/${restaurantId}/items`
        )

        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch items')
        }

        const allItems = await itemsResponse.json()

        // Filter items that belong to this collection
        const collectionItems = allItems.filter((item: MenuItem) =>
          targetCollection!.item_ids.includes(item.item_id)
        )

        // Apply limit if specified
        const itemsToShow = limit ? collectionItems.slice(0, limit) : collectionItems
        setItems(itemsToShow)

      } catch (err) {
        console.error('Error fetching collection:', err)
        toast.error('Не успяхме да заредим колекцията')
      } finally {
        setLoading(false)
      }
    }

    fetchCollectionAndItems()
  }, [restaurantId, collectionId, collectionIndex, limit])

  const handleAddToCart = (item: MenuItem) => {
    // Store the restaurant ID in localStorage when adding to cart
    const restaurantData = {
      restaurant_id: restaurantId,
      collection_id: collection?.collection_id
    }
    localStorage.setItem('lastViewedRestaurant', JSON.stringify(restaurantData))

    addToCart({
      id: String(item.item_id),
      name: item.name,
      price: Number(item.price) || 0,
      image: item.image_url,
      description: item.description,
      quantity: 1
    })
    toast.success(`Добавено: ${item.name}`)
  }

  const handleItemClick = (item: MenuItem) => {
    // Store the restaurant ID before navigation
    const restaurantData = {
      restaurant_id: restaurantId,
      collection_id: collection?.collection_id
    }
    localStorage.setItem('lastViewedRestaurant', JSON.stringify(restaurantData))

    navigate(`/restaurants/${restaurantId}/items/${item.item_id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="h-8 bg-muted rounded w-64 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="aspect-square bg-muted" />
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0 || !collection) {
    return null
  }

  const displayTitle = title || collection.name

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">{displayTitle}</h2>
        {collection.description && (
          <p className="text-muted-foreground text-lg">{collection.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {items.map((item) => (
          <Card
            key={item.item_id}
            className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
          >
            <div
              className="relative aspect-square overflow-hidden bg-muted"
              onClick={() => handleItemClick(item)}
            >
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            <CardHeader className="pb-3">
              <CardTitle
                className="text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleItemClick(item)}
              >
                {item.name}
              </CardTitle>
              {item.description && (
                <CardDescription className="line-clamp-2 text-sm">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-4 pt-0 mt-auto">
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary">
                  {item.price.toFixed(2)} лв
                </span>
              </div>
              <Button
                size="default"
                onClick={() => navigate('/food')}
                variant="outline"
                className="w-full gap-2"
              >
                {t('home.lookAtOurMenu')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {collection.item_count > items.length && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/restaurants/${restaurantId}`)}
            className="gap-2"
          >
            Виж всички от {collection.name}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
