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
      id: item[0],
      name: item[4],
      description: item[2],
      image: item[3],
      price: item[5],
    });
    setShowItemModal(true);
  };
  const handleDeleteItem = (item: any) => {
    setDeletingItem(item);
  };
  const handleAddItem = () => {
    setModalMode("add");
    setItemForm({ id: "", name: "", description: "", image: "", price: "" });
    setShowItemModal(true);
  };

  const handleItemFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    let url = `${API_URL}/restaurant/${restaurant[0]}/items`;
    let method = modalMode === "add" ? "POST" : "PUT";
    if (modalMode === "add") {
      formData.append("name", itemForm.name);
      formData.append("description", itemForm.description);
      formData.append("price", itemForm.price);
      if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
        formData.append("image", fileInputRef.current.files[0]);
      }
    } else {
      const data = {
        item_id: itemForm.id,
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price)
      };
      formData.append("data", JSON.stringify(data));
      if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0]) {
        formData.append("file", fileInputRef.current.files[0]);
      }
    }
    try {
      await fetchWithAdminAuth(url, {
        method,
        body: formData,
      });
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`);
      setMenuItems(await itemsRes.json());
      setShowItemModal(false);
    } catch (err) {
      alert("Failed to save item");
    }
  };

  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant[0]}/items`, {
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
            <CardTitle>Menu Items ({menuItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {menuItems.length === 0 ? (
              <p className="text-muted-foreground">No menu items found.</p>
            ) : (
              <div className="grid gap-4">
                {menuItems.map((item: any) => (
                  <div key={item[0]} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{item[4]}</h4>
                        <p className="text-sm text-muted-foreground">{item[2]}</p>
                        <p className="text-sm font-medium">${item[5]}</p>
                      </div>
                      {item[3] && (
                        <img 
                          src={item[3]} 
                          alt={item[4]} 
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
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
