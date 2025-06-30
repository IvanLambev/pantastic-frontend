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

export default function RestaurantDetailsAdmin() {
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
          // Use correct endpoint for delivery people
          const dpRes = await fetch(`${API_URL}/restaurant/delivery-people`);
          const dpData = await dpRes.json();
          console.log('Fetched delivery people:', dpData);
          setDeliveryPeople(dpData);
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
    formData.append("name", itemForm.name);
    formData.append("description", itemForm.description);
    formData.append("price", itemForm.price);
    if (fileInputRef.current && fileInputRef.current.files[0]) {
      formData.append("image", fileInputRef.current.files[0]);
    }
    let url = `${API_URL}/restaurant/${restaurant[0]}/items`;
    let method = modalMode === "add" ? "POST" : "PUT";
    if (modalMode === "edit") formData.append("item_id", itemForm.id);
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
      // Refresh delivery people
      const dpRes = await fetchWithAuth(`${API_URL}/restaurant/delivery-people`);
      setDeliveryPeople(await dpRes.json());
    } catch (err) {
      alert("Failed to add delivery person");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!restaurant) return <div className="p-8">Restaurant not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form className="bg-white p-6 rounded shadow-lg w-full max-w-md" onSubmit={handleItemFormSubmit}>
            <h2 className="text-xl font-bold mb-4">{modalMode === "add" ? "Add" : "Edit"} Menu Item</h2>
            <div className="mb-2">
              <label className="block mb-1">Name</label>
              <input className="w-full border px-2 py-1" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Description</label>
              <textarea className="w-full border px-2 py-1" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Price</label>
              <input type="number" step="0.01" className="w-full border px-2 py-1" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Image</label>
              <input type="file" accept="image/*" ref={fileInputRef} className="w-full" />
              {itemForm.image && <img src={itemForm.image} alt="Preview" className="h-24 mt-2" />}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Save</button>
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowItemModal(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Delete Item</h2>
            <p>Are you sure you want to delete <b>{deletingItem[4]}</b>?</p>
            <div className="flex gap-2 mt-4">
              <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={confirmDeleteItem}>Delete</button>
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setDeletingItem(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Add Delivery Person Dialog */}
      {showAddDeliveryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form className="bg-white p-6 rounded shadow-lg w-full max-w-md" onSubmit={handleAddDeliveryPerson}>
            <h2 className="text-xl font-bold mb-4">Add Delivery Person</h2>
            <div className="mb-2">
              <label className="block mb-1">Name</label>
              <input className="w-full border px-2 py-1" value={newDeliveryPerson.name} onChange={e => setNewDeliveryPerson(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="mb-2">
              <label className="block mb-1">Phone</label>
              <input className="w-full border px-2 py-1" value={newDeliveryPerson.phone} onChange={e => setNewDeliveryPerson(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded" disabled={isSubmitting}>Add</button>
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowAddDeliveryDialog(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="details">Restaurant Details</TabsTrigger>
          <TabsTrigger value="delivery">Delivery People</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Menu Items</h2>
            <Button onClick={handleAddItem}>Add Item</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Card key={item[0]} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-background/80 backdrop-blur-sm hover:bg-background/90">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditItem(item)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeleteItem(item)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="aspect-square relative mb-4">
                    <img src={item[3] || '/elementor-placeholder-image.webp'} alt={item[4]} onError={e => { e.target.src = '/elementor-placeholder-image.webp'; }} className="absolute inset-0 h-full w-full object-cover rounded-md" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item[4]}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">{item[2]}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-lg">${typeof item[5] === 'number' ? item[5].toFixed(2) : '0.00'}</div>
                  <div className="text-xs text-muted-foreground">Added on {new Date(item[1]).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Restaurant Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Location Details</h3>
              <p><strong>Latitude:</strong> {restaurant[5]}</p>
              <p><strong>Longitude:</strong> {restaurant[6]}</p>
              <p><strong>Address:</strong> {restaurant[1]}</p>
              <p><strong>City:</strong> {restaurant[2]}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Business Hours</h3>
              {Object.entries(restaurant[8] || {}).map(([day, hours]) => (
                <p key={day}><strong>{day}:</strong> {hours}</p>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="delivery" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Delivery People</h2>
            <Button onClick={() => setShowAddDeliveryDialog(true)}><UserPlus className="mr-2 h-4 w-4" />Add Delivery Person</Button>
          </div>
          <DeliveryPeopleManager 
            restaurantId={restaurant[0]}
            deliveryPeople={deliveryPeople}
            onUpdate={async () => {
              const dpRes = await fetchWithAuth(`${API_URL}/restaurant/delivery-people`);
              setDeliveryPeople(await dpRes.json());
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
