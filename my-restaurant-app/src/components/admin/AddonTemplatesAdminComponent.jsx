"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { API_URL } from '@/config/api'
import { fetchWithAdminAuth } from "@/utils/adminAuth"
import { toast } from "sonner"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, MoreVertical, Pencil, Trash2, Save, CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDualCurrencyCompact } from "@/utils/currency"
import { cn } from "@/lib/utils"

// Zod schemas for form validation - Updated to match new API structure
const templateSchema = z.object({
  name: z.string().min(2, { message: "Template name must be at least 2 characters" }),
  description: z.string().optional(),
  is_predefined: z.boolean().default(false),
  addons: z.record(z.string(), z.coerce.number().min(0, { message: "Price must be a positive number" })).refine(
    (addons) => Object.keys(addons).length > 0,
    { message: "Add at least one addon" }
  ),
})

export default function AddonTemplatesAdminComponent({ restaurantId: propRestaurantId }) {
  const params = useParams()
  // Use the prop if provided, otherwise fall back to URL params
  const restaurantId = propRestaurantId || params.restaurantId
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Multi-restaurant support
  const [restaurants, setRestaurants] = useState([])
  const [addToMultipleRestaurants, setAddToMultipleRestaurants] = useState(false)
  const [selectedRestaurantsForCreation, setSelectedRestaurantsForCreation] = useState([])
  const [restaurantSelectionOpen, setRestaurantSelectionOpen] = useState(false)

  // Initialize the form with react-hook-form - Updated for new API structure
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      is_predefined: false,
      addons: { "": 0 },
    },
  })

  // Fetch all addon templates for the restaurant
  const fetchAddonTemplates = useCallback(async () => {
    setLoading(true)
    try {
      // Using the correct endpoint from documentation: GET /restaurant/addon-templates/{restaurantId}
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${restaurantId}`)
      if (!response.ok) throw new Error('Failed to fetch addon templates')
      const data = await response.json()
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching addon templates:', error)
      toast.error('Failed to load addon templates')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    if (restaurantId) {
      fetchAddonTemplates()
    }
  }, [restaurantId, fetchAddonTemplates])

  // Fetch all restaurants for multi-restaurant selection
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetchWithAdminAuth(`${API_URL}/restaurant/restaurants`)
        if (!response.ok) throw new Error('Failed to fetch restaurants')
        const data = await response.json()
        setRestaurants(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching restaurants:', error)
      }
    }
    fetchRestaurants()
  }, [])

  // Open dialog for adding new template - Updated for new API structure
  const handleAddTemplate = () => {
    form.reset({
      name: "",
      description: "",
      is_predefined: false,
      addons: { "": 0 },
    })
    setEditingTemplate(null)
    setOpenDialog(true)
  }

  // Open dialog for editing template - Updated for new API structure
  const handleEditTemplate = (template) => {
    const formData = {
      name: template.name,
      description: template.description || "",
      is_predefined: template.is_predefined || false,
      addons: template.addons || { "": 0 },
    }
    form.reset(formData)
    setEditingTemplate(template)
    setOpenDialog(true)
  }

  // Handle form submission (create or update) - Updated for new API structure
  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: editingTemplate.template_id,
            name: data.name,
            addons: data.addons,
          }),
        })

        if (!response.ok) throw new Error('Failed to update addon template')
        toast.success('Addon template updated successfully')
      } else {
        // Determine which restaurants to create the template for
        const targetRestaurants = addToMultipleRestaurants && selectedRestaurantsForCreation.length > 0
          ? selectedRestaurantsForCreation
          : [restaurantId]

        let successCount = 0
        let failCount = 0

        // Loop through each selected restaurant
        for (const targetRestaurantId of targetRestaurants) {
          try {
            const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                restaurant_id: targetRestaurantId,
                template: {
                  name: data.name,
                  description: data.description,
                  addons: data.addons,
                  is_predefined: data.is_predefined,
                },
              }),
            })

            if (response.ok) {
              successCount++
            } else {
              failCount++
            }
          } catch (error) {
            console.error(`Error creating addon template for restaurant ${targetRestaurantId}:`, error)
            failCount++
          }
        }

        // Show appropriate success/error message
        if (successCount > 0 && failCount === 0) {
          toast.success(`Addon template created successfully for ${successCount} restaurant${successCount > 1 ? 's' : ''}`)
        } else if (successCount > 0 && failCount > 0) {
          toast.warning(`Template created for ${successCount} restaurant${successCount > 1 ? 's' : ''}, but failed for ${failCount}`)
        } else {
          toast.error('Failed to create addon template')
        }
      }

      // Close dialog and refresh data
      setOpenDialog(false)
      setAddToMultipleRestaurants(false)
      setSelectedRestaurantsForCreation([])
      fetchAddonTemplates()
    } catch (error) {
      console.error('Error saving addon template:', error)
      toast.error(error.message || 'Failed to save addon template')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a template
  const handleDeleteTemplate = async (templateId) => {
    setIsSubmitting(true)
    try {
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
        }),
      })

      if (!response.ok) throw new Error('Failed to delete addon template')
      
      toast.success('Addon template deleted successfully')
      setConfirmDelete(null)
      fetchAddonTemplates()
    } catch (error) {
      console.error('Error deleting addon template:', error)
      toast.error(error.message || 'Failed to delete addon template')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a new addon field to the form - Updated for new API structure
  const addAddon = () => {
    const currentAddons = form.getValues("addons") || {}
    const newKey = `addon_${Date.now()}`
    form.setValue("addons", {
      ...currentAddons,
      [newKey]: 0
    })
  }

  // Remove an addon field from the form - Updated for new API structure
  const removeAddon = (addonKey) => {
    const currentAddons = form.getValues("addons") || {}
    if (Object.keys(currentAddons).length <= 1) {
      toast.error("You need at least one addon")
      return
    }
    
    const { [addonKey]: _removed, ...remainingAddons } = currentAddons
    form.setValue("addons", remainingAddons)
  }

  const handleAddonNameChange = (addonKey, newName) => {
    const currentAddons = form.getValues("addons") || {};
    const { [addonKey]: currentPrice, ...otherAddons } = currentAddons;
    form.setValue("addons", {
      ...otherAddons,
      [newName]: currentPrice,
    });
  };

  if (loading) {
    return <div className="p-8">Loading addon templates...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Addon Templates Management</h1>
        <Button onClick={handleAddTemplate}>
          <Plus className="h-4 w-4 mr-2" /> Add Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <p className="text-muted-foreground mb-4">No addon templates found</p>
            <Button onClick={handleAddTemplate}>Create your first template</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {templates.map((template) => (
            <Card key={template.template_id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                  <CardDescription>
                    {Object.keys(template.addons || {}).length} addons available
                    {template.description && (
                      <span className="block text-sm mt-1">{template.description}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center">
                  {template.is_predefined && (
                    <Badge className="mr-2" variant="secondary">Predefined</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setConfirmDelete(template)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(template.addons || {}).map(([addonName, price]) => (
                      <TableRow key={addonName}>
                        <TableCell className="font-medium">{addonName}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">{formatDualCurrencyCompact(price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Template Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Addon Template' : 'Create Addon Template'}</DialogTitle>
            <DialogDescription>
              {editingTemplate 
                ? 'Update the addon template with its available options.' 
                : 'Create a new addon template for your menu items.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Savory Toppings" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this template"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_predefined"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Predefined Template
                      </FormLabel>
                      <FormDescription>
                        Mark this template as predefined if it's a standard set of addons.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Addons</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAddon}>
                    <Plus className="h-4 w-4 mr-2" /> Add Addon
                  </Button>
                </div>

                {Object.entries(form.watch('addons') || {}).map(([addonKey, price], index) => (
                  <div key={addonKey} className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Addon #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAddon(addonKey)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Name</Label>
                        <Input 
                          placeholder="e.g., Extra Cheese" 
                          value={addonKey} 
                          onChange={(e) => handleAddonNameChange(addonKey, e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Price ($)</Label>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00" 
                          value={price}
                          onChange={(e) => {
                            const currentAddons = form.getValues("addons") || {}
                            form.setValue("addons", {
                              ...currentAddons,
                              [addonKey]: parseFloat(e.target.value) || 0
                            })
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multi-restaurant selection - only show for new templates */}
              {!editingTemplate && (
                <div className="space-y-3 border-t pt-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="multi-restaurant"
                      checked={addToMultipleRestaurants}
                      onCheckedChange={setAddToMultipleRestaurants}
                    />
                    <Label htmlFor="multi-restaurant" className="text-sm font-medium cursor-pointer">
                      Add to multiple restaurants
                    </Label>
                  </div>
                  {addToMultipleRestaurants && (
                    <div className="ml-6 space-y-2">
                      <Label className="text-sm text-muted-foreground">Select restaurants:</Label>
                      <Popover open={restaurantSelectionOpen} onOpenChange={setRestaurantSelectionOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between text-sm"
                          >
                            {selectedRestaurantsForCreation.length > 0
                              ? `Selected ${selectedRestaurantsForCreation.length} restaurant${selectedRestaurantsForCreation.length > 1 ? 's' : ''}`
                              : "Select restaurants..."}
                            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search restaurant..." />
                            <CommandList>
                              <CommandEmpty>No restaurants found.</CommandEmpty>
                              <CommandGroup>
                                {restaurants.map((r) => (
                                  <CommandItem
                                    key={r.restaurant_id}
                                    value={r.name}
                                    onSelect={() => {
                                      setSelectedRestaurantsForCreation(prev =>
                                        prev.includes(r.restaurant_id)
                                          ? prev.filter(id => id !== r.restaurant_id)
                                          : [...prev, r.restaurant_id]
                                      );
                                    }}
                                  >
                                    <CheckIcon
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedRestaurantsForCreation.includes(r.restaurant_id)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {r.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedRestaurantsForCreation.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedRestaurantsForCreation.map(restaurantId => {
                            const r = restaurants.find(rest => rest.restaurant_id === restaurantId);
                            return r ? (
                              <Badge key={restaurantId} variant="outline" className="text-xs">
                                {r.name}
                                <button
                                  onClick={() => setSelectedRestaurantsForCreation(prev => 
                                    prev.filter(id => id !== restaurantId)
                                  )}
                                  className="ml-1 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      </div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "{confirmDelete?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteTemplate(confirmDelete?.template_id)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

