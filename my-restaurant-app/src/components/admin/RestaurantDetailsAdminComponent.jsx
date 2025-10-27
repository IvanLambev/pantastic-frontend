import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";
import AddonTemplatesAdminComponent from "@/components/admin/AddonTemplatesAdminComponent";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RestaurantDetailsAdminComponent() {
  const { restaurantId: paramRestaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [deliveryPeople, setDeliveryPeople] = useState([]);
  const [addonTemplates, setAddonTemplates] = useState([]);
  const [currentTab, setCurrentTab] = useState("items");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [itemForm, setItemForm] = useState({
    id: "",
    name: "",
    description: "",
    image: "",
    price: "",
    addon_templates: []
  });
  const [deletingItem, setDeletingItem] = useState(null);
  const [showAddDeliveryDialog, setShowAddDeliveryDialog] = useState(false);
  const [newDeliveryPerson, setNewDeliveryPerson] = useState({ name: "", phone: "" });
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [showEditDeliveryDialog, setShowEditDeliveryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [resolvedRestaurantId, setResolvedRestaurantId] = useState(paramRestaurantId || null);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAdminAuth(`${API_URL}/restaurant/restaurants`);
        const data = await res.json();
        console.log('Restaurants data:', data);
        
        // Find by UUID (paramRestaurantId) or use first restaurant if no param
        let found = null;
        let idToUse = null;
        
        if (paramRestaurantId) {
          found = data.find(r => r[0] === paramRestaurantId);
          idToUse = paramRestaurantId;
        } else if (data.length > 0) {
          // If no param provided, use first restaurant
          found = data[0];
          idToUse = data[0][0];
        }
        
        if (!found || !idToUse) {
          setError("Restaurant not found");
          setLoading(false);
          return;
        }
        
        setRestaurant(found);
        setResolvedRestaurantId(idToUse);
        
        // Fetch all data in parallel
        const [itemsRes, deliveryRes, templatesRes] = await Promise.all([
          fetchWithAdminAuth(`${API_URL}/restaurant/${idToUse}/items`),
          fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`),
          fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${idToUse}`)
        ]);
        
        const items = await itemsRes.json();
        const delivery = await deliveryRes.json();
        const templates = templatesRes.ok ? await templatesRes.json() : [];
        
        console.log('Items:', items);
        console.log('Templates:', templates);
        
        setMenuItems(items);
        setDeliveryPeople(delivery);
        setAddonTemplates(templates || []);
        setAvailableTemplates(templates || []);
        
      } catch (error) {
        setError("Failed to load restaurant details");
        console.error('Error loading restaurant details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurant();
  }, [paramRestaurantId]);
  
  // Remove unused functions since all data is fetched in main useEffect
  // const fetchAddonTemplates and fetchAvailableAddonTemplates removed to avoid unused function warnings

  const handleEditItem = (item) => {
    setModalMode("edit");
    // Parse template IDs from item[1] (template_ids field)
    let addonTemplates = [];
    if (item[1] && Array.isArray(item[1])) {
      addonTemplates = item[1];
    }
    setItemForm({
      id: item[0],
      name: item[6],
      description: item[4],
      image: item[5],
      price: item[7],
      addon_templates: addonTemplates
    });
    setShowItemModal(true);
  };
  const handleDeleteItem = (item) => {
    setDeletingItem(item);
  };
  const handleAddItem = () => {
    setModalMode("add");
    setItemForm({ id: "", name: "", description: "", image: "", price: "", addon_templates: [] });
    setShowItemModal(true);
  };

  // Submit add/edit item
  const handleItemFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    let url = `${API_URL}/restaurant/items`;
    let method = modalMode === "add" ? "POST" : "PUT";
    if (modalMode === "add") {
      formData.append("data", JSON.stringify({
        restaurant_id: restaurant[0],
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        addon_templates: itemForm.addon_templates
      }));
      
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append("file", fileInputRef.current.files[0]);
      }
    } else {
      // For edit, use the backend's required structure
      const data = {
        item_id: itemForm.id,
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        addon_templates: itemForm.addon_templates
      };
      formData.append("data", JSON.stringify(data));
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append("file", fileInputRef.current.files[0]);
      }
    }
    try {
      await fetchWithAdminAuth(url, {
        method,
        body: formData,
      });
      // Refresh items after successful save
      refreshData();
      setShowItemModal(false);
    } catch (error) {
      alert("Failed to save item");
      console.error('Error saving item:', error);
    }
  };

  // Confirm delete
  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: deletingItem[0] }),
      });
      setMenuItems(menuItems.filter(i => i[0] !== deletingItem[0]));
      setDeletingItem(null);
    } catch (error) {
      alert("Failed to delete item");
      console.error('Error deleting item:', error);
    }
  };
  
  // Fetch delivery people (global, not just assigned)
  const fetchDeliveryPeople = async () => {
    try {
      const res = await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`);
      const data = await res.json();
      setDeliveryPeople(data);
    } catch (error) {
      console.error('Error fetching delivery people:', error);
      setDeliveryPeople([]);
    }
  };

  // Assign/remove addon template to/from menu item
  // handleAssignAddonToItem function removed to avoid linting warning
  // handleRemoveAddonFromItem function removed to avoid linting warning

  // Add delivery person handler
  const handleAddDeliveryPerson = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeliveryPerson),
      });
      setShowAddDeliveryDialog(false);
      setNewDeliveryPerson({ name: "", phone: "" });
      // Always use fetchDeliveryPeople
      await fetchDeliveryPeople();
    } catch (error) {
      alert("Failed to add delivery person");
      console.error('Error adding delivery person:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit delivery person handler
  const handleEditDeliveryPerson = (person) => {
    setEditingDelivery(person);
    setShowEditDeliveryDialog(true);
  };
  // handleEditDeliveryPersonSubmit function commented out to avoid linting warning
  /*
  const handleEditDeliveryPersonSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_person_id: editingDelivery.delivery_person_id || editingDelivery[0],
          person: {
            name: editingDelivery.name || editingDelivery[2],
            phone: editingDelivery.phone || editingDelivery[3],
          },
        }),
      });
      setShowEditDeliveryDialog(false);
      setEditingDelivery(null);
      await fetchDeliveryPeople();
    } catch {
      alert("Failed to update delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };
  */

  // Delete delivery person
  const handleDeleteDeliveryPerson = async (person) => {
    if (!window.confirm("Are you sure you want to delete this delivery person?")) return;
    setIsSubmitting(true);
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_person_id: person.delivery_person_id || person[0] }),
      });
      await fetchDeliveryPeople();
    } catch {
      alert("Failed to delete delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Assign/unassign delivery person to restaurant
  const handleAssignDelivery = async (person) => {
    setIsSubmitting(true);
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/assign-delivery-person-to-restaurant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant[0],
          delivery_person_id: person.delivery_person_id || person[0],
        }),
      });
      await fetchDeliveryPeople();
    } catch {
      alert("Failed to assign delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleUnassignDelivery = async (person) => {
    setIsSubmitting(true);
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/unassign-delivery-person-from-restaurant`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurant[0],
          delivery_person_id: person.delivery_person_id || person[0],
        }),
      });
      await fetchDeliveryPeople();
    } catch {
      alert("Failed to unassign delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove unused fetchMenuItems function since refreshData handles this now

  // Refresh data after operations
  const refreshData = useCallback(async () => {
    if (!resolvedRestaurantId) return;
    
    try {
      const [itemsRes, templatesRes] = await Promise.all([
        fetchWithAdminAuth(`${API_URL}/restaurant/${resolvedRestaurantId}/items`),
        fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${resolvedRestaurantId}`)
      ]);
      
      const items = await itemsRes.json();
      const templates = templatesRes.ok ? await templatesRes.json() : [];
      
      setMenuItems(items);
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [resolvedRestaurantId]);

  // Apply addon template to menu item
  const applyTemplateToItem = async (itemId, templateId) => {
    if (!resolvedRestaurantId) {
      toast.error('No restaurant ID available');
      return;
    }
    try {
      const response = await fetchWithAdminAuth(
        `${API_URL}/restaurant/${resolvedRestaurantId}/items/${itemId}/apply-template/${templateId}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const result = await response.json();
        toast.success('Addon template applied successfully');
        refreshData(); // Refresh items to show updated templates
        return result;
      } else {
        const error = await response.json();
        if (error.message?.includes('already applied')) {
          toast.info('Template is already applied to this item');
        } else {
          toast.error('Failed to apply template');
        }
      }
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to apply template');
    }
  };

  // Remove addon template from menu item
  const removeTemplateFromItem = async (itemId, templateId) => {
    if (!resolvedRestaurantId) {
      toast.error('No restaurant ID available');
      return;
    }
    try {
      const response = await fetchWithAdminAuth(
        `${API_URL}/restaurant/${resolvedRestaurantId}/items/${itemId}/remove-template/${templateId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        toast.success('Addon template removed successfully');
        refreshData(); // Refresh items
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to remove template');
      }
    } catch (error) {
      console.error('Error removing template:', error);
      toast.error('Failed to remove template');
    }
  };

  // Handle opening template management dialog
  const handleManageTemplates = (item) => {
    setSelectedItem(item);
    setShowTemplateDialog(true);
  };

  // handleApplyTemplate function commented out to avoid linting warning
  /*
  const handleApplyTemplate = async () => {
    if (selectedItem && selectedTemplateId) {
      await applyTemplateToItem(selectedItem[0], selectedTemplateId);
      setSelectedTemplateId("");
      setShowTemplateDialog(false);
    }
  };
  */

  // Get applied template names for an item
  const getAppliedTemplateNames = (item) => {
    const templateIds = item[1]; // template_ids field (index 1)
    if (!templateIds || !Array.isArray(templateIds)) return [];
    
    return templateIds.map(id => {
      const template = availableTemplates.find(t => t.template_id === id);
      return template ? template.name : `Template ${id.split('-')[0]}`;
    });
  };

  // Remove the extra useEffect that was causing duplicate API calls
  // All data is now fetched in the main useEffect above

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!resolvedRestaurantId) return <div className="p-8 text-red-500">No restaurant ID found. Please access this page from a valid restaurant context.</div>;
  if (!restaurant) return <div className="p-8">Restaurant not found</div>;

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="max-w-md mx-4 md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Add Item" : "Edit Item"}</DialogTitle>
            <DialogDescription>
              {modalMode === "add"
                ? "Fill in the details to add a new menu item."
                : "Edit the details of the menu item."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleItemFormSubmit}>
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      setItemForm({ ...itemForm, image: e.target.files[0].name });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                {itemForm.image && (
                  <p className="mt-2 text-sm text-gray-500">{itemForm.image}</p>
                )}
              </div>
              
              {/* Addon Templates Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Addon Templates</label>
                <div className="mt-2 space-y-2">
                  {addonTemplates.map((template) => (
                    <div key={template.template_id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`template-${template.template_id}`}
                        checked={itemForm.addon_templates.includes(template.template_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setItemForm({
                              ...itemForm,
                              addon_templates: [...itemForm.addon_templates, template.template_id]
                            });
                          } else {
                            setItemForm({
                              ...itemForm,
                              addon_templates: itemForm.addon_templates.filter(id => id !== template.template_id)
                            });
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`template-${template.template_id}`} className="ml-2 block text-sm text-gray-900">
                        {template.name}
                      </label>
                    </div>
                  ))}
                  
                  {addonTemplates.length === 0 && (
                    <p className="text-sm text-gray-500">No addon templates available. Create some in the Addon Templates tab.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setShowItemModal(false)}
                variant="outline"
                className="mr-2"
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {modalMode === "add" ? "Add Item" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setDeletingItem(null)}
              variant="outline"
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteItem}
              isLoading={isSubmitting}
              variant="destructive"
            >
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restaurant Details */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{restaurant[1]}</CardTitle>
          <CardDescription>{restaurant[2]}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold">Menu Items</h3>
              <p className="text-sm text-gray-500">{menuItems.length} items</p>
            </div>
            <Button onClick={handleAddItem} className="mt-4 md:mt-0">
              Add Menu Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Menu Items and Delivery People */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="delivery">Delivery People</TabsTrigger>
          <TabsTrigger value="addons">Addon Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          {/* Menu Items - Responsive Layout */}
          {/* Mobile Card Layout (hidden on md and up) */}
          <div className="md:hidden space-y-4">
            {menuItems.map((item) => (
              <Card key={item[0]} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item[6]}</h3>
                      <p className="text-sm text-gray-500 mt-1">{item[4]}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-2">${item[7]}</p>
                    </div>
                  </div>
                  
                  {/* Templates Section */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Templates</label>
                    <div className="mt-2">
                      {item[1] && Array.isArray(item[1]) && item[1].length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {getAppliedTemplateNames(item).map((templateName, idx) => {
                            const templateId = item[1][idx];
                            return (
                              <Badge key={templateId} variant="outline" className="text-xs">
                                {templateName}
                                <button 
                                  onClick={() => removeTemplateFromItem(item[0], templateId)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                  title="Remove template"
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageTemplates(item)}
                            className="h-6 px-2 text-xs"
                          >
                            + Add Template
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageTemplates(item)}
                          className="h-6 px-2 text-xs"
                        >
                          + Add Template
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleEditItem(item)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteItem(item)}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Desktop Table Layout (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Templates
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <tr key={item[0]}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item[6]}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">{item[4]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${item[7]}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {item[1] && Array.isArray(item[1]) && item[1].length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {getAppliedTemplateNames(item).map((templateName, idx) => {
                              const templateId = item[1][idx];
                              return (
                                <Badge key={templateId} variant="outline" className="text-xs">
                                  {templateName}
                                  <button 
                                    onClick={() => removeTemplateFromItem(item[0], templateId)}
                                    className="ml-1 text-red-500 hover:text-red-700"
                                    title="Remove template"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              );
                            })}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManageTemplates(item)}
                              className="h-6 px-2 text-xs"
                            >
                              + Add Template
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManageTemplates(item)}
                            className="h-6 px-2 text-xs"
                          >
                            + Add Template
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => handleEditItem(item)}
                          variant="outline"
                          size="sm"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden lg:inline ml-1">Edit</span>
                        </Button>
                        <Button
                          onClick={() => handleDeleteItem(item)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden lg:inline ml-1">Delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="delivery">
          {/* Delivery People Manager */}
          <DeliveryPeopleManager
            deliveryPeople={deliveryPeople}
            onAddDeliveryPerson={handleAddDeliveryPerson}
            onEditDeliveryPerson={handleEditDeliveryPerson}
            onDeleteDeliveryPerson={handleDeleteDeliveryPerson}
            onAssignDelivery={handleAssignDelivery}
            onUnassignDelivery={handleUnassignDelivery}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
        <TabsContent value="addons">
          {/* Addon Templates */}
          <AddonTemplatesAdminComponent restaurantId={resolvedRestaurantId} />
        </TabsContent>
      </Tabs>

      {/* Manage Templates Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Addon Templates</DialogTitle>
            <DialogDescription>
              {selectedItem && (
                <div>
                  <span className="font-semibold">{selectedItem[6]}</span> - Manage addon templates
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700">Available Templates</h3>
            <div className="mt-2 space-y-2">
              {availableTemplates.map((template) => (
                <div key={template.template_id} className="flex items-center">
                  <Badge variant="outline" className="mr-2">
                    {template.name}
                  </Badge>
                  <Button
                    onClick={() => applyTemplateToItem(selectedItem[0], template.template_id)}
                    variant="outline"
                    size="sm"
                    className="mr-2"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={() => removeTemplateFromItem(selectedItem[0], template.template_id)}
                    variant="destructive"
                    size="sm"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowTemplateDialog(false)}
              variant="outline"
              className="mr-2"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

