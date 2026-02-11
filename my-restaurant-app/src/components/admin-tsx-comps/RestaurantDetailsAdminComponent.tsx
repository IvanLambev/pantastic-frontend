import { useParams } from "react-router-dom";
import React, { useEffect, useState, useRef, FormEvent } from "react";
import { API_URL } from '@/config/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DeliveryPeopleManager } from "@/components/delivery-people-manager";
import { fetchWithAdminAuth } from "@/utils/adminAuth";
import { formatDualCurrencyCompact } from "@/utils/currency";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2, UserPlus, Plus, Settings, Search, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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
  
  // Addons display state
  const [showAddonsDialog, setShowAddonsDialog] = useState<boolean>(false);
  const [selectedItemAddons, setSelectedItemAddons] = useState<any[]>([]);
  const [selectedItemForAddons, setSelectedItemForAddons] = useState<any>(null);
  const [visibleAddonsCount, setVisibleAddonsCount] = useState<number>(4);

  // Template management states
  const [addonTemplates, setAddonTemplates] = useState<any[]>([]);
  const [removablesTemplates, setRemovablesTemplates] = useState<any[]>([]);
  const [availableAddonTemplates, setAvailableAddonTemplates] = useState<any[]>([]);
  const [availableRemovableTemplates, setAvailableRemovableTemplates] = useState<any[]>([]);
  const [showApplyTemplateDialog, setShowApplyTemplateDialog] = useState<boolean>(false);
  const [showRemoveTemplateDialog, setShowRemoveTemplateDialog] = useState<boolean>(false);
  const [showAddRemovablesDialog, setShowAddRemovablesDialog] = useState<boolean>(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedRemovablesTemplateId, setSelectedRemovablesTemplateId] = useState<string>("");
  
  // Enhanced template creation states with full functionality
  const [showCreateAddonTemplateDialog, setShowCreateAddonTemplateDialog] = useState<boolean>(false);
  const [showCreateRemovablesTemplateDialog, setShowCreateRemovablesTemplateDialog] = useState<boolean>(false);
  const [newAddonTemplate, setNewAddonTemplate] = useState({ 
    name: "", 
    description: "", 
    addons: [] as any[] 
  });
  const [newRemovablesTemplate, setNewRemovablesTemplate] = useState({ 
    name: "", 
    description: "", 
    removables: [] as any[] 
  });
  
  // Addon template creation state
  const [selectedAddonTemplates, setSelectedAddonTemplates] = useState<any[]>([]);
  const [addonTemplateSearch, setAddonTemplateSearch] = useState<string>("");
  const [addonFields, setAddonFields] = useState<any[]>([{ name: "", price: 0, available: true }]);
  const [showAddonTemplateCombobox, setShowAddonTemplateCombobox] = useState<boolean>(false);
  
  // Removable template creation state  
  const [selectedRemovableTemplates, setSelectedRemovableTemplates] = useState<any[]>([]);
  const [removableTemplateSearch, setRemovableTemplateSearch] = useState<string>("");
  const [removableFields, setRemovableFields] = useState<any[]>([{ name: "", price: 0 }]);
  const [showRemovableTemplateCombobox, setShowRemovableTemplateCombobox] = useState<boolean>(false);
  
  // Direct addon/removable creation states
  const [showCreateAddonDialog, setShowCreateAddonDialog] = useState<boolean>(false);
  const [showCreateRemovableDialog, setShowCreateRemovableDialog] = useState<boolean>(false);
  const [newAddon, setNewAddon] = useState({ name: "", price: 0, available: true });
  const [newRemovable, setNewRemovable] = useState({ name: "", price: 0 });
  
  // Enhanced item creation states
  const [showEnhancedItemDialog, setShowEnhancedItemDialog] = useState<boolean>(false);
  const [enhancedItemForm, setEnhancedItemForm] = useState({
    name: "",
    description: "",
    price: "",
    image: null as File | null,
    selectedAddonTemplates: [] as any[],
    selectedRemovableTemplates: [] as any[]
  });

  // Fetch templates
  const fetchTemplates = async () => {
    if (!restaurant || !restaurant.restaurant_id) {
      console.log('No restaurant available for fetching templates');
      return;
    }
    
    try {
      console.log('🔄 Fetching templates for restaurant:', restaurant.restaurant_id);
      const [addonRes, removablesRes] = await Promise.all([
        fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${restaurant.restaurant_id}`),
        fetchWithAdminAuth(`${API_URL}/restaurant/removables/templates/${restaurant.restaurant_id}`)
      ]);
      
      if (addonRes.ok) {
        const addonData = await addonRes.json();
        console.log('📋 Addon templates loaded:', addonData);
        setAddonTemplates(addonData.templates || addonData || []);
      }
      
      if (removablesRes.ok) {
        const removablesData = await removablesRes.json();
        console.log('🗑️ Removables templates loaded:', removablesData);
        setRemovablesTemplates(removablesData.templates || removablesData || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

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
          found = data.find((r: any) => r.restaurant_id === restaurantId);
          console.log('🏪 RestaurantDetailsAdmin (TS): Found specific restaurant:', found);
        } else if (data && data.length > 0) {
          found = data[0]; // Use first restaurant if no specific ID
          console.log('🏪 RestaurantDetailsAdmin (TS): Using first restaurant:', found);
          console.log('🏪 RestaurantDetailsAdmin (TS): Restaurant ID will be:', found?.restaurant_id);
          console.log('🏪 RestaurantDetailsAdmin (TS): Restaurant name will be:', found?.name);
        }
        
        setRestaurant(found);
        if (found) {
          console.log('🏪 RestaurantDetailsAdmin (TS): Fetching items for restaurant:', found.restaurant_id);
          const itemsRes = await fetch(`${API_URL}/restaurant/${found.restaurant_id}/items`);
          setMenuItems(await itemsRes.json());
          await fetchDeliveryPeople();
          await fetchTemplates(); // Fetch templates
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
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items/${item[0]}/addons`);
      const addons = await response.json();
      console.log('🧩 Item addons:', addons);
      setSelectedItemAddons(addons);
      setVisibleAddonsCount(4);
      setSelectedItemForAddons(item);
      setShowAddonsDialog(true);
    } catch (error) {
      console.error('Error fetching addons:', error);
      toast.error('Failed to fetch addons');
    }
  };

  const handleViewRemovables = async (item: any) => {
    try {
      console.log('🗑️ Fetching removables for item:', item[0]);
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/removables/item/${item[0]}`);
      const removables = await response.json();
      console.log('🗑️ Item removables:', removables);
      toast.info(`Removables for ${item[7]}: ${removables.length} items found`);
    } catch (error) {
      console.error('Error fetching removables:', error);
      toast.error('Failed to fetch removables');
    }
  };

  const handleApplyAddonTemplate = (item: any) => {
    setSelectedItem(item);
    setShowApplyTemplateDialog(true);
  };

  const handleApplyTemplateSubmit = async () => {
    try {
      if (!selectedTemplateId) {
        toast.error("Please select a template");
        return;
      }

      console.log('🔧 Applying addon template:', selectedTemplateId, 'to item:', selectedItem[0]);
      await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items/${selectedItem[0]}/apply-template/${selectedTemplateId}`, {
        method: "POST"
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items`);
      setMenuItems(await itemsRes.json());
      toast.success('Addon template applied successfully!');
      setShowApplyTemplateDialog(false);
      setSelectedTemplateId("");
    } catch (error) {
      console.error('Error applying addon template:', error);
      toast.error('Failed to apply addon template');
    }
  };

  const handleRemoveAddonTemplate = (item: any) => {
    setSelectedItem(item);
    setShowRemoveTemplateDialog(true);
  };

  const handleRemoveTemplateSubmit = async () => {
    try {
      if (!selectedTemplateId) {
        toast.error("Please select a template to remove");
        return;
      }

      console.log('🗑️ Removing addon template:', selectedTemplateId, 'from item:', selectedItem[0]);
      await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items/${selectedItem[0]}/remove-template/${selectedTemplateId}`, {
        method: "DELETE"
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items`);
      setMenuItems(await itemsRes.json());
      toast.success('Addon template removed successfully!');
      setShowRemoveTemplateDialog(false);
      setSelectedTemplateId("");
    } catch (error) {
      console.error('Error removing addon template:', error);
      toast.error('Failed to remove addon template');
    }
  };

  const handleAddRemovables = (item: any) => {
    setSelectedItem(item);
    setShowAddRemovablesDialog(true);
  };

  const handleAddRemovablesSubmit = async () => {
    try {
      if (!selectedRemovablesTemplateId) {
        toast.error("Please select a removables template");
        return;
      }

      console.log('➕ Adding removables template:', selectedRemovablesTemplateId, 'to item:', selectedItem[0]);
      
      await fetchWithAdminAuth(`${API_URL}/restaurant/items/add-removables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: selectedItem[0],
          template_id: selectedRemovablesTemplateId
        })
      });
      
      // Refresh menu items
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items`);
      setMenuItems(await itemsRes.json());
      toast.success('Removables added successfully!');
      setShowAddRemovablesDialog(false);
      setSelectedRemovablesTemplateId("");
    } catch (error) {
      console.error('Error adding removables:', error);
      toast.error('Failed to add removables.');
    }
  };

  // Enhanced addon template field management
  const addAddonField = () => {
    setAddonFields([...addonFields, { name: "", price: 0, available: true }]);
  };

  const removeAddonField = (index: number) => {
    setAddonFields(addonFields.filter((_, i) => i !== index));
  };

  const updateAddonField = (index: number, field: string, value: any) => {
    const updatedFields = addonFields.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setAddonFields(updatedFields);
  };

  // Enhanced removable template field management
  const addRemovableField = () => {
    setRemovableFields([...removableFields, { name: "", price: 0 }]);
  };

  const removeRemovableField = (index: number) => {
    setRemovableFields(removableFields.filter((_, i) => i !== index));
  };

  const updateRemovableField = (index: number, field: string, value: any) => {
    const updatedFields = removableFields.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setRemovableFields(updatedFields);
  };

  // Template creation functions
  const handleCreateAddonTemplate = async () => {
    try {
      if (!newAddonTemplate.name.trim()) {
        toast.error("Моля въведете име на шаблона");
        return;
      }

      if (!restaurant || !restaurant.restaurant_id) {
        toast.error("Няма избран ресторант");
        return;
      }

      // Include the addon fields in the template
      const templateData = {
        ...newAddonTemplate,
        addons: addonFields.filter(field => field.name.trim() !== "")
      };

      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${restaurant.restaurant_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        toast.success("Шаблонът за добавки е създаден успешно!");
        setShowCreateAddonTemplateDialog(false);
        setNewAddonTemplate({ name: "", description: "", addons: [] });
        setAddonFields([{ name: "", price: 0, available: true }]);
        await fetchTemplates(); // Refresh templates
      } else {
        const errorData = await response.json();
        toast.error(`Грешка: ${errorData.message || 'Неуспешно създаване на шаблон'}`);
      }
    } catch (error) {
      console.error('Error creating addon template:', error);
      toast.error('Грешка при създаване на шаблон за добавки');
    }
  };

  const handleCreateRemovablesTemplate = async () => {
    try {
      if (!newRemovablesTemplate.name.trim()) {
        toast.error("Моля въведете име на шаблона");
        return;
      }

      if (!restaurant || !restaurant.restaurant_id) {
        toast.error("Няма избран ресторант");
        return;
      }

      // Include the removable fields in the template
      const templateData = {
        ...newRemovablesTemplate,
        removables: removableFields.filter(field => field.name.trim() !== "")
      };

      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/removables/templates/${restaurant.restaurant_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        toast.success("Шаблонът за премахвания е създаден успешно!");
        setShowCreateRemovablesTemplateDialog(false);
        setNewRemovablesTemplate({ name: "", description: "", removables: [] });
        setRemovableFields([{ name: "", price: 0 }]);
        await fetchTemplates(); // Refresh templates
      } else {
        const errorData = await response.json();
        toast.error(`Грешка: ${errorData.message || 'Неуспешно създаване на шаблон'}`);
      }
    } catch (error) {
      console.error('Error creating removables template:', error);
      toast.error('Грешка при създаване на шаблон за премахвания');
    }
  };

  // Enhanced item creation with templates
  const handleCreateEnhancedItem = async () => {
    try {
      if (!enhancedItemForm.name.trim()) {
        toast.error("Моля въведете име на продукта");
        return;
      }

      if (!enhancedItemForm.price.trim()) {
        toast.error("Моля въведете цена");
        return;
      }

      if (!restaurant || !restaurant.restaurant_id) {
        toast.error("Няма избран ресторант");
        return;
      }

      const formData = new FormData();
      
      const itemData = {
        restaurant_id: restaurant.restaurant_id,
        items: [{
          name: enhancedItemForm.name,
          description: enhancedItemForm.description,
          item_type: "pancake",
          price: parseFloat(enhancedItemForm.price),
          addons: {},
          removables: [],
          addon_templates: enhancedItemForm.selectedAddonTemplates.map(t => t.id),
          removable_templates: enhancedItemForm.selectedRemovableTemplates.map(t => t.id)
        }]
      };
      
      formData.append("data", JSON.stringify(itemData));
      if (enhancedItemForm.image) {
        formData.append("file", enhancedItemForm.image);
      }
      
      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Продуктът е създаден успешно с шаблони!");
        setShowEnhancedItemDialog(false);
        setEnhancedItemForm({
          name: "",
          description: "",
          price: "",
          image: null,
          selectedAddonTemplates: [],
          selectedRemovableTemplates: []
        });
        
        // Refresh menu items
        const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items`);
        setMenuItems(await itemsRes.json());
      } else {
        const errorData = await response.json();
        toast.error(`Грешка: ${errorData.message || 'Неуспешно създаване на продукт'}`);
      }
    } catch (error) {
      console.error('Error creating enhanced item:', error);
      toast.error('Грешка при създаване на продукт');
    }
  };

  // Direct addon/removable creation functions
  const handleCreateAddon = async () => {
    try {
      if (!newAddon.name.trim()) {
        toast.error("Моля въведете име на добавката");
        return;
      }

      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddon)
      });

      if (response.ok) {
        toast.success("Добавката е създадена успешно!");
        setShowCreateAddonDialog(false);
        setNewAddon({ name: "", price: 0, available: true });
      } else {
        const errorData = await response.json();
        toast.error(`Грешка: ${errorData.message || 'Неуспешно създаване на добавка'}`);
      }
    } catch (error) {
      console.error('Error creating addon:', error);
      toast.error('Грешка при създаване на добавка');
    }
  };

  const handleCreateRemovable = async () => {
    try {
      if (!newRemovable.name.trim()) {
        toast.error("Моля въведете име на премахването");
        return;
      }

      const response = await fetchWithAdminAuth(`${API_URL}/restaurant/removables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRemovable)
      });

      if (response.ok) {
        toast.success("Премахването е създадено успешно!");
        setShowCreateRemovableDialog(false);
        setNewRemovable({ name: "", price: 0 });
      } else {
        const errorData = await response.json();
        toast.error(`Грешка: ${errorData.message || 'Неуспешно създаване на премахване'}`);
      }
    } catch (error) {
      console.error('Error creating removable:', error);
      toast.error('Грешка при създаване на премахване');
    }
  };

  const handleItemFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    
    try {
      if (modalMode === "add") {
        // Create new item using the correct API structure
        const itemData = {
          restaurant_id: restaurant.restaurant_id,
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
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items`);
      setMenuItems(await itemsRes.json());
      setShowItemModal(false);
      toast.success(modalMode === "add" ? "Item created successfully!" : "Item updated successfully!");
    } catch (err) {
      console.error("Error saving item:", err);
      toast.error("Failed to save item");
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
      const itemsRes = await fetchWithAdminAuth(`${API_URL}/restaurant/${restaurant.restaurant_id}/items`);
      setMenuItems(await itemsRes.json());
      setDeletingItem(null);
      toast.success("Item deleted successfully!");
    } catch (err) {
      console.error("Error deleting item:", err);
      toast.error("Failed to delete item");
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
          restaurant_id: restaurant.restaurant_id,
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
          restaurant_id: restaurant.restaurant_id,
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
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowCreateAddonTemplateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Създай шаблон за добавки
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateRemovablesTemplateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Създай шаблон за премахвания
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateAddonDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Създай добавка
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowCreateRemovableDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Създай премахване
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {restaurant.restaurant_id}</p>
              </div>
              <div>
                <p><strong>Address:</strong> {restaurant.address}</p>
                <p><strong>City:</strong> {restaurant.city}</p>
                <p><strong>Coordinates:</strong> {restaurant.latitude}, {restaurant.longitude}</p>
              </div>
              <div>
                <p><strong>Glovo Address Book ID:</strong> {restaurant.glovo_address_book_id || 'N/A'}</p>
              </div>
              {restaurant.opening_hours && (
                <div>
                  <p><strong>Opening Hours:</strong></p>
                  <ul className="list-disc list-inside text-sm">
                    {Object.entries(restaurant.opening_hours).map(([day, hours]) => (
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
              <div className="flex gap-2">
                <Button onClick={handleAddItem} variant="outline">
                  Добави Обикновено
                </Button>
                <Button onClick={() => setShowEnhancedItemDialog(true)}>
                  Добави с Шаблони
                </Button>
              </div>
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

      {/* Template Management Dialogs */}
      
      {/* Apply Addon Template Dialog */}
      <Dialog open={showApplyTemplateDialog} onOpenChange={setShowApplyTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Прилагане на шаблон за добавки</DialogTitle>
            <DialogDescription>
              Изберете шаблон за добавки, който да се приложи към "{selectedItem?.[7]}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="templateSelect">Шаблон за добавки</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете шаблон..." />
                </SelectTrigger>
                <SelectContent>
                  {addonTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplyTemplateDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleApplyTemplateSubmit}>
              Приложи шаблон
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Addon Template Dialog */}
      <Dialog open={showRemoveTemplateDialog} onOpenChange={setShowRemoveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Премахване на шаблон за добавки</DialogTitle>
            <DialogDescription>
              Изберете шаблон за добавки, който да се премахне от "{selectedItem?.[7]}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="templateSelect">Шаблон за премахване</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете шаблон за премахване..." />
                </SelectTrigger>
                <SelectContent>
                  {addonTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveTemplateDialog(false)}>
              Отказ
            </Button>
            <Button variant="destructive" onClick={handleRemoveTemplateSubmit}>
              Премахни шаблон
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Removables Dialog */}
      <Dialog open={showAddRemovablesDialog} onOpenChange={setShowAddRemovablesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавяне на премахвания</DialogTitle>
            <DialogDescription>
              Изберете шаблон за премахвания, който да се добави към "{selectedItem?.[7]}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="removablesTemplateSelect">Шаблон за премахвания</Label>
              <Select value={selectedRemovablesTemplateId} onValueChange={setSelectedRemovablesTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Изберете шаблон за премахвания..." />
                </SelectTrigger>
                <SelectContent>
                  {removablesTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRemovablesDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleAddRemovablesSubmit}>
              Добави премахвания
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Addon Template Dialog - Legacy Simple Version */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Създаване на шаблон за добавки</DialogTitle>
            <DialogDescription>
              Създайте нов шаблон за добавки, който може да се прилага към продукти
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="templateName">Име на шаблона</Label>
              <Input
                id="templateName"
                value={newAddonTemplate.name}
                onChange={(e) => setNewAddonTemplate({...newAddonTemplate, name: e.target.value})}
                placeholder="Въведете име на шаблона..."
              />
            </div>
            <div>
              <Label htmlFor="templateDescription">Описание</Label>
              <Textarea
                id="templateDescription"
                value={newAddonTemplate.description}
                onChange={(e) => setNewAddonTemplate({...newAddonTemplate, description: e.target.value})}
                placeholder="Въведете описание на шаблона..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAddonTemplateDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleCreateAddonTemplate}>
              Създай шаблон
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Removables Template Dialog - Legacy Simple Version */}
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Създаване на шаблон за премахвания</DialogTitle>
            <DialogDescription>
              Създайте нов шаблон за премахвания, който може да се прилага към продукти
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="removablesTemplateName">Име на шаблона</Label>
              <Input
                id="removablesTemplateName"
                value={newRemovablesTemplate.name}
                onChange={(e) => setNewRemovablesTemplate({...newRemovablesTemplate, name: e.target.value})}
                placeholder="Въведете име на шаблона..."
              />
            </div>
            <div>
              <Label htmlFor="removablesTemplateDescription">Описание</Label>
              <Textarea
                id="removablesTemplateDescription"
                value={newRemovablesTemplate.description}
                onChange={(e) => setNewRemovablesTemplate({...newRemovablesTemplate, description: e.target.value})}
                placeholder="Въведете описание на шаблона..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRemovablesTemplateDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleCreateRemovablesTemplate}>
              Създай шаблон
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Addon Dialog */}
      <Dialog open={showCreateAddonDialog} onOpenChange={setShowCreateAddonDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Създаване на добавка</DialogTitle>
            <DialogDescription>
              Създайте нова добавка, която може да се добави към продукти
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="addonName">Име на добавката</Label>
              <Input
                id="addonName"
                value={newAddon.name}
                onChange={(e) => setNewAddon({...newAddon, name: e.target.value})}
                placeholder="Въведете име на добавката..."
              />
            </div>
            <div>
              <Label htmlFor="addonPrice">Цена</Label>
              <Input
                id="addonPrice"
                type="number"
                step="0.01"
                value={newAddon.price}
                onChange={(e) => setNewAddon({...newAddon, price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateAddonDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleCreateAddon}>
              Създай добавка
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Removable Dialog */}
      <Dialog open={showCreateRemovableDialog} onOpenChange={setShowCreateRemovableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Създаване на премахване</DialogTitle>
            <DialogDescription>
              Създайте ново премахване, което може да се премахне от продукти
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="removableName">Име на премахването</Label>
              <Input
                id="removableName"
                value={newRemovable.name}
                onChange={(e) => setNewRemovable({...newRemovable, name: e.target.value})}
                placeholder="Въведете име на премахването..."
              />
            </div>
            <div>
              <Label htmlFor="removablePrice">Намаление в цената</Label>
              <Input
                id="removablePrice"
                type="number"
                step="0.01"
                value={newRemovable.price}
                onChange={(e) => setNewRemovable({...newRemovable, price: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateRemovableDialog(false)}>
              Отказ
            </Button>
            <Button onClick={handleCreateRemovable}>
              Създай премахване
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Addons Dialog */}
      <Dialog open={showAddonsDialog} onOpenChange={(open) => {
        setShowAddonsDialog(open);
        if (!open) setVisibleAddonsCount(4); // Reset count when closing
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Addons for "{selectedItemForAddons?.[7]}"</DialogTitle>
            <DialogDescription>
              View all addons currently associated with this menu item
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedItemAddons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No addons found for this item.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedItemAddons.slice(0, visibleAddonsCount).map((addon, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{addon.name || addon.addon_name || 'Unnamed Addon'}</div>
                      {addon.description && (
                        <div className="text-sm text-muted-foreground">{addon.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {formatDualCurrencyCompact(addon.price || 0)}
                      </Badge>
                      <Badge variant={addon.available !== false ? "default" : "secondary"}>
                        {addon.available !== false ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {visibleAddonsCount < selectedItemAddons.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisibleAddonsCount(prev => prev + 10)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Покажи повече ({selectedItemAddons.length - visibleAddonsCount} останали)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddonsDialog(false)}>
              Затвори
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Item Creation Dialog */}
      <Drawer open={showEnhancedItemDialog} onOpenChange={setShowEnhancedItemDialog}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Създаване на продукт с шаблони</DrawerTitle>
            <DrawerDescription>
              Създайте нов продукт и приложете шаблони за добавки и премахвания
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
            {/* Basic Item Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Основна информация</h3>
              
              <div>
                <Label htmlFor="enhanced-name">Име на продукта *</Label>
                <Input
                  id="enhanced-name"
                  value={enhancedItemForm.name}
                  onChange={(e) => setEnhancedItemForm({ ...enhancedItemForm, name: e.target.value })}
                  placeholder="Въведете име на продукта..."
                />
              </div>
              
              <div>
                <Label htmlFor="enhanced-description">Описание</Label>
                <Textarea
                  id="enhanced-description"
                  value={enhancedItemForm.description}
                  onChange={(e) => setEnhancedItemForm({ ...enhancedItemForm, description: e.target.value })}
                  placeholder="Въведете описание на продукта..."
                />
              </div>
              
              <div>
                <Label htmlFor="enhanced-price">Цена (лв) *</Label>
                <Input
                  id="enhanced-price"
                  type="number"
                  step="0.01"
                  value={enhancedItemForm.price}
                  onChange={(e) => setEnhancedItemForm({ ...enhancedItemForm, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="enhanced-image">Изображение</Label>
                <Input
                  id="enhanced-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEnhancedItemForm({ 
                    ...enhancedItemForm, 
                    image: e.target.files?.[0] || null 
                  })}
                />
              </div>
            </div>

            {/* Addon Templates Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Шаблони за добавки</h3>
              
              <div>
                <Label>Избрани шаблони за добавки</Label>
                <Popover open={showAddonTemplateCombobox} onOpenChange={setShowAddonTemplateCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={showAddonTemplateCombobox}
                      className="w-full justify-between"
                    >
                      {enhancedItemForm.selectedAddonTemplates.length > 0
                        ? `Избрани ${enhancedItemForm.selectedAddonTemplates.length} шаблона`
                        : "Изберете шаблони за добавки..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Търсете шаблони..."
                        value={addonTemplateSearch}
                        onValueChange={setAddonTemplateSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Не са намерени шаблони.</CommandEmpty>
                        <CommandGroup>
                          {addonTemplates
                            .filter(template => 
                              template.name.toLowerCase().includes(addonTemplateSearch.toLowerCase()) ||
                              template.description.toLowerCase().includes(addonTemplateSearch.toLowerCase())
                            )
                            .map((template) => (
                              <CommandItem
                                key={template.id}
                                value={template.id}
                                onSelect={() => {
                                  const isSelected = enhancedItemForm.selectedAddonTemplates.some(t => t.id === template.id);
                                  if (isSelected) {
                                    setEnhancedItemForm({
                                      ...enhancedItemForm,
                                      selectedAddonTemplates: enhancedItemForm.selectedAddonTemplates.filter(t => t.id !== template.id)
                                    });
                                  } else {
                                    setEnhancedItemForm({
                                      ...enhancedItemForm,
                                      selectedAddonTemplates: [...enhancedItemForm.selectedAddonTemplates, template]
                                    });
                                  }
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    enhancedItemForm.selectedAddonTemplates.some(t => t.id === template.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-sm text-muted-foreground">{template.description}</div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {enhancedItemForm.selectedAddonTemplates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {enhancedItemForm.selectedAddonTemplates.map((template) => (
                      <Badge key={template.id} variant="secondary" className="text-xs">
                        {template.name}
                        <button
                          onClick={() => setEnhancedItemForm({
                            ...enhancedItemForm,
                            selectedAddonTemplates: enhancedItemForm.selectedAddonTemplates.filter(t => t.id !== template.id)
                          })}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Removable Templates Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Шаблони за премахвания</h3>
              
              <div>
                <Label>Избрани шаблони за премахвания</Label>
                <Popover open={showRemovableTemplateCombobox} onOpenChange={setShowRemovableTemplateCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={showRemovableTemplateCombobox}
                      className="w-full justify-between"
                    >
                      {enhancedItemForm.selectedRemovableTemplates.length > 0
                        ? `Избрани ${enhancedItemForm.selectedRemovableTemplates.length} шаблона`
                        : "Изберете шаблони за премахвания..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Търсете шаблони..."
                        value={removableTemplateSearch}
                        onValueChange={setRemovableTemplateSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Не са намерени шаблони.</CommandEmpty>
                        <CommandGroup>
                          {removablesTemplates
                            .filter(template => 
                              template.name.toLowerCase().includes(removableTemplateSearch.toLowerCase()) ||
                              template.description.toLowerCase().includes(removableTemplateSearch.toLowerCase())
                            )
                            .map((template) => (
                              <CommandItem
                                key={template.id}
                                value={template.id}
                                onSelect={() => {
                                  const isSelected = enhancedItemForm.selectedRemovableTemplates.some(t => t.id === template.id);
                                  if (isSelected) {
                                    setEnhancedItemForm({
                                      ...enhancedItemForm,
                                      selectedRemovableTemplates: enhancedItemForm.selectedRemovableTemplates.filter(t => t.id !== template.id)
                                    });
                                  } else {
                                    setEnhancedItemForm({
                                      ...enhancedItemForm,
                                      selectedRemovableTemplates: [...enhancedItemForm.selectedRemovableTemplates, template]
                                    });
                                  }
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    enhancedItemForm.selectedRemovableTemplates.some(t => t.id === template.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-sm text-muted-foreground">{template.description}</div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {enhancedItemForm.selectedRemovableTemplates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {enhancedItemForm.selectedRemovableTemplates.map((template) => (
                      <Badge key={template.id} variant="secondary" className="text-xs">
                        {template.name}
                        <button
                          onClick={() => setEnhancedItemForm({
                            ...enhancedItemForm,
                            selectedRemovableTemplates: enhancedItemForm.selectedRemovableTemplates.filter(t => t.id !== template.id)
                          })}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleCreateEnhancedItem}>
              Създай продукт с шаблони
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Отказ</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Enhanced Create Addon Template Dialog */}
      <Drawer open={showCreateAddonTemplateDialog} onOpenChange={setShowCreateAddonTemplateDialog}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Създаване на шаблон за добавки</DrawerTitle>
            <DrawerDescription>
              Създайте нов шаблон за добавки, който може да се прилага към продукти
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="addon-template-name">Име на шаблона *</Label>
                <Input
                  id="addon-template-name"
                  value={newAddonTemplate.name}
                  onChange={(e) => setNewAddonTemplate({...newAddonTemplate, name: e.target.value})}
                  placeholder="Въведете име на шаблона..."
                />
              </div>
              
              <div>
                <Label htmlFor="addon-template-description">Описание</Label>
                <Textarea
                  id="addon-template-description"
                  value={newAddonTemplate.description}
                  onChange={(e) => setNewAddonTemplate({...newAddonTemplate, description: e.target.value})}
                  placeholder="Въведете описание на шаблона..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold">Добавки в шаблона</h4>
                <Button onClick={addAddonField} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Добави добавка
                </Button>
              </div>
              
              {addonFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`addon-name-${index}`}>Име на добавката</Label>
                    <Input
                      id={`addon-name-${index}`}
                      value={field.name}
                      onChange={(e) => updateAddonField(index, 'name', e.target.value)}
                      placeholder="Въведете име на добавката..."
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`addon-price-${index}`}>Цена</Label>
                    <Input
                      id={`addon-price-${index}`}
                      type="number"
                      step="0.01"
                      value={field.price}
                      onChange={(e) => updateAddonField(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`addon-available-${index}`}
                      checked={field.available}
                      onChange={(e) => updateAddonField(index, 'available', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`addon-available-${index}`} className="text-sm">
                      Налична
                    </Label>
                  </div>
                  {addonFields.length > 1 && (
                    <Button
                      onClick={() => removeAddonField(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleCreateAddonTemplate}>
              Създай шаблон за добавки
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Отказ</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Enhanced Create Removables Template Dialog */}
      <Drawer open={showCreateRemovablesTemplateDialog} onOpenChange={setShowCreateRemovablesTemplateDialog}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Създаване на шаблон за премахвания</DrawerTitle>
            <DrawerDescription>
              Създайте нов шаблон за премахвания, който може да се прилага към продукти
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <Label htmlFor="removables-template-name">Име на шаблона *</Label>
                <Input
                  id="removables-template-name"
                  value={newRemovablesTemplate.name}
                  onChange={(e) => setNewRemovablesTemplate({...newRemovablesTemplate, name: e.target.value})}
                  placeholder="Въведете име на шаблона..."
                />
              </div>
              
              <div>
                <Label htmlFor="removables-template-description">Описание</Label>
                <Textarea
                  id="removables-template-description"
                  value={newRemovablesTemplate.description}
                  onChange={(e) => setNewRemovablesTemplate({...newRemovablesTemplate, description: e.target.value})}
                  placeholder="Въведете описание на шаблона..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-md font-semibold">Премахвания в шаблона</h4>
                <Button onClick={addRemovableField} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Добави премахване
                </Button>
              </div>
              
              {removableFields.map((field, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`removable-name-${index}`}>Име на премахването</Label>
                    <Input
                      id={`removable-name-${index}`}
                      value={field.name}
                      onChange={(e) => updateRemovableField(index, 'name', e.target.value)}
                      placeholder="Въведете име на премахването..."
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`removable-price-${index}`}>Намаление в цената</Label>
                    <Input
                      id={`removable-price-${index}`}
                      type="number"
                      step="0.01"
                      value={field.price}
                      onChange={(e) => updateRemovableField(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  {removableFields.length > 1 && (
                    <Button
                      onClick={() => removeRemovableField(index)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleCreateRemovablesTemplate}>
              Създай шаблон за премахвания
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Отказ</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default RestaurantDetailsAdminComponent;
