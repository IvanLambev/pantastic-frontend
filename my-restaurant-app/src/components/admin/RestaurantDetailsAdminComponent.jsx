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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreVertical, Pencil, Trash2, UserPlus, Plus, X, CheckIcon, ChevronsUpDownIcon, Clock } from "lucide-react";
import { updateWorkingHours } from '@/services/adminApi';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { t } from "@/utils/translations";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { openInMaps } from "@/utils/mapsHelper";

export default function RestaurantDetailsAdminComponent() {
  const { restaurantId: paramRestaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
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
    item_type: "",
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

  // Enhanced item creation state
  const [availableAddonTemplates, setAvailableAddonTemplates] = useState([]);
  const [availableRemovableTemplates, setAvailableRemovableTemplates] = useState([]);
  const [selectedAddonTemplates, setSelectedAddonTemplates] = useState([]);
  const [selectedRemovableTemplates, setSelectedRemovableTemplates] = useState([]);

  // Addon template creation
  const [showCreateAddonTemplate, setShowCreateAddonTemplate] = useState(false);
  const [newAddonTemplate, setNewAddonTemplate] = useState({
    name: "",
    description: "",
    addons: [{ name: "", price: "" }]
  });

  // Removable template creation
  const [showCreateRemovableTemplate, setShowCreateRemovableTemplate] = useState(false);
  const [newRemovableTemplate, setNewRemovableTemplate] = useState({
    name: "",
    description: "",
    removables: [""]
  });

  // Combobox states
  const [addonTemplateOpen, setAddonTemplateOpen] = useState(false);
  const [removableTemplateOpen, setRemovableTemplateOpen] = useState(false);

  // Import dialog states
  const [showImportAddonDialog, setShowImportAddonDialog] = useState(false);
  const [showImportRemovableDialog, setShowImportRemovableDialog] = useState(false);
  const [importText, setImportText] = useState("");

  // Import full item dialog states
  const [showImportItemDialog, setShowImportItemDialog] = useState(false);
  const [importItemText, setImportItemText] = useState("");
  const [parsedItemData, setParsedItemData] = useState(null);

  // Multi-restaurant support states
  const [addToMultipleRestaurants, setAddToMultipleRestaurants] = useState(false);
  const [selectedRestaurantsForCreation, setSelectedRestaurantsForCreation] = useState([]);

  // Working Hours Dialog State
  const [isWorkingHoursDialogOpen, setIsWorkingHoursDialogOpen] = useState(false);
  const [selectedRestaurantsForHours, setSelectedRestaurantsForHours] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    Monday: '9:00-22:00',
    Tuesday: '9:00-22:00',
    Wednesday: '9:00-22:00',
    Thursday: '9:00-22:00',
    Friday: '9:00-23:00',
    Saturday: '10:00-23:00',
    Sunday: '10:00-21:00'
  });
  const [updatingWorkingHours, setUpdatingWorkingHours] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      console.log('🔄 [ADMIN DEBUG] Starting fetchRestaurant...');
      setLoading(true);
      try {
        console.log('🔄 [ADMIN DEBUG] Fetching restaurants list from:', `${API_URL}/restaurant/restaurants`);
        const res = await fetchWithAdminAuth(`${API_URL}/restaurant/restaurants`);
        console.log('📡 [ADMIN DEBUG] Restaurants response status:', res.status, res.ok);

        if (!res.ok) {
          console.error('❌ [ADMIN DEBUG] Failed to fetch restaurants. Status:', res.status);
          const errorText = await res.text();
          console.error('❌ [ADMIN DEBUG] Error response:', errorText);
          throw new Error(`Failed to fetch restaurants: ${res.status}`);
        }

        const dataRaw = await res.json();
        console.log('✅ [ADMIN DEBUG] Restaurants data received:', dataRaw);
        console.log('📊 [ADMIN DEBUG] Restaurants data type:', typeof dataRaw, 'Is Array:', Array.isArray(dataRaw));
        
        // Ensure data is an array (API might return object with data property)
        let data = dataRaw;
        if (!Array.isArray(data)) {
          if (data && typeof data === 'object') {
            if (Array.isArray(data.data)) data = data.data;
            else if (Array.isArray(data.restaurants)) data = data.restaurants;
            else if (Array.isArray(data.items)) data = data.items;
            else if (Array.isArray(data.results)) data = data.results;
            else if (data.restaurant_id) data = [data]; // Single restaurant object
            else {
              console.error('❌ [ADMIN DEBUG] Restaurants data is not an array:', dataRaw);
              data = [];
            }
          } else {
            console.error('❌ [ADMIN DEBUG] Restaurants data is not valid:', dataRaw);
            data = [];
          }
        }
        console.log('📊 [ADMIN DEBUG] Restaurants count:', data?.length);

        // Find by UUID (paramRestaurantId) or use first restaurant if no param
        let found = null;
        let idToUse = null;

        console.log('🔍 [ADMIN DEBUG] Looking for restaurantId:', paramRestaurantId);
        console.log('🔍 [ADMIN DEBUG] All restaurants:', data);
        console.log('🔍 [ADMIN DEBUG] Data length:', data.length);

        if (paramRestaurantId) {
          console.log('🔍 [ADMIN DEBUG] Using param restaurant ID:', paramRestaurantId);
          found = data.find(r => r.restaurant_id === paramRestaurantId);
          idToUse = paramRestaurantId;
          console.log('🔍 [ADMIN DEBUG] Found restaurant by param:', found);
        } else if (data.length > 0) {
          console.log('🔍 [ADMIN DEBUG] No param, using first restaurant');
          console.log('🔍 [ADMIN DEBUG] First restaurant structure:', data[0]);
          // If no param provided, use first restaurant
          found = data[0];
          idToUse = data[0].restaurant_id;
          console.log('✅ [ADMIN DEBUG] Using first restaurant:', found);
          console.log('✅ [ADMIN DEBUG] Restaurant ID will be:', idToUse);
          console.log('✅ [ADMIN DEBUG] Restaurant name will be:', found.name);
        }

        if (!found || !idToUse) {
          console.error('❌ [ADMIN DEBUG] No restaurant found or no ID');
          console.error('❌ [ADMIN DEBUG] found:', found, 'idToUse:', idToUse);
          setError("Restaurant not found");
          setLoading(false);
          return;
        }

        console.log('🎯 [ADMIN DEBUG] Setting restaurant state:', found);
        console.log('🎯 [ADMIN DEBUG] Setting resolved restaurant ID:', idToUse);

        setRestaurant(found);
        setResolvedRestaurantId(idToUse);

        console.log('🔄 [ADMIN DEBUG] Fetching parallel data for restaurant:', idToUse);
        console.log('🔄 [ADMIN DEBUG] Items URL:', `${API_URL}/restaurant/${idToUse}/items`);
        console.log('🔄 [ADMIN DEBUG] Delivery URL:', `${API_URL}/restaurant/delivery-people`);
        console.log('🔄 [ADMIN DEBUG] Addon Templates URL:', `${API_URL}/restaurant/addon-templates/${idToUse}`);
        console.log('🔄 [ADMIN DEBUG] Removable Templates URL:', `${API_URL}/restaurant/removables/templates/${idToUse}`);

        // Fetch all data in parallel
        const [itemsRes, deliveryRes, addonTemplatesRes, removableTemplatesRes] = await Promise.all([
          fetchWithAdminAuth(`${API_URL}/restaurant/${idToUse}/items`),
          fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`),
          fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${idToUse}`),
          fetchWithAdminAuth(`${API_URL}/restaurant/removables/templates/${idToUse}`)
        ]);

        console.log('📡 [ADMIN DEBUG] Items response status:', itemsRes.status, itemsRes.ok);
        console.log('📡 [ADMIN DEBUG] Delivery response status:', deliveryRes.status, deliveryRes.ok);
        console.log('📡 [ADMIN DEBUG] Addon Templates response status:', addonTemplatesRes.status, addonTemplatesRes.ok);
        console.log('📡 [ADMIN DEBUG] Removable Templates response status:', removableTemplatesRes.status, removableTemplatesRes.ok);

        const itemsRaw = await itemsRes.json();
        const deliveryRaw = await deliveryRes.json();
        const addonTemplatesRaw = addonTemplatesRes.ok ? await addonTemplatesRes.json() : [];
        const removableTemplatesRaw = removableTemplatesRes.ok ? await removableTemplatesRes.json() : [];

        // Helper function to ensure data is an array (defined inline for useEffect scope)
        const ensureArrayLocal = (data, name) => {
          if (Array.isArray(data)) return data;
          if (data && typeof data === 'object') {
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.items)) return data.items;
            if (Array.isArray(data.results)) return data.results;
            if (Array.isArray(data.restaurants)) return data.restaurants;
            if (Array.isArray(data.templates)) return data.templates;
            if (data.item_id || data.restaurant_id || data.template_id || data.id) return [data];
            console.warn(`⚠️ [ADMIN DEBUG] ${name} is not an array and couldn't be converted:`, data);
          }
          return [];
        };

        const items = ensureArrayLocal(itemsRaw, 'items');
        const delivery = ensureArrayLocal(deliveryRaw, 'delivery');
        const addonTemplates = ensureArrayLocal(addonTemplatesRaw, 'addonTemplates');
        const removableTemplates = ensureArrayLocal(removableTemplatesRaw, 'removableTemplates');

        console.log('✅ [ADMIN DEBUG] Items data:', items);
        console.log('📊 [ADMIN DEBUG] Items type:', typeof items, 'Is Array:', Array.isArray(items), 'Count:', items?.length);
        console.log('✅ [ADMIN DEBUG] Delivery data:', delivery);
        console.log('📊 [ADMIN DEBUG] Delivery type:', typeof delivery, 'Is Array:', Array.isArray(delivery), 'Count:', delivery?.length);
        console.log('✅ [ADMIN DEBUG] Addon Templates data:', addonTemplates);
        console.log('📊 [ADMIN DEBUG] Addon Templates type:', typeof addonTemplates, 'Is Array:', Array.isArray(addonTemplates), 'Count:', addonTemplates?.length);
        console.log('✅ [ADMIN DEBUG] Removable Templates data:', removableTemplates);
        console.log('📊 [ADMIN DEBUG] Removable Templates type:', typeof removableTemplates, 'Is Array:', Array.isArray(removableTemplates), 'Count:', removableTemplates?.length);

        console.log('🎯 [ADMIN DEBUG] Setting state - restaurants:', data);
        console.log('🎯 [ADMIN DEBUG] Setting state - menuItems:', items);
        console.log('🎯 [ADMIN DEBUG] Setting state - deliveryPeople:', delivery);
        console.log('🎯 [ADMIN DEBUG] Setting state - addonTemplates:', addonTemplates);
        console.log('🎯 [ADMIN DEBUG] Setting state - removableTemplates:', removableTemplates);

        // Ensure restaurants data is also an array
        const restaurantsArray = ensureArrayLocal(data, 'restaurants');
        setRestaurants(restaurantsArray); // Store all restaurants for selection
        setMenuItems(items);
        setDeliveryPeople(delivery);
        setAddonTemplates(addonTemplates);
        setAvailableTemplates(addonTemplates);
        setAvailableAddonTemplates(addonTemplates);
        setAvailableRemovableTemplates(removableTemplates);

        console.log('✅ [ADMIN DEBUG] All state updated successfully');

      } catch (error) {
        console.error('❌ [ADMIN DEBUG] Error loading restaurant details:', error);
        console.error('❌ [ADMIN DEBUG] Error stack:', error.stack);
        setError("Failed to load restaurant details");
      } finally {
        setLoading(false);
        console.log('🏁 [ADMIN DEBUG] fetchRestaurant completed');
      }
    };

    fetchRestaurant();
  }, [paramRestaurantId]);

  // Function to create addon template
  const createAddonTemplate = async () => {
    if (!newAddonTemplate.name.trim()) {
      toast.error("Моля въведете име на шаблона");
      return;
    }

    if (!resolvedRestaurantId) {
      toast.error("Няма избран ресторант");
      return;
    }

    // Convert addons array to object format
    const addonsObject = {};
    newAddonTemplate.addons.forEach(addon => {
      if (addon.name.trim() && addon.price) {
        addonsObject[addon.name.trim()] = parseFloat(addon.price);
      }
    });

    if (Object.keys(addonsObject).length === 0) {
      toast.error("Моля добавете поне една добавка");
      return;
    }

    // Determine which restaurants to create the template for
    const targetRestaurants = addToMultipleRestaurants && selectedRestaurantsForCreation.length > 0
      ? selectedRestaurantsForCreation
      : [resolvedRestaurantId];

    try {
      let successCount = 0;
      let failCount = 0;
      let lastTemplateId = null;

      // Loop through each selected restaurant
      for (const restaurantId of targetRestaurants) {
        try {
          const response = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              restaurant_id: restaurantId,
              template: {
                name: newAddonTemplate.name,
                description: newAddonTemplate.description,
                addons: addonsObject,
                is_predefined: false
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            successCount++;
            if (restaurantId === resolvedRestaurantId) {
              lastTemplateId = result.template_id;
            }
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error creating addon template for restaurant ${restaurantId}:`, error);
          failCount++;
        }
      }

      // Show appropriate success/error message
      if (successCount > 0 && failCount === 0) {
        toast.success(`Шаблонът за добавки "${newAddonTemplate.name}" е създаден успешно за ${successCount} ресторант${successCount > 1 ? 'а' : ''}`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Шаблонът е създаден за ${successCount} ресторант${successCount > 1 ? 'а' : ''}, но неуспешен за ${failCount}`);
      } else {
        toast.error('Неуспешно създаване на шаблон');
      }

      setShowCreateAddonTemplate(false);
      setNewAddonTemplate({ name: "", description: "", addons: [{ name: "", price: "" }] });
      setAddonTemplateOpen(false);
      setAddToMultipleRestaurants(false);
      setSelectedRestaurantsForCreation([]);

      // Refresh addon templates for current restaurant
      const templatesRes = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${resolvedRestaurantId}`);
      const templates = templatesRes.ok ? await templatesRes.json() : [];
      setAvailableAddonTemplates(templates);

      // Auto-select the new template if created for current restaurant
      if (lastTemplateId) {
        setSelectedAddonTemplates(prev => [...prev, lastTemplateId]);
      }
    } catch (error) {
      console.error('Error creating addon template:', error);
      toast.error('Грешка при създаване на шаблон за добавки');
    }
  };

  // Function to create removable template
  const createRemovableTemplate = async () => {
    if (!newRemovableTemplate.name.trim()) {
      toast.error("Моля въведете име на шаблона");
      return;
    }

    if (!resolvedRestaurantId) {
      toast.error("Няма избран ресторант");
      return;
    }

    // Filter out empty removables
    const removables = newRemovableTemplate.removables.filter(removable => removable.trim());

    if (removables.length === 0) {
      toast.error("Моля добавете поне един премахваем елемент");
      return;
    }

    // Determine which restaurants to create the template for
    const targetRestaurants = addToMultipleRestaurants && selectedRestaurantsForCreation.length > 0
      ? selectedRestaurantsForCreation
      : [resolvedRestaurantId];

    try {
      let successCount = 0;
      let failCount = 0;
      let lastTemplateId = null;

      // Loop through each selected restaurant
      for (const restaurantId of targetRestaurants) {
        try {
          const response = await fetchWithAdminAuth(`${API_URL}/restaurant/removables/templates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              restaurant_id: restaurantId,
              template: {
                name: newRemovableTemplate.name,
                description: newRemovableTemplate.description,
                removables: removables,
                is_predefined: false
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            successCount++;
            if (restaurantId === resolvedRestaurantId) {
              lastTemplateId = result.template_id;
            }
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error creating removable template for restaurant ${restaurantId}:`, error);
          failCount++;
        }
      }

      // Show appropriate success/error message
      if (successCount > 0 && failCount === 0) {
        toast.success(`Шаблонът за премахвания "${newRemovableTemplate.name}" е създаден успешно за ${successCount} ресторант${successCount > 1 ? 'а' : ''}`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`Шаблонът е създаден за ${successCount} ресторант${successCount > 1 ? 'а' : ''}, но неуспешен за ${failCount}`);
      } else {
        toast.error('Неуспешно създаване на шаблон');
      }

      setShowCreateRemovableTemplate(false);
      setNewRemovableTemplate({ name: "", description: "", removables: [""] });
      setRemovableTemplateOpen(false);
      setAddToMultipleRestaurants(false);
      setSelectedRestaurantsForCreation([]);

      // Refresh removable templates for current restaurant
      const templatesRes = await fetchWithAdminAuth(`${API_URL}/restaurant/removables/templates/${resolvedRestaurantId}`);
      const templates = templatesRes.ok ? await templatesRes.json() : [];
      setAvailableRemovableTemplates(templates);

      // Auto-select the new template if created for current restaurant
      if (lastTemplateId) {
        setSelectedRemovableTemplates(prev => [...prev, lastTemplateId]);
      }
    } catch (error) {
      console.error('Error creating removable template:', error);
      toast.error('Грешка при създаване на шаблон за премахвания');
    }
  };

  // Function to add addon input field
  const addAddonField = () => {
    setNewAddonTemplate(prev => ({
      ...prev,
      addons: [...prev.addons, { name: "", price: "" }]
    }));
  };

  // Function to remove addon input field
  const removeAddonField = (index) => {
    setNewAddonTemplate(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  // Function to add removable input field
  const addRemovableField = () => {
    setNewRemovableTemplate(prev => ({
      ...prev,
      removables: [...prev.removables, ""]
    }));
  };

  // Function to remove removable input field
  const removeRemovableField = (index) => {
    setNewRemovableTemplate(prev => ({
      ...prev,
      removables: prev.removables.filter((_, i) => i !== index)
    }));
  };

  // Function to parse and import addon text
  const handleImportAddons = () => {
    if (!importText.trim()) {
      toast.error("Моля въведете текст за импорт");
      return;
    }

    try {
      // Split by lines and filter empty lines
      let lines = importText.split(/\r?\n/).filter(line => line.trim());

      // Remove header if it starts with "Избери добавки:"
      if (lines.length > 0 && lines[0].trim().startsWith("Избери добавки:")) {
        lines = lines.slice(1);
      }

      // Parse each line
      const parsedAddons = [];
      const regex = /^(.*?)\s*\((.*?)\)\s*\(([\d,]+)\s*лв\.([\d,]+)\s*€\)$/;

      for (const line of lines) {
        const match = line.trim().match(regex);
        if (match) {
          const name = match[1].trim();
          const weight = match[2].trim();
          const priceBGN = match[3].replace(',', '.');

          // Combine name and weight
          const fullName = `${name} (${weight})`;

          parsedAddons.push({
            name: fullName,
            price: priceBGN
          });
        }
      }

      if (parsedAddons.length === 0) {
        toast.error("Не са открити валидни добавки в текста");
        return;
      }

      // Append to existing addons
      setNewAddonTemplate(prev => ({
        ...prev,
        addons: [...prev.addons.filter(a => a.name || a.price), ...parsedAddons]
      }));

      toast.success(`Импортирани ${parsedAddons.length} добавки`);
      setShowImportAddonDialog(false);
      setImportText("");

    } catch (error) {
      console.error('Error importing addons:', error);
      toast.error("Грешка при импортиране на добавки");
    }
  };

  // Function to parse and import removable text
  const handleImportRemovables = () => {
    if (!importText.trim()) {
      toast.error("Моля въведете текст за импорт");
      return;
    }

    try {
      // Split by lines and filter empty lines
      let lines = importText.split(/\r?\n/).filter(line => line.trim());

      // Remove header if it starts with "Без:"
      if (lines.length > 0 && lines[0].trim().startsWith("Без:")) {
        lines = lines.slice(1);
      }

      if (lines.length === 0) {
        toast.error("Не са открити валидни елементи в текста");
        return;
      }

      // Append to existing removables
      setNewRemovableTemplate(prev => ({
        ...prev,
        removables: [...prev.removables.filter(r => r.trim()), ...lines.map(l => l.trim())]
      }));

      toast.success(`Импортирани ${lines.length} премахваеми елемента`);
      setShowImportRemovableDialog(false);
      setImportText("");

    } catch (error) {
      console.error('Error importing removables:', error);
      toast.error("Грешка при импортиране на премахваеми елементи");
    }
  };

  // Keyboard shortcut for import dialogs
  useEffect(() => {
    const down = (e) => {
      // Ctrl+I or Cmd+I to open import dialog
      if (e.key === "i" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        if (showCreateAddonTemplate) {
          setShowImportAddonDialog(true);
        } else if (showCreateRemovableTemplate) {
          setShowImportRemovableDialog(true);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [showCreateAddonTemplate, showCreateRemovableTemplate]);

  // Category translation helper
  const translateCategory = (categoryBulgarian) => {
    const categoryMap = {
      "Американски палачинки": "sweet-american",
      "Американски мини палачинки": "sweet-american-mini",
      "Класически палачинки": "sweet-classic",
      "Класически палачинки солени": "sour-classic",
      "Американски палачинки солени": "sour-american",
      "Специални": "special",
      "Deluxe Box": "deluxe_box",
      "Десерти": "desserts",
      "Напитки": "drinks",
      "Промоция": "promo"
    };

    return categoryMap[categoryBulgarian] || null;
  };

  // Function to parse full item from text
  const handleImportFullItem = async () => {
    if (!importItemText.trim()) {
      toast.error("Моля въведете текст за импорт");
      return;
    }

    try {
      const lines = importItemText.trim().split('\n').map(line => line.trim()).filter(line => line);

      // Parse item name (first line)
      const itemNameMatch = lines[0].match(/^(.+?)\s*\((\d+)г\)$/);
      if (!itemNameMatch) {
        toast.error("Невалиден формат на името. Очакван формат: 'Име (грамаж)'");
        return;
      }
      const itemName = itemNameMatch[1].trim();

      // Parse category (second line)
      const categoryLine = lines.find(line => line.startsWith("Категория:"));
      if (!categoryLine) {
        toast.error("Липсва категория. Моля добавете ред 'Категория: ...'");
        return;
      }
      const categoryBulgarian = categoryLine.replace("Категория:", "").trim();
      const itemType = translateCategory(categoryBulgarian);

      if (!itemType) {
        toast.warning(`Непозната категория: ${categoryBulgarian}. Ще се използва 'sweet_pancake' по подразбиране.`);
      }

      // Parse price (third line - BGN price)
      const priceLineIndex = lines.findIndex(line => line.match(/^\d+[,.]?\d*\s*лв\.?$/));
      if (priceLineIndex === -1) {
        toast.error("Липсва цена. Моля добавете цена във формат '13,40 лв.'");
        return;
      }
      const priceText = lines[priceLineIndex].replace(/лв\.?/, "").trim().replace(",", ".");
      const price = parseFloat(priceText);

      // Parse removables (lines after "Без:")
      let removables = [];
      const bezIndex = lines.findIndex(line => line === "Без:");
      if (bezIndex !== -1) {
        const nextSectionIndex = lines.findIndex((line, idx) => idx > bezIndex && (line.includes("Избери") || line.includes("Категория")));
        const endIndex = nextSectionIndex !== -1 ? nextSectionIndex : lines.length;
        removables = lines.slice(bezIndex + 1, endIndex).filter(line => line && !line.includes("В наличност"));
      }

      // Parse addons (lines after "Избери добавки:")
      let addons = [];
      const addonsIndex = lines.findIndex(line => line.includes("Избери добавки"));
      if (addonsIndex !== -1) {
        const addonLines = lines.slice(addonsIndex + 1);
        addons = addonLines.map(line => {
          const match = line.match(/^(.+?)\s*\((\d+)г\)\s*\((\d+[,.]?\d*)\s*лв\.(\d+[,.]?\d*)\s*€\)$/);
          if (match) {
            return {
              name: match[1].trim(),
              price: parseFloat(match[3].replace(",", "."))
            };
          }
          return null;
        }).filter(addon => addon !== null);
      }

      const parsedData = {
        name: itemName,
        item_type: itemType || "sweet_pancake",
        price: price,
        addons: addons,
        removables: removables
      };

      // Create item directly (templates will be created as part of the process)
      await createItemFromParsedData(parsedData);

    } catch (error) {
      console.error("Error parsing item:", error);
      toast.error("Грешка при парсиране на текста");
    }
  };

  // Function to create item from parsed data
  const createItemFromParsedData = async (data) => {
    try {
      setIsSubmitting(true);

      let addonTemplateId = null;
      let removableTemplateId = null;

      // Create addon template if addons exist
      if (data.addons && data.addons.length > 0) {
        const addonsObject = {};
        data.addons.forEach(addon => {
          addonsObject[addon.name] = addon.price;
        });

        const addonTemplateResponse = await fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurant_id: resolvedRestaurantId,
            name: `${data.name} - addon`,
            description: "Auto-created from import",
            addons: addonsObject
          })
        });

        const addonTemplateData = await addonTemplateResponse.json();
        addonTemplateId = addonTemplateData.template_id;
        toast.success(`Шаблон за добавки създаден: ${data.name} - addon`);
      }

      // Create removable template if removables exist
      if (data.removables && data.removables.length > 0) {
        const removableTemplateResponse = await fetchWithAdminAuth(`${API_URL}/restaurant/removable-templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurant_id: resolvedRestaurantId,
            name: `${data.name} - removable`,
            description: "Auto-created from import",
            removables: data.removables
          })
        });

        const removableTemplateData = await removableTemplateResponse.json();
        removableTemplateId = removableTemplateData.template_id;
        toast.success(`Шаблон за премахвания създаден: ${data.name} - removable`);
      }

      // Create the item
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("price", data.price);
      formData.append("item_type", data.item_type);
      formData.append("restaurant_id", resolvedRestaurantId);
      formData.append("description", ""); // Empty description

      // Add template IDs if they were created
      if (addonTemplateId) {
        formData.append("addon_template_ids", JSON.stringify([addonTemplateId]));
      }
      if (removableTemplateId) {
        formData.append("removable_template_ids", JSON.stringify([removableTemplateId]));
      }

      await fetchWithAdminAuth(`${API_URL}/restaurant/menu-items`, {
        method: "POST",
        body: formData
      });

      toast.success(`Продуктът "${data.name}" беше създаден успешно!`);
      setShowImportItemDialog(false);
      setImportItemText("");
      setParsedItemData(null);
      await refreshData();

    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Грешка при създаване на продукта");
    } finally {
      setIsSubmitting(false);
    }
  };



  // Remove unused functions since all data is fetched in main useEffect
  // const fetchAddonTemplates and fetchAvailableAddonTemplates removed to avoid unused function warnings

  const handleEditItem = (item) => {
    setModalMode("edit");
    // Handle both new object format and old array format
    let addonTemplates = [];
    if (item.addon_template_ids && Array.isArray(item.addon_template_ids)) {
      addonTemplates = item.addon_template_ids;
    } else if (item[1] && Array.isArray(item[1])) {
      addonTemplates = item[1];
    }

    // Set selected templates for editing
    setSelectedAddonTemplates(item.addon_template_ids || []);
    setSelectedRemovableTemplates(item.removable_template_ids || []);

    setItemForm({
      id: item.item_id || item[0],
      name: item.name || item[6],
      description: item.description || item[4],
      image: item.image_url || item[5],
      price: item.price || item[7],
      item_type: item.item_type || "sweet_pancake",
      addon_templates: addonTemplates
    });
    setShowItemModal(true);
  };
  const handleDeleteItem = (item) => {
    setDeletingItem(item);
  };
  const handleAddItem = () => {
    setModalMode("add");
    setItemForm({ id: "", name: "", description: "", image: "", price: "", item_type: "sweet-american", addon_templates: [] });
    setSelectedAddonTemplates([]);
    setSelectedRemovableTemplates([]);
    setShowItemModal(true);
  };

  // Submit add/edit item
  const handleItemFormSubmit = async (e) => {
    e.preventDefault();

    if (modalMode === "add") {
      // Determine which restaurants to create the item for
      const targetRestaurants = addToMultipleRestaurants && selectedRestaurantsForCreation.length > 0
        ? selectedRestaurantsForCreation
        : [restaurant.restaurant_id];

      let successCount = 0;
      let failCount = 0;

      try {
        // Loop through each selected restaurant
        for (const restaurantId of targetRestaurants) {
          try {
            const formData = new FormData();
            
            // Use template-based API for new items
            const itemData = {
              restaurant_id: restaurantId,
              item: {
                name: itemForm.name,
                description: itemForm.description,
                item_type: itemForm.item_type,
                price: parseFloat(itemForm.price),
                addons: {}, // Custom addons can be added here if needed
                addon_template_ids: selectedAddonTemplates,
                removables: [], // Custom removables can be added here if needed
                removable_template_ids: selectedRemovableTemplates
              }
            };

            formData.append("data", JSON.stringify(itemData));

            if (fileInputRef.current && fileInputRef.current.files[0]) {
              formData.append("file", fileInputRef.current.files[0]);
            }

            const response = await fetchWithAdminAuth(`${API_URL}/restaurant/items/template-based`, {
              method: "POST",
              body: formData,
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            console.error(`Error creating item for restaurant ${restaurantId}:`, error);
            failCount++;
          }
        }

        // Show appropriate success/error message
        if (successCount > 0 && failCount === 0) {
          toast.success(`Продуктът "${itemForm.name}" е създаден успешно за ${successCount} ресторант${successCount > 1 ? 'а' : ''}`);
        } else if (successCount > 0 && failCount > 0) {
          toast.warning(`Продуктът е създаден за ${successCount} ресторант${successCount > 1 ? 'а' : ''}, но неуспешен за ${failCount}`);
        } else {
          toast.error("Неуспешно създаване на продукт");
        }

        // Refresh items after successful save
        refreshData();
        setShowItemModal(false);
        setSelectedAddonTemplates([]);
        setSelectedRemovableTemplates([]);
        setAddToMultipleRestaurants(false);
        setSelectedRestaurantsForCreation([]);
      } catch (error) {
        console.error('Error creating item:', error);
        toast.error("Неуспешно създаване на продукт");
      }
    } else {
      const formData = new FormData();
      // For edit, use the existing API
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

      try {
        await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
          method: "PUT",
          body: formData,
        });
        toast.success(`Продуктът "${itemForm.name}" е обновен успешно`);
        // Refresh items after successful save
        refreshData();
        setShowItemModal(false);
      } catch (error) {
        console.error('Error updating item:', error);
        toast.error("Неуспешно обновяване на продукт");
      }
    }
  };

  // Confirm delete
  const confirmDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      const itemId = deletingItem.item_id || deletingItem[0];
      await fetchWithAdminAuth(`${API_URL}/restaurant/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      setMenuItems(menuItems.filter(i => (i.item_id || i[0]) !== itemId));
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
      setDeliveryPeople(ensureArray(data, 'deliveryPeople'));
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
  const handleUnassignDelivery = async (person) => {
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

  // Remove unused fetchMenuItems function since refreshData handles this now

  // Helper function to ensure data is an array
  const ensureArray = (data, name) => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.results)) return data.results;
      if (Array.isArray(data.restaurants)) return data.restaurants;
      if (Array.isArray(data.templates)) return data.templates;
      if (data.item_id || data.restaurant_id || data.template_id || data.id) return [data];
      console.warn(`⚠️ [ADMIN DEBUG] ${name} is not an array and couldn't be converted:`, data);
    }
    return [];
  };

  // Refresh data after operations
  const refreshData = useCallback(async () => {
    if (!resolvedRestaurantId) return;

    try {
      const [itemsRes, templatesRes] = await Promise.all([
        fetchWithAdminAuth(`${API_URL}/restaurant/${resolvedRestaurantId}/items`),
        fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${resolvedRestaurantId}`)
      ]);

      const itemsRaw = await itemsRes.json();
      const templatesRaw = templatesRes.ok ? await templatesRes.json() : [];

      setMenuItems(ensureArray(itemsRaw, 'items'));
      setAvailableTemplates(ensureArray(templatesRaw, 'templates'));
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

    // Validate that itemId is defined
    if (!itemId) {
      console.error('Item ID is required but was undefined');
      toast.error('Item ID is missing. Please try again.');
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

    // Validate that itemId is defined
    if (!itemId) {
      console.error('Item ID is required but was undefined');
      toast.error('Item ID is missing. Please try again.');
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
    let templateIds = [];

    // Handle new object format
    if (item.addon_template_ids && Array.isArray(item.addon_template_ids)) {
      templateIds = [...templateIds, ...item.addon_template_ids];
    }
    if (item.removable_template_ids && Array.isArray(item.removable_template_ids)) {
      templateIds = [...templateIds, ...item.removable_template_ids];
    }

    // Handle old array format (fallback)
    if (templateIds.length === 0 && item[1] && Array.isArray(item[1])) {
      templateIds = item[1];
    }

    if (!templateIds || templateIds.length === 0) return [];

    return templateIds.map(id => {
      // Check both addon and removable templates
      const addonTemplate = availableAddonTemplates.find(t => t.template_id === id);
      const removableTemplate = availableRemovableTemplates.find(t => t.template_id === id);
      const fallbackTemplate = availableTemplates && availableTemplates.find(t => t.template_id === id);

      const template = addonTemplate || removableTemplate || fallbackTemplate;
      return template ? template.name : `Template ${id.split('-')[0]}`;
    });
  };

  // Handle restaurant selection change
  const handleRestaurantChange = async (selectedRestaurantId) => {
    setLoading(true);
    try {
      const selectedRestaurant = restaurants.find(r => r.restaurant_id === selectedRestaurantId);
      if (!selectedRestaurant) {
        setError("Selected restaurant not found");
        setLoading(false);
        return;
      }

      setRestaurant(selectedRestaurant);
      setResolvedRestaurantId(selectedRestaurantId);

      // Fetch data for the selected restaurant
      const [itemsRes, deliveryRes, addonTemplatesRes, removableTemplatesRes] = await Promise.all([
        fetchWithAdminAuth(`${API_URL}/restaurant/${selectedRestaurantId}/items`),
        fetchWithAdminAuth(`${API_URL}/restaurant/delivery-people`),
        fetchWithAdminAuth(`${API_URL}/restaurant/addon-templates/${selectedRestaurantId}`),
        fetchWithAdminAuth(`${API_URL}/restaurant/removables/templates/${selectedRestaurantId}`)
      ]);

      const itemsRaw = await itemsRes.json();
      const deliveryRaw = await deliveryRes.json();
      const addonTemplatesRaw = addonTemplatesRes.ok ? await addonTemplatesRes.json() : [];
      const removableTemplatesRaw = removableTemplatesRes.ok ? await removableTemplatesRes.json() : [];

      const items = ensureArray(itemsRaw, 'items');
      const delivery = ensureArray(deliveryRaw, 'delivery');
      const addonTemplatesArr = ensureArray(addonTemplatesRaw, 'addonTemplates');
      const removableTemplatesArr = ensureArray(removableTemplatesRaw, 'removableTemplates');

      setMenuItems(items);
      setDeliveryPeople(delivery);
      setAddonTemplates(addonTemplatesArr);
      setAvailableTemplates(addonTemplatesArr);
      setAvailableAddonTemplates(addonTemplatesArr);
      setAvailableRemovableTemplates(removableTemplatesArr);

    } catch (error) {
      setError("Failed to load restaurant data");
      console.error('Error loading restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove the extra useEffect that was causing duplicate API calls
  // All data is now fetched in the main useEffect above

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!resolvedRestaurantId) return <div className="p-8 text-red-500">No restaurant ID found. Please access this page from a valid restaurant context.</div>;
  if (!restaurant) return <div className="p-8">Restaurant not found</div>;

  const handleRestaurantCheckboxChangeForHours = (restaurantId, checked) => {
    if (checked) {
      setSelectedRestaurantsForHours(prev => [...prev, restaurantId]);
    } else {
      setSelectedRestaurantsForHours(prev => prev.filter(id => id !== restaurantId));
    }
  };

  const handleSelectAllRestaurantsForHours = (checked) => {
    if (checked) {
      setSelectedRestaurantsForHours(restaurants.map(r => r.restaurant_id));
    } else {
      setSelectedRestaurantsForHours([]);
    }
  };

  const handleWorkingHoursChange = (day, value) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handleUpdateWorkingHours = async () => {
    if (selectedRestaurantsForHours.length === 0) {
      toast.error('Please select at least one restaurant');
      return;
    }

    setUpdatingWorkingHours(true);
    let successCount = 0;
    let errorCount = 0;

    for (const restaurantId of selectedRestaurantsForHours) {
      try {
        await updateWorkingHours(restaurantId, workingHours);
        successCount++;
      } catch (error) {
        console.error(`Failed to update working hours for restaurant ${restaurantId}:`, error);
        errorCount++;
      }
    }

    setUpdatingWorkingHours(false);

    if (successCount > 0) {
      toast.success(`Successfully updated working hours for ${successCount} restaurant(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} restaurant(s)`);
    }

    if (errorCount === 0) {
      setIsWorkingHoursDialogOpen(false);
      setSelectedRestaurantsForHours([]);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full px-4 py-4 md:py-8">
        {/* Add/Edit Item Dialog */}
        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{modalMode === "add" ? "Добавяне на продукт" : "Редактиране на продукт"}</span>
                {/* Temporarily hidden - will be implemented later */}
                {/* {modalMode === "add" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportItemDialog(true)}
                  className="ml-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Импорт от текст
                </Button>
              )} */}
              </DialogTitle>
              <DialogDescription>
                {modalMode === "add"
                  ? "Попълнете детайлите за да добавите нов продукт в менюто."
                  : "Редактирайте детайлите на продукта."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleItemFormSubmit}>
              <div className="grid gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Основна информация</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="name">Име на продукта</Label>
                      <Input
                        id="name"
                        type="text"
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        required
                        placeholder="Напр. Класическа палачинка"
                      />
                    </div>
                    <div>
                      <Label htmlFor="item_type">Тип продукт</Label>
                      <Select
                        value={itemForm.item_type}
                        onValueChange={(value) => setItemForm({ ...itemForm, item_type: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете тип..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sweet-american">Sweet American Pancake</SelectItem>
                          <SelectItem value="sweet-american-mini">Sweet American Mini Pancake</SelectItem>
                          <SelectItem value="sweet-classic">Sweet Classic Pancake</SelectItem>
                          <SelectItem value="sour-classic">Sour Classic Pancake</SelectItem>
                          <SelectItem value="sour-american">Sour American Pancake</SelectItem>
                          <SelectItem value="special">Special</SelectItem>
                          <SelectItem value="deluxe_box">Deluxe Box</SelectItem>
                          <SelectItem value="desserts">Desserts</SelectItem>
                          <SelectItem value="drinks">Drinks</SelectItem>
                          <SelectItem value="promo">Promo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="price">Цена (лв./€)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      placeholder="Кратко описание на продукта..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Снимка</Label>
                    <Input
                      id="image"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          setItemForm({ ...itemForm, image: e.target.files[0].name });
                        }
                      }}
                    />
                    {itemForm.image && (
                      <p className="mt-2 text-sm text-gray-500">{itemForm.image}</p>
                    )}
                  </div>
                </div>

                {/* Template Selection Section */}
                {modalMode === "add" && (
                  <div className="space-y-8">
                    {/* Addon Templates */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Шаблони за добавки</h3>
                      <div className="space-y-2">
                        <Label>Изберете шаблони за добавки</Label>
                        <div className="flex gap-2">
                          <Popover open={addonTemplateOpen} onOpenChange={setAddonTemplateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={addonTemplateOpen}
                                className="flex-1 justify-between"
                              >
                                {selectedAddonTemplates.length > 0
                                  ? `Избрани ${selectedAddonTemplates.length} шаблона`
                                  : "Изберете шаблон за добавки..."}
                                <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Търсете шаблон..." />
                                <CommandList>
                                  <CommandEmpty>Не са намерени шаблони.</CommandEmpty>
                                  <CommandGroup>
                                    {availableAddonTemplates.map((template) => (
                                      <CommandItem
                                        key={template.id || template.template_id}
                                        value={template.name}
                                        onSelect={() => {
                                          const templateId = template.id || template.template_id;
                                          setSelectedAddonTemplates(prev =>
                                            prev.includes(templateId)
                                              ? prev.filter(id => id !== templateId)
                                              : [...prev, templateId]
                                          );
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedAddonTemplates.includes(template.id || template.template_id)
                                              ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {template.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setNewAddonTemplate({
                                    name: itemForm.name ? `${itemForm.name} - addon` : "",
                                    description: "",
                                    addons: [{ name: "", price: "" }]
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[90vh]">
                              <DrawerHeader>
                                <DrawerTitle>Създаване на нов шаблон за добавки</DrawerTitle>
                                <DrawerDescription>
                                  Създайте нов шаблон който може да бъде приложен към продукти.
                                  <kbd className="ml-2 bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                                    <span className="text-xs">⌘</span>I
                                  </kbd> за импорт
                                </DrawerDescription>
                              </DrawerHeader>
                              <div className="px-4 pb-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                                <div>
                                  <Label htmlFor="template-name">Име на шаблона</Label>
                                  <Input
                                    id="template-name"
                                    value={newAddonTemplate.name}
                                    onChange={(e) => setNewAddonTemplate({ ...newAddonTemplate, name: e.target.value })}
                                    placeholder="Напр. Сладки добавки"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="template-description">Описание</Label>
                                  <Textarea
                                    id="template-description"
                                    value={newAddonTemplate.description}
                                    onChange={(e) => setNewAddonTemplate({ ...newAddonTemplate, description: e.target.value })}
                                    placeholder="Кратко описание на шаблона..."
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <Label>Добавки</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowImportAddonDialog(true)}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Импорт от текст
                                    </Button>
                                  </div>
                                  {newAddonTemplate.addons.map((addon, index) => (
                                    <div key={index} className="flex gap-2 mt-2">
                                      <Input
                                        placeholder="Име на добавката"
                                        value={addon.name}
                                        onChange={(e) => {
                                          const newAddons = [...newAddonTemplate.addons];
                                          newAddons[index].name = e.target.value;
                                          setNewAddonTemplate({ ...newAddonTemplate, addons: newAddons });
                                        }}
                                      />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Цена"
                                        value={addon.price}
                                        onChange={(e) => {
                                          const newAddons = [...newAddonTemplate.addons];
                                          newAddons[index].price = e.target.value;
                                          setNewAddonTemplate({ ...newAddonTemplate, addons: newAddons });
                                        }}
                                      />
                                      {newAddonTemplate.addons.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          onClick={() => removeAddonField(index)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addAddonField}
                                    className="mt-2"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добави добавка
                                  </Button>
                                </div>

                                {/* Multi-restaurant selection */}
                                <div className="space-y-3 border-t pt-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="multi-restaurant-addon"
                                      checked={addToMultipleRestaurants}
                                      onCheckedChange={setAddToMultipleRestaurants}
                                    />
                                    <Label htmlFor="multi-restaurant-addon" className="text-sm font-medium">
                                      Добави към други ресторанти
                                    </Label>
                                  </div>
                                  {addToMultipleRestaurants && (
                                    <div className="ml-6 space-y-2">
                                      <Label className="text-sm text-muted-foreground">Избери ресторанти:</Label>
                                      <div className="space-y-2">
                                        {restaurants.map((r) => (
                                          <div key={r.restaurant_id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`restaurant-${r.restaurant_id}`}
                                              checked={selectedRestaurantsForCreation.includes(r.restaurant_id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedRestaurantsForCreation(prev => [...prev, r.restaurant_id]);
                                                } else {
                                                  setSelectedRestaurantsForCreation(prev => prev.filter(id => id !== r.restaurant_id));
                                                }
                                              }}
                                            />
                                            <Label htmlFor={`restaurant-${r.restaurant_id}`} className="text-sm cursor-pointer">
                                              {r.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <DrawerFooter>
                                <Button onClick={createAddonTemplate}>Създай шаблон</Button>
                                <DrawerClose asChild>
                                  <Button variant="outline">Отказ</Button>
                                </DrawerClose>
                              </DrawerFooter>
                            </DrawerContent>
                          </Drawer>
                        </div>
                        {selectedAddonTemplates.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedAddonTemplates.map(templateId => {
                              const template = availableAddonTemplates.find(t => (t.id || t.template_id) === templateId);
                              return template ? (
                                <Badge key={templateId} variant="secondary">
                                  {template.name}
                                  <button
                                    onClick={() => setSelectedAddonTemplates(prev => prev.filter(id => id !== templateId))}
                                    className="ml-2 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Removable Templates */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Шаблони за премахвания</h3>
                      <div className="space-y-2">
                        <Label>Изберете шаблони за премахвания</Label>
                        <div className="flex gap-2">
                          <Popover open={removableTemplateOpen} onOpenChange={setRemovableTemplateOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={removableTemplateOpen}
                                className="flex-1 justify-between"
                              >
                                {selectedRemovableTemplates.length > 0
                                  ? `Избрани ${selectedRemovableTemplates.length} шаблона`
                                  : "Изберете шаблон за премахвания..."}
                                <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                              <Command>
                                <CommandInput placeholder="Търсете шаблон..." />
                                <CommandList>
                                  <CommandEmpty>Не са намерени шаблони.</CommandEmpty>
                                  <CommandGroup>
                                    {availableRemovableTemplates.map((template) => (
                                      <CommandItem
                                        key={template.id || template.template_id}
                                        value={template.name}
                                        onSelect={() => {
                                          const templateId = template.id || template.template_id;
                                          setSelectedRemovableTemplates(prev =>
                                            prev.includes(templateId)
                                              ? prev.filter(id => id !== templateId)
                                              : [...prev, templateId]
                                          );
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedRemovableTemplates.includes(template.id || template.template_id)
                                              ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {template.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <Drawer>
                            <DrawerTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  setNewRemovableTemplate({
                                    name: itemForm.name ? `${itemForm.name} - removable` : "",
                                    description: "",
                                    removables: [""]
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DrawerTrigger>
                            <DrawerContent className="max-h-[90vh]">
                              <DrawerHeader>
                                <DrawerTitle>Създаване на нов шаблон за премахвания</DrawerTitle>
                                <DrawerDescription>
                                  Създайте нов шаблон за елементи които могат да бъдат премахнати от продукти.
                                  <kbd className="ml-2 bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
                                    <span className="text-xs">⌘</span>I
                                  </kbd> за импорт
                                </DrawerDescription>
                              </DrawerHeader>
                              <div className="px-4 pb-4 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                                <div>
                                  <Label htmlFor="removable-template-name">Име на шаблона</Label>
                                  <Input
                                    id="removable-template-name"
                                    value={newRemovableTemplate.name}
                                    onChange={(e) => setNewRemovableTemplate({ ...newRemovableTemplate, name: e.target.value })}
                                    placeholder="Напр. Алергени"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="removable-template-description">Описание</Label>
                                  <Textarea
                                    id="removable-template-description"
                                    value={newRemovableTemplate.description}
                                    onChange={(e) => setNewRemovableTemplate({ ...newRemovableTemplate, description: e.target.value })}
                                    placeholder="Кратко описание на шаблона..."
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <Label>Премахваеми елементи</Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowImportRemovableDialog(true)}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Импорт от текст
                                    </Button>
                                  </div>
                                  {newRemovableTemplate.removables.map((removable, index) => (
                                    <div key={index} className="flex gap-2 mt-2">
                                      <Input
                                        placeholder="Име на премахваемия елемент"
                                        value={removable}
                                        onChange={(e) => {
                                          const newRemovables = [...newRemovableTemplate.removables];
                                          newRemovables[index] = e.target.value;
                                          setNewRemovableTemplate({ ...newRemovableTemplate, removables: newRemovables });
                                        }}
                                      />
                                      {newRemovableTemplate.removables.length > 1 && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          onClick={() => removeRemovableField(index)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addRemovableField}
                                    className="mt-2"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добави елемент
                                  </Button>
                                </div>

                                {/* Multi-restaurant selection */}
                                <div className="space-y-3 border-t pt-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox 
                                      id="multi-restaurant-removable"
                                      checked={addToMultipleRestaurants}
                                      onCheckedChange={setAddToMultipleRestaurants}
                                    />
                                    <Label htmlFor="multi-restaurant-removable" className="text-sm font-medium">
                                      Добави към други ресторанти
                                    </Label>
                                  </div>
                                  {addToMultipleRestaurants && (
                                    <div className="ml-6 space-y-2">
                                      <Label className="text-sm text-muted-foreground">Избери ресторанти:</Label>
                                      <div className="space-y-2">
                                        {restaurants.map((r) => (
                                          <div key={r.restaurant_id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`restaurant-removable-${r.restaurant_id}`}
                                              checked={selectedRestaurantsForCreation.includes(r.restaurant_id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedRestaurantsForCreation(prev => [...prev, r.restaurant_id]);
                                                } else {
                                                  setSelectedRestaurantsForCreation(prev => prev.filter(id => id !== r.restaurant_id));
                                                }
                                              }}
                                            />
                                            <Label htmlFor={`restaurant-removable-${r.restaurant_id}`} className="text-sm cursor-pointer">
                                              {r.name}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <DrawerFooter>
                                <Button onClick={createRemovableTemplate}>Създай шаблон</Button>
                                <DrawerClose asChild>
                                  <Button variant="outline">Отказ</Button>
                                </DrawerClose>
                              </DrawerFooter>
                            </DrawerContent>
                          </Drawer>
                        </div>
                        {selectedRemovableTemplates.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedRemovableTemplates.map(templateId => {
                              const template = availableRemovableTemplates.find(t => (t.id || t.template_id) === templateId);
                              return template ? (
                                <Badge key={templateId} variant="secondary">
                                  {template.name}
                                  <button
                                    onClick={() => setSelectedRemovableTemplates(prev => prev.filter(id => id !== templateId))}
                                    className="ml-2 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-restaurant selection for items */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="multi-restaurant-item"
                          checked={addToMultipleRestaurants}
                          onCheckedChange={setAddToMultipleRestaurants}
                        />
                        <Label htmlFor="multi-restaurant-item" className="text-sm font-medium">
                          Добави към други ресторанти
                        </Label>
                      </div>
                      {addToMultipleRestaurants && (
                        <div className="ml-6 space-y-2">
                          <Label className="text-sm text-muted-foreground">Избери ресторанти:</Label>
                          <div className="space-y-2">
                            {restaurants.map((r) => (
                              <div key={r.restaurant_id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`restaurant-item-${r.restaurant_id}`}
                                  checked={selectedRestaurantsForCreation.includes(r.restaurant_id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRestaurantsForCreation(prev => [...prev, r.restaurant_id]);
                                    } else {
                                      setSelectedRestaurantsForCreation(prev => prev.filter(id => id !== r.restaurant_id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`restaurant-item-${r.restaurant_id}`} className="text-sm cursor-pointer">
                                  {r.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  variant="outline"
                  className="mr-2"
                >
                  Отказ
                </Button>
                <Button type="submit">
                  {modalMode === "add" ? "Създай продукт" : "Запази промените"}
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

        {/* Restaurant Selector */}
        {restaurants.length > 1 && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Избери ресторант</CardTitle>
              <CardDescription>Изберете ресторант за управление</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={resolvedRestaurantId || ""} onValueChange={handleRestaurantChange}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Изберете ресторант..." />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((rest) => (
                    <SelectItem key={rest.restaurant_id} value={rest.restaurant_id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{rest.name}</span>
                        <span
                          className="text-sm text-gray-500 hover:text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInMaps(rest.address, rest.city);
                          }}
                        >
                          {rest.address}, {rest.city}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Restaurant Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{restaurant.name}</CardTitle>
            <CardDescription
              className="hover:text-blue-600 hover:underline cursor-pointer"
              onClick={() => openInMaps(restaurant.address, restaurant.city)}
            >
              {restaurant.address}, {restaurant.city}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold">Menu Items</h3>
                <p className="text-sm text-gray-500">{menuItems.length} items</p>
              </div>
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsWorkingHoursDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Working Hours
                </Button>
                <Button onClick={handleAddItem}>
                  Add Menu Item
                </Button>
              </div>
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
                <Card key={item.item_id || item[0]} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name || item[6]}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description || item[4]}</p>
                        <p className="text-lg font-semibold text-gray-900 mt-2">{item.price || item[7]} лв./€</p>
                      </div>
                    </div>

                    {/* Templates Section */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Templates</label>
                      <div className="mt-2">
                        {((item.addon_template_ids && item.addon_template_ids.length > 0) || (item.removable_template_ids && item.removable_template_ids.length > 0) || (item[1] && Array.isArray(item[1]) && item[1].length > 0)) ? (
                          <div className="flex flex-wrap gap-1">
                            {getAppliedTemplateNames(item).map((templateName, idx) => {
                              const templateIds = item.addon_template_ids || item.removable_template_ids || item[1] || [];
                              const templateId = templateIds[idx];
                              return (
                                <Badge key={templateId} variant="outline" className="text-xs">
                                  {templateName}
                                  <button
                                    onClick={() => removeTemplateFromItem(item.item_id || item[0], templateId)}
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
            <div className="hidden md:block">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">
                      Templates
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.item_id || item[0]}>
                      <td className="px-4 py-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {item.name || item[6]}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{item.name || item[6]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-4">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-sm text-gray-500 truncate max-w-[300px]">
                              {item.description || item[4]}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{item.description || item[4]}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.price || item[7]} лв./€</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-500">
                          {((item.addon_template_ids && item.addon_template_ids.length > 0) || (item.removable_template_ids && item.removable_template_ids.length > 0) || (item[1] && Array.isArray(item[1]) && item[1].length > 0)) ? (
                            <div className="flex flex-wrap gap-1">
                              {getAppliedTemplateNames(item).map((templateName, idx) => {
                                const templateIds = item.addon_template_ids || item.removable_template_ids || item[1] || [];
                                const templateId = templateIds[idx];
                                return (
                                  <Tooltip key={templateId}>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-xs max-w-[100px] truncate">
                                        <span className="truncate">{templateName}</span>
                                        <button
                                          onClick={() => removeTemplateFromItem(item.item_id || item[0], templateId)}
                                          className="ml-1 text-red-500 hover:text-red-700 flex-shrink-0"
                                          title="Remove template"
                                        >
                                          ×
                                        </button>
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{templateName}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageTemplates(item)}
                                className="h-6 px-2 text-xs whitespace-nowrap"
                              >
                                + Add
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManageTemplates(item)}
                              className="h-6 px-2 text-xs whitespace-nowrap"
                            >
                              + Add
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
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

        {/* Import Addon Dialog */}
        <Dialog open={showImportAddonDialog} onOpenChange={setShowImportAddonDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Импорт на добавки от текст</DialogTitle>
              <DialogDescription>
                Поставете текст във формат: "Име (грамаж) (цена лв.цена €)" на всеки ред
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-text">Текст за импорт</Label>
                <Textarea
                  id="import-text"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Избери добавки:&#10;Кафяв шоколад (70г) (1,80 лв.0,92 €)&#10;Бял шоколад (70г) (1,80 лв.0,92 €)&#10;..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-2">Пример за формат:</p>
                <pre className="text-xs">
                  {`Избери добавки:
Кафяв шоколад (70г) (1,80 лв.0,92 €)
Бял шоколад (70г) (1,80 лв.0,92 €)
Банан (80г) (2,00 лв.1,02 €)`}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportAddonDialog(false);
                  setImportText("");
                }}
              >
                Отказ
              </Button>
              <Button onClick={handleImportAddons}>
                Импортирай
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Removable Dialog */}
        <Dialog open={showImportRemovableDialog} onOpenChange={setShowImportRemovableDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Импорт на премахваеми елементи от текст</DialogTitle>
              <DialogDescription>
                Поставете име на всеки премахваем елемент на нов ред
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-removable-text">Текст за импорт</Label>
                <Textarea
                  id="import-removable-text"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Без:&#10;Кокосово мляко&#10;Ананас&#10;Филиран бадем&#10;..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-2">Пример за формат:</p>
                <pre className="text-xs">
                  {`Без:
Кокосово мляко
Ананас
Филиран бадем
Кокосови стърготини`}
                </pre>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportRemovableDialog(false);
                  setImportText("");
                }}
              >
                Отказ
              </Button>
              <Button onClick={handleImportRemovables}>
                Импортирай
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Full Item Dialog */}
        <Dialog open={showImportItemDialog} onOpenChange={setShowImportItemDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Импорт на цял продукт от текст</DialogTitle>
              <DialogDescription>
                Поставете пълната информация за продукта включително име, категория, цена, добавки и премахвания
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-item-text">Текст за импорт</Label>
                <Textarea
                  id="import-item-text"
                  value={importItemText}
                  onChange={(e) => setImportItemText(e.target.value)}
                  placeholder="Американска палачинка Тропикана (320г)&#10;Категория: Американски палачинки&#10;13,40 лв.&#10;..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-2">Пример за формат:</p>
                <pre className="text-xs overflow-x-auto">
                  {`Американска палачинка Тропикана (320г)
Категория: Американски палачинки
13,40 лв.
6,85 € 
В наличност
Без:
Кокосово мляко
Ананас
Филиран бадем
Избери добавки:
Кафяв шоколад (70г) (1,80 лв.0,92 €)
Бял шоколад (70г) (1,80 лв.0,92 €)
Банан (80г) (2,00 лв.1,02 €)`}
                </pre>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Забележка:</strong> Описанието на продукта ще трябва да бъде добавено ръчно след импортирането.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportItemDialog(false);
                  setImportItemText("");
                  setParsedItemData(null);
                }}
              >
                Отказ
              </Button>
              <Button
                onClick={handleImportFullItem}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Импортиране..." : "Импортирай"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Templates Dialog */}
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Addon Templates</DialogTitle>
              <DialogDescription>
                {selectedItem && (
                  <div>
                    <span className="font-semibold">{selectedItem.name || selectedItem[6]}</span> - Manage addon templates
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
                      onClick={() => applyTemplateToItem(selectedItem.item_id || selectedItem[0], template.template_id)}
                      variant="outline"
                      size="sm"
                      className="mr-2"
                    >
                      Apply
                    </Button>
                    <Button
                      onClick={() => removeTemplateFromItem(selectedItem.item_id || selectedItem[0], template.template_id)}
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

      {/* Working Hours Dialog */}
      <Dialog open={isWorkingHoursDialogOpen} onOpenChange={setIsWorkingHoursDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restaurant Working Hours</DialogTitle>
            <DialogDescription>
              Select restaurants and set their working hours for each day of the week.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Restaurant Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Select Restaurants</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectAllRestaurantsForHours(selectedRestaurantsForHours.length !== restaurants.length);
                  }}
                >
                  {selectedRestaurantsForHours.length === restaurants.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.restaurant_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`restaurant-hours-${restaurant.restaurant_id}`}
                      checked={selectedRestaurantsForHours.includes(restaurant.restaurant_id)}
                      onCheckedChange={(checked) => 
                        handleRestaurantCheckboxChangeForHours(restaurant.restaurant_id, checked)
                      }
                    />
                    <label
                      htmlFor={`restaurant-hours-${restaurant.restaurant_id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {restaurant.name}
                    </label>
                  </div>
                ))}
              </div>
              {selectedRestaurantsForHours.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedRestaurantsForHours.length} restaurant(s) selected
                </p>
              )}
            </div>

            {/* Working Hours Inputs */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Working Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(workingHours).map((day) => (
                  <div key={day} className="space-y-2">
                    <Label htmlFor={`hours-${day}`}>{day}</Label>
                    <Input
                      id={`hours-${day}`}
                      value={workingHours[day]}
                      onChange={(e) => handleWorkingHoursChange(day, e.target.value)}
                      placeholder="9:00-22:00"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Format: HH:MM-HH:MM (e.g., 9:00-22:00)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWorkingHoursDialogOpen(false)}
              disabled={updatingWorkingHours}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateWorkingHours}
              disabled={updatingWorkingHours || selectedRestaurantsForHours.length === 0}
            >
              {updatingWorkingHours ? (
                <>
                  <Plus className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Working Hours'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

