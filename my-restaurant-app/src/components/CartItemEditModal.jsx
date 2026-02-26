import { useState, useEffect, useMemo, useCallback } from "react"
import { API_URL } from '@/config/api'
import { fetchWithAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { Plus, Minus, Loader2 } from "lucide-react"
import { useCart } from "@/hooks/use-cart"

const isProbablyMojibake = (value) => typeof value === 'string' && (value.includes('Ð') || value.includes('Ñ'))

const decodeMojibake = (value) => {
  if (!isProbablyMojibake(value)) return value
  try {
    return decodeURIComponent(
      Array.from(value)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
  } catch {
    return value
  }
}

const normalizeTemplateOptions = (options) => {
  if (!Array.isArray(options)) return []
  return options
    .map((option) => {
      if (option && typeof option === 'object' && !Array.isArray(option)) {
        const name = decodeMojibake(String(option.name || '')).trim()
        if (!name) return null
        return {
          name,
          price: Number(option.price) || 0,
        }
      }

      const name = decodeMojibake(String(option)).trim()
      if (!name) return null
      return {
        name,
        price: 0,
      }
    })
    .filter(Boolean)
}

const getTemplateOptionPrice = (options, selectedName) => {
  if (!selectedName || !Array.isArray(options)) return 0
  const matchedOption = options.find((option) => option?.name === selectedName)
  return Number(matchedOption?.price) || 0
}

const toBoolean = (value) => value === true || value === 'true' || value === 1

export default function CartItemEditModal({ isOpen, onClose, cartItem, restaurantId }) {
  const { updateCartItem } = useCart()
  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState(null)
  const [addonTemplates, setAddonTemplates] = useState([])
  const [removableData, setRemovableData] = useState(null)
  const [doughOptions, setDoughOptions] = useState([])
  const [chocolateOptions, setChocolateOptions] = useState([])
  const [selectedAddons, setSelectedAddons] = useState({})
  const [selectedRemovables, setSelectedRemovables] = useState({})
  const [selectedDoughType, setSelectedDoughType] = useState("")
  const [selectedChocolateType, setSelectedChocolateType] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [totalPrice, setTotalPrice] = useState(0)
  const [addonVisibleCounts, setAddonVisibleCounts] = useState({})

  const resolvedRestaurantId = useMemo(() => {
    if (restaurantId) return restaurantId
    if (cartItem?.restaurant_id) return cartItem.restaurant_id
    try {
      const stored = JSON.parse(localStorage.getItem('selectedRestaurant') || '[]')
      return Array.isArray(stored) ? stored[0] : stored?.restaurant_id || stored?.id
    } catch {
      return null
    }
  }, [restaurantId, cartItem])

  const resolvedItemId = useMemo(() => {
    if (!cartItem) return null
    if (cartItem.originalItemId) return cartItem.originalItemId
    if (cartItem.item_id) return cartItem.item_id
    if (typeof cartItem.id === 'string') {
      const match = cartItem.id.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/)
      return match ? match[0] : cartItem.id
    }
    return cartItem.id
  }, [cartItem])

  useEffect(() => {
    const fetchItemAndOptions = async () => {
      if (!isOpen || !cartItem || !resolvedRestaurantId || !resolvedItemId) return
      setLoading(true)
      try {
        const itemRes = await fetchWithAuth(`${API_URL}/restaurant/${resolvedRestaurantId}/items/${resolvedItemId}`)
        if (!itemRes.ok) throw new Error('Failed to fetch item details')
        let itemData = await itemRes.json()
        if (Array.isArray(itemData)) {
          itemData = {
            item_id: itemData[0],
            template_ids: Array.isArray(itemData[1]) ? itemData[1] : [],
            addons: itemData[2] ? (typeof itemData[2] === 'string' ? JSON.parse(itemData[2]) : itemData[2]) : {},
            created_at: itemData[3],
            description: itemData[4],
            image_url: itemData[5],
            category: itemData[6],
            name: itemData[7],
            price: Number(itemData[8]) || 0,
            restaurant_id: itemData[11]
          }
        }
        const normalizedItemData = {
          ...itemData,
          has_dough_options: toBoolean(itemData?.has_dough_options),
          has_chocolate_options: toBoolean(itemData?.has_chocolate_options),
        }

        setItem(normalizedItemData)
        setQuantity(cartItem.quantity || 1)

        const fetchTemplateChoices = async (templateType) => {
          try {
            const response = await fetchWithAuth(`${API_URL}/restaurant/${templateType}/${resolvedRestaurantId}/${resolvedItemId}`)
            if (!response.ok) return []
            const payload = await response.json()
            if (templateType === 'dough-templates') {
              return normalizeTemplateOptions(payload?.doughs)
            }
            return normalizeTemplateOptions(payload?.chocolate_types)
          } catch (templateError) {
            console.error(`Error loading ${templateType}:`, templateError)
            return []
          }
        }

        const fetchedDoughOptions = normalizedItemData.has_dough_options
          ? await fetchTemplateChoices('dough-templates')
          : []
        const fetchedChocolateOptions = normalizedItemData.has_chocolate_options
          ? await fetchTemplateChoices('chocolate-type-templates')
          : []

        setDoughOptions(fetchedDoughOptions)
        setChocolateOptions(fetchedChocolateOptions)
        setSelectedDoughType(fetchedDoughOptions[0]?.name || "")
        setSelectedChocolateType(fetchedChocolateOptions[0]?.name || "")

        const addonsRes = await fetchWithAuth(`${API_URL}/restaurant/${resolvedRestaurantId}/items/${resolvedItemId}/addons`)
        const templates = addonsRes.ok ? await addonsRes.json() : []
        setAddonTemplates(Array.isArray(templates) ? templates : [])

        const removablesRes = await fetchWithAuth(`${API_URL}/restaurant/removables/item/${resolvedItemId}`)
        let removables = removablesRes.ok ? await removablesRes.json() : null
        if (Array.isArray(removables)) {
          removables = { applied_templates: removables }
        }
        setRemovableData(removables)

        const initialSelectedAddons = {}
        templates.forEach(template => {
          if (template.addons && Object.keys(template.addons).length > 0) {
            initialSelectedAddons[template.template_id] = []
          }
        })

        const initialSelectedRemovables = {}
        if (removables?.applied_templates) {
          removables.applied_templates.forEach(template => {
            initialSelectedRemovables[template.template_id] = []
          })
        }

        const restoredAddons = { ...initialSelectedAddons }
        if (cartItem.selectedAddons) {
          templates.forEach(template => {
            if (template.addons) {
              const matchingAddons = cartItem.selectedAddons.filter(cartAddon =>
                Object.keys(template.addons).includes(cartAddon.name)
              )
              if (matchingAddons.length > 0) {
                restoredAddons[template.template_id] = matchingAddons
              }
            }
          })
        }
        setSelectedAddons(restoredAddons)

        const restoredRemovables = { ...initialSelectedRemovables }
        if (cartItem.selectedRemovables && removables?.applied_templates) {
          removables.applied_templates.forEach(template => {
            let matchingRemovables = []
            if (Array.isArray(template.removables)) {
              matchingRemovables = template.removables.filter(r => cartItem.selectedRemovables.includes(r))
            } else {
              matchingRemovables = Object.keys(template.removables || {}).filter(r => cartItem.selectedRemovables.includes(r))
            }
            if (matchingRemovables.length > 0) {
              restoredRemovables[template.template_id] = matchingRemovables
            }
          })
        }
        setSelectedRemovables(restoredRemovables)

        const restoredDoughType = fetchedDoughOptions.some((option) => option.name === cartItem.selectedDoughType)
          ? cartItem.selectedDoughType
          : (fetchedDoughOptions[0]?.name || "")
        const restoredChocolateType = fetchedChocolateOptions.some((option) => option.name === cartItem.selectedChocolateType)
          ? cartItem.selectedChocolateType
          : (fetchedChocolateOptions[0]?.name || "")

        setSelectedDoughType(restoredDoughType)
        setSelectedChocolateType(restoredChocolateType)

        let newTotal = Number(itemData.price)
        Object.values(restoredAddons).forEach(addonArray => {
          addonArray.forEach(addon => {
            newTotal += Number(addon.price)
          })
        })
        newTotal += getTemplateOptionPrice(fetchedDoughOptions, restoredDoughType)
        newTotal += getTemplateOptionPrice(fetchedChocolateOptions, restoredChocolateType)
        setTotalPrice(newTotal)
      } catch (error) {
        console.error('Error fetching item options:', error)
        toast.error('Неуспешно зареждане на опциите за артикула')
      } finally {
        setLoading(false)
      }
    }

    fetchItemAndOptions()
  }, [isOpen, cartItem, resolvedRestaurantId, resolvedItemId])

  useEffect(() => {
    if (!isOpen) {
      setAddonVisibleCounts({})
      return
    }
    const initialCounts = {}
    addonTemplates.forEach(template => {
      initialCounts[template.template_id] = 4
    })
    setAddonVisibleCounts(initialCounts)
  }, [addonTemplates, isOpen])

  const updateTotalPrice = useCallback((selectedAddonObj) => {
    if (!item) return
    let newTotal = Number(item.price)
    Object.values(selectedAddonObj).forEach(addonArray => {
      addonArray.forEach(addon => {
        newTotal += Number(addon.price)
      })
    })
    newTotal += getTemplateOptionPrice(doughOptions, selectedDoughType)
    newTotal += getTemplateOptionPrice(chocolateOptions, selectedChocolateType)
    setTotalPrice(newTotal)
  }, [item, doughOptions, chocolateOptions, selectedDoughType, selectedChocolateType])

  useEffect(() => {
    updateTotalPrice(selectedAddons)
  }, [selectedDoughType, selectedChocolateType, doughOptions, chocolateOptions, selectedAddons, updateTotalPrice])

  const handleAddonChange = (templateId, addon, isChecked) => {
    setSelectedAddons(prev => {
      const updatedAddons = { ...prev }
      if (isChecked) {
        if (!updatedAddons[templateId]) {
          updatedAddons[templateId] = []
        }
        updatedAddons[templateId].push(addon)
      } else if (updatedAddons[templateId]) {
        updatedAddons[templateId] = updatedAddons[templateId].filter(item => item.name !== addon.name)
      }
      updateTotalPrice(updatedAddons)
      return updatedAddons
    })
  }

  const handleRemovableChange = (templateId, removableKey, isChecked) => {
    setSelectedRemovables(prev => {
      const updatedRemovables = { ...prev }
      if (isChecked) {
        if (!updatedRemovables[templateId]) {
          updatedRemovables[templateId] = []
        }
        updatedRemovables[templateId].push(removableKey)
      } else if (updatedRemovables[templateId]) {
        updatedRemovables[templateId] = updatedRemovables[templateId].filter(item => item !== removableKey)
      }
      return updatedRemovables
    })
  }

  const isAddonSelected = (templateId, addonName) => {
    return selectedAddons[templateId]?.some(addon => addon.name === addonName) || false
  }

  const isRemovableSelected = (templateId, removableKey) => {
    return selectedRemovables[templateId]?.includes(removableKey) || false
  }

  const getAllSelectedAddons = () => Object.values(selectedAddons).flat()
  const getAllSelectedRemovables = () => Object.values(selectedRemovables).flat()

  const handleSave = () => {
    if (!item || !cartItem) return

    const selectedAddonList = getAllSelectedAddons()
    const selectedRemovableList = getAllSelectedRemovables()
    const selectedDough = item?.has_dough_options ? (selectedDoughType || doughOptions[0]?.name || "") : ""
    const selectedChocolate = item?.has_chocolate_options ? (selectedChocolateType || chocolateOptions[0]?.name || "") : ""

    const addonIds = selectedAddonList.map(addon => addon.name).sort().join(',')
    const removableIds = selectedRemovableList.sort().join(',')
    const doughId = selectedDough ? `Тесто:${selectedDough}` : ''
    const chocolateId = selectedChocolate ? `Шоколад:${selectedChocolate}` : ''
    const customizations = [addonIds, removableIds, doughId, chocolateId].filter(Boolean).join('|')

    const configurationId = !customizations
      ? String(item.item_id)
      : `${item.item_id}-${customizations}`

    const updatedItem = {
      ...cartItem,
      id: configurationId,
      originalItemId: item.item_id,
      name: item.name,
      price: totalPrice,
      basePrice: Number(item.price),
      image: item.image_url,
      description: item.description,
      selectedAddons: selectedAddonList,
      selectedRemovables: selectedRemovableList,
      selectedDoughType: selectedDough,
      selectedChocolateType: selectedChocolate,
      selectedDoughPrice: getTemplateOptionPrice(doughOptions, selectedDough),
      selectedChocolatePrice: getTemplateOptionPrice(chocolateOptions, selectedChocolate),
      addonCount: selectedAddonList.length,
      removableCount: selectedRemovableList.length,
      quantity,
      restaurant_id: item.restaurant_id || resolvedRestaurantId,
    }

    updateCartItem(cartItem.id, updatedItem)
    toast.success('Артикулът беше обновен')
    onClose()
  }

  const handleScroll = (e) => {
    e.stopPropagation()
  }

  const showDoughOptions = item?.has_dough_options && doughOptions.length > 0
  const showChocolateOptions = item?.has_chocolate_options && chocolateOptions.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{item?.name || cartItem?.name}</DialogTitle>
          <DialogDescription>
            Променете добавките, премахванията и количеството на този артикул.
          </DialogDescription>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto pr-1" 
          onWheel={handleScroll}
          style={{ overscrollBehavior: 'contain' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
            {item?.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Базова цена</p>
                <p className="font-semibold">{formatDualCurrencyCompact(item?.price || cartItem?.basePrice || cartItem?.price)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Обща цена</p>
                <p className="font-semibold text-primary">{formatDualCurrencyCompact(totalPrice * quantity)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Количество</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {addonTemplates.length > 0 ? (
              <div className="space-y-4">
                {addonTemplates.map((template) => (
                  <Card key={template.template_id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Добавки</CardTitle>
                        <Badge variant="outline">{Object.keys(template.addons || {}).length} опции</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {(() => {
                        const addonEntries = Object.entries(template.addons || {})
                        const selectedNames = new Set(
                          (selectedAddons[template.template_id] || []).map(addon => addon.name)
                        )
                        const selectedEntries = addonEntries.filter(([addonName]) => selectedNames.has(addonName))
                        const unselectedEntries = addonEntries.filter(([addonName]) => !selectedNames.has(addonName))
                        const orderedEntries = [...selectedEntries, ...unselectedEntries]
                        const baseVisibleCount = addonVisibleCounts[template.template_id] || 4
                        const visibleCount = Math.max(baseVisibleCount, selectedEntries.length)
                        const visibleEntries = orderedEntries.slice(0, visibleCount)
                        const remainingCount = orderedEntries.length - visibleEntries.length

                        return (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {visibleEntries.map(([addonName, price]) => (
                                <div
                                  key={`${template.template_id}-${addonName}`}
                                  className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${isAddonSelected(template.template_id, addonName)
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-background hover:bg-muted/50'
                                    }`}
                                  onClick={() => handleAddonChange(template.template_id, { name: addonName, price }, !isAddonSelected(template.template_id, addonName))}
                                >
                                  <div className="flex items-center flex-1">
                                    <Checkbox
                                      checked={isAddonSelected(template.template_id, addonName)}
                                      onCheckedChange={(checked) => handleAddonChange(template.template_id, { name: addonName, price }, checked)}
                                      className="mr-3"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="font-medium">{addonName}</span>
                                  </div>
                                  <span className="text-sm font-semibold ml-2">+{formatDualCurrencyCompact(price)}</span>
                                </div>
                              ))}
                            </div>
                            {remainingCount > 0 && (
                              <div className="pt-2 flex justify-center">
                                <button
                                  className="text-xs text-primary hover:underline font-medium"
                                  onClick={() =>
                                    setAddonVisibleCounts(prev => ({
                                      ...prev,
                                      [template.template_id]: (prev[template.template_id] || 4) + 10
                                    }))
                                  }
                                >
                                  Покажи още ({remainingCount})
                                </button>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Няма налични добавки за този артикул.</p>
            )}

            {removableData?.applied_templates?.length > 0 ? (
              <div className="space-y-4">
                {removableData.applied_templates.map((template) => (
                  <Card key={template.template_id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Опции "Без"</CardTitle>
                        <Badge variant="outline">
                          {Array.isArray(template.removables)
                            ? template.removables.length
                            : Object.keys(template.removables || {}).length
                          } опции
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.isArray(template.removables) ? (
                          template.removables.map((removableItem, index) => (
                            <div
                              key={`${template.template_id}-${index}`}
                              className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${isRemovableSelected(template.template_id, removableItem)
                                ? 'border-red-500 bg-red-50'
                                : 'border-border bg-background hover:bg-muted/50'
                                }`}
                              onClick={() => handleRemovableChange(template.template_id, removableItem, !isRemovableSelected(template.template_id, removableItem))}
                            >
                              <div className="flex items-center flex-1">
                                <Checkbox
                                  checked={isRemovableSelected(template.template_id, removableItem)}
                                  onCheckedChange={(checked) => handleRemovableChange(template.template_id, removableItem, checked)}
                                  className="mr-3"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium">{removableItem}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">Премахни</span>
                            </div>
                          ))
                        ) : (
                          Object.entries(template.removables || {}).map(([removableKey, removableValue]) => (
                            <div
                              key={`${template.template_id}-${removableKey}`}
                              className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${isRemovableSelected(template.template_id, removableKey)
                                ? 'border-red-500 bg-red-50'
                                : 'border-border bg-background hover:bg-muted/50'
                                }`}
                              onClick={() => handleRemovableChange(template.template_id, removableKey, !isRemovableSelected(template.template_id, removableKey))}
                            >
                              <div className="flex items-center flex-1">
                                <Checkbox
                                  checked={isRemovableSelected(template.template_id, removableKey)}
                                  onCheckedChange={(checked) => handleRemovableChange(template.template_id, removableKey, checked)}
                                  className="mr-3"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-medium capitalize">{removableValue}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">Премахни</span>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Няма налични опции за премахване.</p>
            )}

            {(showDoughOptions || showChocolateOptions) && (
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Избор на вид</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {showDoughOptions && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Тесто</h3>
                      <RadioGroup value={selectedDoughType} onValueChange={setSelectedDoughType}>
                        {doughOptions.map((doughOption) => (
                          <div key={doughOption.name} className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={doughOption.name} id={`edit-dough-${doughOption.name}`} />
                              <Label htmlFor={`edit-dough-${doughOption.name}`} className="cursor-pointer">{doughOption.name}</Label>
                            </div>
                            {Number(doughOption.price) > 0 && (
                              <span className="text-sm font-semibold text-primary">+{formatDualCurrencyCompact(doughOption.price)}</span>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}

                  {showChocolateOptions && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">Шоколад</h3>
                      <RadioGroup value={selectedChocolateType} onValueChange={setSelectedChocolateType}>
                        {chocolateOptions.map((chocolateOption) => (
                          <div key={chocolateOption.name} className="flex items-center justify-between space-x-2 rounded-lg border p-3">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={chocolateOption.name} id={`edit-choco-${chocolateOption.name}`} />
                              <Label htmlFor={`edit-choco-${chocolateOption.name}`} className="cursor-pointer">{chocolateOption.name}</Label>
                            </div>
                            {Number(chocolateOption.price) > 0 && (
                              <span className="text-sm font-semibold text-primary">+{formatDualCurrencyCompact(chocolateOption.price)}</span>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Отказ</Button>
          <Button onClick={handleSave} disabled={loading || !item}>Запази</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
