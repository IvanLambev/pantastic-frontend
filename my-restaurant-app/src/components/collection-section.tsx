import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_URL } from '@/config/api'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronRight, ArrowRight } from "lucide-react"

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
  restaurant_id?: string
}

interface Collection {
  collection_id: string
  name: string
  description: string
  item_ids: string[]
  item_count: number
  restaurant_id: string
  collection_key: string
}

interface CollectionSectionProps {
  restaurantId?: string
  collectionId?: string
  collectionIndex?: number // Index of collection to display (0-based)
  title?: string
  subtitle?: string
  limit?: number
}

interface Restaurant {
  restaurant_id?: string
  [key: string]: unknown
}

export function CollectionSection({
  restaurantId,
  collectionId,
  collectionIndex = 0,
  title,
  subtitle,
  limit = 8
}: CollectionSectionProps) {
  const navigate = useNavigate()
  const [items, setItems] = useState<MenuItem[]>([])
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)

  const getRestaurantId = (restaurant: Restaurant | unknown): string | null => {
    if (Array.isArray(restaurant)) {
      return typeof restaurant[0] === 'string' ? restaurant[0] : null
    }

    if (restaurant && typeof restaurant === 'object') {
      const id = (restaurant as Restaurant).restaurant_id
      return typeof id === 'string' ? id : null
    }

    return null
  }

  useEffect(() => {
    const fetchCollectionAndItems = async () => {
      setLoading(true)
      try {
        const allCollections: Collection[] = []
        const collectionItemsMap: Record<string, MenuItem[]> = {}

        const restaurantIds: string[] = []

        if (restaurantId) {
          restaurantIds.push(restaurantId)
        } else {
          const restaurantsResponse = await fetchWithAuth(
            `${API_URL}/restaurant/restaurants`
          )

          if (!restaurantsResponse.ok) {
            throw new Error('Failed to fetch restaurants')
          }

          const restaurantsData = await restaurantsResponse.json()
          const parsedRestaurantIds = Array.isArray(restaurantsData)
            ? restaurantsData
                .map((restaurant) => getRestaurantId(restaurant))
                .filter((id): id is string => Boolean(id))
            : []

          restaurantIds.push(...parsedRestaurantIds)
        }

        const restaurantFetches = restaurantIds.map(async (currentRestaurantId) => {
          const [collectionsResponse, itemsResponse] = await Promise.all([
            fetchWithAuth(`${API_URL}/restaurant/collections/${currentRestaurantId}`),
            fetchWithAuth(`${API_URL}/restaurant/${currentRestaurantId}/items`),
          ])

          if (!collectionsResponse.ok || !itemsResponse.ok) {
            return
          }

          const collectionsData = await collectionsResponse.json()
          const allItems = await itemsResponse.json()

          const restaurantCollections = Array.isArray(collectionsData?.collections)
            ? collectionsData.collections
            : []

          for (const currentCollection of restaurantCollections) {
            const collectionKey = `${currentRestaurantId}:${currentCollection.collection_id}`
            const normalizedCollection: Collection = {
              ...currentCollection,
              restaurant_id: currentRestaurantId,
              collection_key: collectionKey,
            }

            const matchingItems = Array.isArray(allItems)
              ? allItems
                  .filter((item: MenuItem) =>
                    currentCollection.item_ids.includes(item.item_id)
                  )
                  .map((item: MenuItem) => ({
                    ...item,
                    restaurant_id: currentRestaurantId,
                  }))
              : []

            allCollections.push(normalizedCollection)
            collectionItemsMap[collectionKey] = matchingItems
          }
        })

        await Promise.all(restaurantFetches)

        let targetCollection: Collection | null = null

        if (collectionId) {
          targetCollection = allCollections.find(
            (c) =>
              c.collection_key === collectionId ||
              c.collection_id === collectionId
          ) || null
        } else if (allCollections.length > collectionIndex) {
          targetCollection = allCollections[collectionIndex]
        } else if (allCollections.length > 0) {
          targetCollection = allCollections[0]
        }

        if (!targetCollection) {
          setLoading(false)
          return
        }

        setCollection(targetCollection)

        const collectionItems =
          collectionItemsMap[targetCollection.collection_key] || []

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

  const handleItemClick = (item: MenuItem) => {
    const resolvedRestaurantId =
      item.restaurant_id || collection?.restaurant_id || restaurantId

    if (!resolvedRestaurantId) {
      return
    }

    // Store the restaurant ID before navigation
    const restaurantData = {
      restaurant_id: resolvedRestaurantId,
      collection_id: collection?.collection_id
    }
    localStorage.setItem('lastViewedRestaurant', JSON.stringify(restaurantData))

    navigate(`/restaurants/${resolvedRestaurantId}/items/${item.item_id}`)
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
  const displaySubtitle = subtitle || collection.description

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">{displayTitle}</h2>
        {displaySubtitle && (
          <p className="text-muted-foreground text-lg">{displaySubtitle}</p>
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

            <CardHeader className="pb-1">
              <CardTitle
                className="text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleItemClick(item)}
              >
                {item.name}
              </CardTitle>
              {item.description && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CardDescription className="line-clamp-2 text-sm cursor-help">
                      {item.description}
                    </CardDescription>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Single centered button to view full menu */}
      <div className="text-center mt-8">
        <Button
          size="lg"
          onClick={() => navigate('/food')}
          className="gap-2"
        >
          {t('home.lookAtOurMenu')}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {collection.item_count > items.length && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/restaurants/${collection.restaurant_id}`)}
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
