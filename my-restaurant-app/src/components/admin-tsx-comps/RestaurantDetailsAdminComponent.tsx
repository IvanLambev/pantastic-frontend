import { useParams } from "react-router-dom";
import React, { useEffect, useState, useRef, FormEvent } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Type definitions for state
interface ItemForm {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
}
interface DeliveryPerson {
  delivery_person_id?: string;
  name?: string;
  phone?: string;
  [key: string]: any;
}

const RestaurantDetailsAdminComponent: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [deliveryPeople, setDeliveryPeople] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("items");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [itemForm, setItemForm] = useState<ItemForm>({
    id: "",
    name: "",
    description: "",
    image: "",
    price: "",
  });
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [showAddDeliveryDialog, setShowAddDeliveryDialog] = useState<boolean>(false);
  const [newDeliveryPerson, setNewDeliveryPerson] = useState<DeliveryPerson>({ name: "", phone: "" });
  const [editingDelivery, setEditingDelivery] = useState<DeliveryPerson | null>(null);
  const [showEditDeliveryDialog, setShowEditDeliveryDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      setLoading(true);
      try {
        console.log('🏪 RestaurantDetailsAdmin (TS): Fetching restaurants...');
        console.log('🏪 RestaurantDetailsAdmin (TS): Looking for restaurantId:', restaurantId);
        
        const res = await fetch(`${API_URL}/restaurant/restaurants`);
        const data = await res.json();
        console.log('🏪 RestaurantDetailsAdmin (TS): All restaurants:', data);
        console.log('🏪 RestaurantDetailsAdmin (TS): Data length:', data?.length);
        console.log('🏪 RestaurantDetailsAdmin (TS): First restaurant structure:', data?.[0]);
        
        // If no restaurantId provided, use the first restaurant
        let found;
        if (restaurantId) {
          found = data.find((r: any) => r[0] === restaurantId);
          console.log('🏪 RestaurantDetailsAdmin (TS): Found specific restaurant:', found);
        } else if (data && data.length > 0) {
          found = data[0]; // Use first restaurant if no specific ID
          console.log('🏪 RestaurantDetailsAdmin (TS): Using first restaurant:', found);
          console.log('🏪 RestaurantDetailsAdmin (TS): Restaurant ID will be:', found?.[0]);
          console.log('🏪 RestaurantDetailsAdmin (TS): Restaurant name will be:', found?.[8]);
        }
        
        setRestaurant(found);
        if (found) {
          console.log('🏪 RestaurantDetailsAdmin (TS): Fetching items for restaurant:', found[0]);
          const itemsRes = await fetch(`${API_URL}/restaurant/${found[0]}/items`);
          setMenuItems(await itemsRes.json());
          await fetchDeliveryPeople();
        } else {
          console.log('🏪 RestaurantDetailsAdmin (TS): No restaurant found');
        }
      } catch (err) {
        console.error('🏪 RestaurantDetailsAdmin (TS): Error fetching restaurant:', err);
        setError("Failed to load restaurant details");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  const handleEditItem = (item: any) => {
    setModalMode("edit");
    setItemForm({
      id: item[0],        // item_id
      name: item[7],      // name
      description: item[4], // description  
      image: item[5],     // image_url
      price: item[8].toString(), // price
    });
    setShowItemModal(true);
  };
  const handleDeleteItem = (item: any) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };
  const handleAddItem = () => {
    setModalMode("add");
    setItemForm({ id: "", name: "", description: "", image: "", price: "" });
    setShowItemModal(true);
  };

  const handleViewAddons = async (item: any) => {
    try {
      console.log('🧩 Fetching addons for item:', item[0]);
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items/${item[0]}/addons`);
      const addons = await response.json();
      console.log('🧩 Item addons:', addons);
      alert(`Addons for ${item[7]}:\n${JSON.stringify(addons, null, 2)}`);
    } catch (error) {
      console.error('Error fetching addons:', error);
      alert('Failed to fetch addons');
    }
  };

  const handleViewRemovables = async (item: any) => {
    try {
      console.log('🗑️ Fetching removables for item:', item[0]);
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/removables/item/${item[0]}`);
      const removables = await response.json();
      console.log('🗑️ Item removables:', removables);
      alert(`Removables for ${item[7]}:\n${JSON.stringify(removables, null, 2)}`);
    } catch (error) {
      console.error('Error fetching removables:', error);
      alert('Failed to fetch removables');
    }
  };

  const handleApplyAddonTemplate = async (item: any) => {
    const templateId = prompt('Enter addon template ID to apply:');
    if (!templateId) return;
    
    try {
      console.log('🔧 Applying addon template:', templateId, 'to item:', item[0]);
      await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items/${item[0]}/apply-template/${templateId}`, {
        method: "POST"
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      alert('Addon template applied successfully!');
    } catch (error) {
      console.error('Error applying addon template:', error);
      alert('Failed to apply addon template');
    }
  };

  const handleRemoveAddonTemplate = async (item: any) => {
    const templateId = prompt('Enter addon template ID to remove:');
    if (!templateId) return;
    
    try {
      console.log('🗑️ Removing addon template:', templateId, 'from item:', item[0]);
      await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items/${item[0]}/remove-template/${templateId}`, {
        method: "DELETE"
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      alert('Addon template removed successfully!');
    } catch (error) {
      console.error('Error removing addon template:', error);
      alert('Failed to remove addon template');
    }
  };

  const handleAddRemovables = async (item: any) => {
    const removablesStr = prompt('Enter removables as JSON (e.g., {"sugar": "sugar", "cream": "cream"}):');
    if (!removablesStr) return;
    
    try {
      const removables = JSON.parse(removablesStr);
      console.log('➕ Adding removables to item:', item[0], removables);
      
      await fetchWithAdminAuth(`${API_URL}/restaurant/items/add-removables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item[0],
          removables: removables
        })
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      alert('Removables added successfully!');
    } catch (error) {
      console.error('Error adding removables:', error);
      alert('Failed to add removables. Please check the JSON format.');
    }
  };

  const handleItemFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    
    try {
      if (modalMode === "add") {
        // Create new item using the correct API structure
        const itemData = {
          restaurant_id: restaurant[0],
          items: [{
            name: itemForm.name,
            description: itemForm.description,
            item_type: "pancake", // Default item type
            price: parseFloat(itemForm.price),
            addons: {}, // Empty addons initially
            removables: [] // Empty removables initially
          }]
        };
        
        formData.append("data", JSON.stringify(itemData));
        if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
          formData.append("file", fileInputRef.current.files[0]);
        }
        
        await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
          method: "POST",
          body: formData,
        });
      } else {
        // Update existing item
        const updateData = {
          item_id: itemForm.id,
          name: itemForm.name,
          description: itemForm.description,
          price: parseFloat(itemForm.price)
        };
        
        formData.append("data", JSON.stringify(updateData));
        if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
          formData.append("file", fileInputRef.current.files[0]);
        }
        
        await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
          method: "PUT",
          body: formData,
        });
      }
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      setShowItemModal(false);
      alert(modalMode === "add" ? "Item created successfully!" : "Item updated successfully!");
    } catch (err) {
      console.error("Error saving item:", err);
      alert("Failed to save item");
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      console.log('🗑️ Deleting item:', deletingItem[0]);
      await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: deletingItem[0] }),
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      setDeletingItem(null);
      alert("Item deleted successfully!");
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item");
    }
  };

  const fetchDeliveryPeople = async () => {
    try {
      const res = await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`);
      setDeliveryPeople(await res.json());
    } catch {
      setDeliveryPeople([]);
    }
  };

  const handleAddDeliveryPerson = async (e: FormEvent) => {
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
      await fetchDeliveryPeople();
    } catch (err) {
      alert("Failed to add delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDeliveryPerson = (person: DeliveryPerson) => {
    setEditingDelivery(person);
    setShowEditDeliveryDialog(true);
  };
  const handleEditDeliveryPersonSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_person_id: editingDelivery?.delivery_person_id || editingDelivery?.[0],
          person: {
            name: editingDelivery?.name || editingDelivery?.[2],
            phone: editingDelivery?.phone || editingDelivery?.[3],
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

  const handleDeleteDeliveryPerson = async (person: DeliveryPerson) => {
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

  const handleAssignDelivery = async (person: DeliveryPerson) => {
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
  const handleUnassignDelivery = async (person: DeliveryPerson) => {
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

  if (loading) return <div className="p-8">Loading restaurant details...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!restaurant) return <div className="p-8">Restaurant not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add/Edit Item Dialog */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Add New Item" : "Edit Item"}</DialogTitle>
            <DialogDescription>
              {modalMode === "add" ? "Create a new menu item" : "Update the menu item details"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleItemFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                ref={fileInputRef}
                accept="image/*"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowItemModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {modalMode === "add" ? "Create Item" : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.[7]}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                setDeletingItem(selectedItem);
                await confirmDeleteItem();
                setShowDeleteConfirm(false);
              }}
            >
              Delete Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Restaurant Info */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{restaurant[8]}</h3>
                <p className="text-sm text-muted-foreground">ID: {restaurant[0]}</p>
              </div>
              <div>
                <p><strong>Address:</strong> {restaurant[1]}</p>
                <p><strong>City:</strong> {restaurant[3]}</p>
                <p><strong>Coordinates:</strong> {restaurant[6]}, {restaurant[7]}</p>
              </div>
              <div>
                <p><strong>Glovo Address Book ID:</strong> {restaurant[2]}</p>
              </div>
              {restaurant[9] && (
                <div>
                  <p><strong>Opening Hours:</strong></p>
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(restaurant[9]).map(([day, hours]) => (
                      <li key={day}>{day}: {hours as string}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Menu Items ({menuItems.length})</CardTitle>
              <Button onClick={handleAddItem}>
                Add New Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {menuItems.length === 0 ? (
              <p className="text-muted-foreground">No menu items found.</p>
            ) : (
              <div className="grid gap-4">
                {menuItems.map((item: any) => (
                  <div key={item[0]} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {item[5] && (
                            <img 
                              src={item[5]} 
                              alt={item[7]} 
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{item[7]}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{item[4]}</p>
                            <div className="flex items-center gap-4">
                              <p className="text-lg font-bold text-green-600">${item[8]}</p>
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {item[6]}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              <p>Item ID: {item[0]}</p>
                              {item[1]?.length > 0 && (
                                <p>Addon Templates: {item[1].length}</p>
                              )}
                              {item[9]?.length > 0 && (
                                <p>Removable Templates: {item[9].length}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => handleEditItem(item)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Item Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAddons(item)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              View Current Addons
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleApplyAddonTemplate(item)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Apply Addon Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemoveAddonTemplate(item)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Addon Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewRemovables(item)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              View Current Removables
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddRemovables(item)}>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Removables
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteItem(item)} className="text-red-600 border-t mt-1 pt-1">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Item
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery People */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery People</CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryPeople.length === 0 ? (
              <p className="text-muted-foreground">No delivery people found.</p>
            ) : (
              <div className="grid gap-2">
                {deliveryPeople.map((person: any) => (
                  <div key={person[0] || person.delivery_person_id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium">{person[2] || person.name}</p>
                      <p className="text-sm text-muted-foreground">{person[3] || person.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantDetailsAdminComponent;
