import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";
import AddonTemplatesAdminComponent from "@/components/admin/AddonTemplatesAdminComponent";
import { fetchWithAuth } from "@/context/AuthContext";
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

export default function RestaurantDetailsAdminComponent() {
  const { restaurantId } = useParams();
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
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/restaurant/restaurants`);
        const data = await res.json();
        // Find by UUID (restaurantId)
        const found = data.find(r => r[0] === restaurantId);
        setRestaurant(found);
        if (found) {
          const itemsRes = await fetch(`${API_URL}/restaurant/${found[0]}/items`);
          setMenuItems(await itemsRes.json());
          // Fetch addon templates
          await fetchAddonTemplates(found[0]);
          // Only use fetchDeliveryPeople (with fetchWithAuth) for delivery people
          await fetchDeliveryPeople();
        }
      } catch (err) {
        setError("Failed to load restaurant details");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);
  
  // Fetch addon templates for the restaurant
  const fetchAddonTemplates = async (restaurantId) => {
    try {
      const response = await fetchWithAuth(`${API_URL}/restaurant/addon-templates/${restaurantId}`);
      if (response.ok) {
        const templates = await response.json();
        setAddonTemplates(templates || []);
      }
    } catch (error) {
      console.error('Error fetching addon templates:', error);
    }
  };

  const handleEditItem = (item) => {
    setModalMode("edit");
    setItemForm({
      id: item[0],
      name: item[4],
      description: item[2],
      image: item[3],
      price: item[5],
      addon_templates: item[7] || [] // Assuming the 8th element contains addon templates
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
    let url = `${API_URL}/restaurant/${restaurant[0]}/items`;
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
      await fetchWithAuth(url, {
        method,
        body: formData,
      });
      // Refresh items
      const itemsRes = await fetchWithAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      setShowItemModal(false);
    } catch (err) {
      alert("Failed to save item");
    }
  };

  // Confirm delete
  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await fetchWithAuth(`${API_URL}/restaurant/${restaurant[0]}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: deletingItem[0] }),
      });
      setMenuItems(menuItems.filter(i => i[0] !== deletingItem[0]));
      setDeletingItem(null);
    } catch (err) {
      alert("Failed to delete item");
    }
  };
  
  // Fetch delivery people (global, not just assigned)
  const fetchDeliveryPeople = async () => {
    try {
      await fetchWithAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "GET"
      });
      const res = await fetchWithAuth(`${API_URL}/restaurant/delivery-people`);
      setDeliveryPeople(await res.json());
    } catch (error) {
      console.error('Error fetching delivery people:', error);
      setDeliveryPeople([]);
    }
  };

  // Assign/remove addon template to/from menu item
  const handleAssignAddonToItem = async (itemId, templateId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/restaurant/${restaurant[0]}/items/${itemId}/addons/${templateId}`, 
        { method: 'POST' }
      );
      if (response.ok) {
        toast.success('Addon template added to item successfully');
        // Refresh items
        const itemsRes = await fetchWithAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
        setMenuItems(await itemsRes.json());
      } else {
        toast.error('Failed to add addon template to item');
      }
    } catch (error) {
      console.error('Error assigning addon to item:', error);
      toast.error('Failed to add addon template to item');
    }
  };

  const handleRemoveAddonFromItem = async (itemId, templateId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/restaurant/${restaurant[0]}/items/${itemId}/addons/${templateId}`, 
        { method: 'DELETE' }
      );
      if (response.ok) {
        toast.success('Addon template removed from item successfully');
        // Refresh items
        const itemsRes = await fetchWithAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
        setMenuItems(await itemsRes.json());
      } else {
        toast.error('Failed to remove addon template from item');
      }
    } catch (error) {
      console.error('Error removing addon from item:', error);
      toast.error('Failed to remove addon template from item');
    }
  };

  // Add delivery person handler
  const handleAddDeliveryPerson = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchWithAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeliveryPerson),
      });
      setShowAddDeliveryDialog(false);
      setNewDeliveryPerson({ name: "", phone: "" });
      // Always use fetchDeliveryPeople
      await fetchDeliveryPeople();
    } catch (err) {
      alert("Failed to add delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit delivery person handler
  const handleEditDeliveryPerson = (person) => {
    setEditingDelivery(person);
    setShowEditDeliveryDialog(true);
  };
  const handleEditDeliveryPersonSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchWithAuth(`${API_URL}/restaurant/delivery-people`, {
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

  // Delete delivery person
  const handleDeleteDeliveryPerson = async (person) => {
    if (!window.confirm("Are you sure you want to delete this delivery person?")) return;
    setIsSubmitting(true);
    try {
      await fetchWithAuth(`${API_URL}/restaurant/delivery-people`, {
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
      await fetchWithAuth(`${API_URL}/restaurant/assign-delivery-person-to-restaurant`, {
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
      await fetchWithAuth(`${API_URL}/restaurant/unassign-delivery-person-from-restaurant`, {
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

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!restaurant) return <div className="p-8">Restaurant not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent>
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
          {/* Menu Items Table */}
          <div className="overflow-x-auto">
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
                    Addons
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
                      <div className="text-sm font-medium text-gray-900">{item[4]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item[2]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item[5]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item[7] && item[7].length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item[7].map((templateId) => {
                              const template = addonTemplates.find(t => t.template_id === templateId);
                              return template ? (
                                <span key={templateId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {template.name}
                                  <button 
                                    onClick={() => handleRemoveAddonFromItem(item[0], templateId)}
                                    className="ml-1 text-blue-500 hover:text-blue-700"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : null;
                            })}
                            
                            {/* Add template dropdown */}
                            {addonTemplates.filter(t => !item[7].includes(t.template_id)).length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="ml-1 p-1 h-6">+</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {addonTemplates
                                    .filter(t => !item[7].includes(t.template_id))
                                    .map(template => (
                                      <DropdownMenuItem 
                                        key={template.template_id}
                                        onClick={() => handleAssignAddonToItem(item[0], template.template_id)}
                                      >
                                        {template.name}
                                      </DropdownMenuItem>
                                    ))
                                  }
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span>No addons</span>
                            {addonTemplates.length > 0 && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="ml-2 p-1 h-6">+</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {addonTemplates.map(template => (
                                    <DropdownMenuItem 
                                      key={template.template_id}
                                      onClick={() => handleAssignAddonToItem(item[0], template.template_id)}
                                    >
                                      {template.name}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        onClick={() => handleEditItem(item)}
                        variant="outline"
                        className="mr-2"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteItem(item)}
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
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
          <AddonTemplatesAdminComponent restaurantId={restaurant[0]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
