import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";
import { fetchWithAuth } from "@/context/AuthContext";
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

  const handleEditItem = (item) => {
    setModalMode("edit");
    setItemForm({
      id: item[0],
      name: item[4],
      description: item[2],
      image: item[3],
      price: item[5],
    });
    setShowItemModal(true);
  };
  const handleDeleteItem = (item) => {
    setDeletingItem(item);
  };
  const handleAddItem = () => {
    setModalMode("add");
    setItemForm({ id: "", name: "", description: "", image: "", price: "" });
    setShowItemModal(true);
  };

  // Submit add/edit item
  const handleItemFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    let url = `${API_URL}/restaurant/${restaurant[0]}/items`;
    let method = modalMode === "add" ? "POST" : "PUT";
    if (modalMode === "add") {
      formData.append("name", itemForm.name);
      formData.append("description", itemForm.description);
      formData.append("price", itemForm.price);
      if (fileInputRef.current && fileInputRef.current.files[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }
    } else {
      // For edit, use the backend's required structure
      const data = {
        item_id: itemForm.id,
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price)
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

  // Delivery people management state
  // Fetch delivery people (global, not just assigned)
  const fetchDeliveryPeople = async () => {
    try {
      await fetchWithAuth(`${API_URL}/restaurant/delivery-people`, {
        method: "GET"
      });
      const res = await fetchWithAuth(`${API_URL}/restaurant/delivery-people`);
      setDeliveryPeople(await res.json());
    } catch {
      setDeliveryPeople([]);
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
      </Tabs>
    </div>
  );
}
