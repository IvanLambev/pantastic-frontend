"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { API_URL } from '@/config/api'
import { fetchWithAuth } from "@/context/AuthContext"
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
import { Plus, MoreVertical, Pencil, Trash2, Save } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

// Zod schemas for form validation
const addonSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  description: z.string().optional(),
})

const templateSchema = z.object({
  name: z.string().min(2, { message: "Template name must be at least 2 characters" }),
  is_predefined: z.boolean().default(false),
  addons: z.array(addonSchema).min(1, { message: "Add at least one addon" }),
})

export default function AddonTemplatesAdminComponent() {
  const { restaurantId } = useParams()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize the form with react-hook-form
  const form = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      is_predefined: false,
      addons: [{ name: "", price: 0, description: "" }],
    },
  })

  // Fetch all addon templates for the restaurant
  const fetchAddonTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetchWithAuth(`${API_URL}/restaurant/addon-templates/${restaurantId}`)
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

  // Open dialog for adding new template
  const handleAddTemplate = () => {
    form.reset({
      name: "",
      is_predefined: false,
      addons: [{ name: "", price: 0, description: "" }],
    })
    setEditingTemplate(null)
    setOpenDialog(true)
  }

  // Open dialog for editing template
  const handleEditTemplate = (template) => {
    // Normalize template data to match form schema
    const formData = {
      name: template.name,
      is_predefined: template.is_predefined || false,
      addons: template.addons || [],
    }
    form.reset(formData)
    setEditingTemplate(template)
    setOpenDialog(true)
  }

  // Handle form submission (create or update)
  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await fetchWithAuth(`${API_URL}/restaurant/addon-templates`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: editingTemplate.template_id,
            name: data.name,
            addons: data.addons,
            is_predefined: data.is_predefined,
          }),
        })

        if (!response.ok) throw new Error('Failed to update addon template')
        toast.success('Addon template updated successfully')
      } else {
        // Create new template
        const response = await fetchWithAuth(`${API_URL}/restaurant/addon-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurant_id: restaurantId,
            template: {
              name: data.name,
              addons: data.addons,
              is_predefined: data.is_predefined,
            },
          }),
        })

        if (!response.ok) throw new Error('Failed to create addon template')
        toast.success('Addon template created successfully')
      }

      // Close dialog and refresh data
      setOpenDialog(false)
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
      const response = await fetchWithAuth(`${API_URL}/restaurant/addon-templates`, {
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

  // Add a new addon field to the form
  const addAddon = () => {
    const currentAddons = form.getValues("addons") || []
    form.setValue("addons", [
      ...currentAddons,
      { name: "", price: 0, description: "" }
    ])
  }

  // Remove an addon field from the form
  const removeAddon = (index) => {
    const currentAddons = form.getValues("addons") || []
    if (currentAddons.length <= 1) {
      toast.error("You need at least one addon")
      return
    }
    
    const updatedAddons = currentAddons.filter((_, i) => i !== index)
    form.setValue("addons", updatedAddons)
  }

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
                    {template.addons?.length || 0} addons available
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
                    {template.addons?.map((addon, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{addon.name}</TableCell>
                        <TableCell>{addon.description || '-'}</TableCell>
                        <TableCell className="text-right">${Number(addon.price).toFixed(2)}</TableCell>
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

                {form.watch('addons')?.map((_, index) => (
                  <div key={index} className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Addon #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAddon(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`addons.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Extra Cheese" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`addons.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="0.00" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`addons.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe this addon"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

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
