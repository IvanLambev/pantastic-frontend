import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";
import { fetchWithAuth } from "@/context/AuthContext";

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
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="details">Restaurant Details</TabsTrigger>
          <TabsTrigger value="delivery">Delivery People</TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Menu Items</h2>
            <button className="bg-primary text-white px-4 py-2 rounded" onClick={handleAddItem}>Add Item</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => (
              <Card key={item[0]} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="relative">
                  <img src={item[3] || '/elementor-placeholder-image.webp'} alt={item[4]} className="w-full h-40 object-cover rounded mb-2" />
                  <CardTitle>{item[4]}</CardTitle>
                  <CardDescription>{item[2]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="font-semibold text-lg">${typeof item[5] === 'number' ? item[5].toFixed(2) : '0.00'}</div>
                  <div className="flex gap-2 mt-2">
                    <button className="text-blue-600 hover:underline" onClick={() => handleEditItem(item)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDeleteItem(item)}>Delete</button>
                  </div>
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
          <h2 className="text-xl font-bold mb-4">Delivery People</h2>
          <DeliveryPeopleManager 
            restaurantId={restaurant[0]}
            deliveryPeople={deliveryPeople}
            onUpdate={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
