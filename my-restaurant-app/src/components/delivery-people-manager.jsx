import { useState } from "react"
import { API_URL } from '@/config/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Pencil, Trash2, UserPlus } from "lucide-react"

export function DeliveryPeopleManager({ restaurantId, deliveryPeople, onUpdate }) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPerson, setCurrentPerson] = useState(null)
  const [formData, setFormData] = useState({ name: "", phone: "" })

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const response = await fetch(`${API_URL}/restaurant/delivery-people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to add delivery person')
      
      setShowAddDialog(false)
      setFormData({ name: "", phone: "" })
      onUpdate()
    } catch (err) {
      console.error('Error adding delivery person:', err)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const response = await fetch(`${API_URL}/restaurant/delivery-people`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          delivery_person_id: currentPerson.delivery_person_id,
          person: formData
        })
      })

      if (!response.ok) throw new Error('Failed to update delivery person')
      
      setShowEditDialog(false)
      setFormData({ name: "", phone: "" })
      onUpdate()
    } catch (err) {
      console.error('Error updating delivery person:', err)
    }
  }

  const handleDelete = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const response = await fetch(`${API_URL}/restaurant/delivery-people`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          delivery_person_id: currentPerson.delivery_person_id
        })
      })

      if (!response.ok) throw new Error('Failed to delete delivery person')
      
      setShowDeleteDialog(false)
      setCurrentPerson(null)
      onUpdate()
    } catch (err) {
      console.error('Error deleting delivery person:', err)
    }
  }

  const handleAssign = async (person) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const response = await fetch(`${API_URL}/restaurant/assign-delivery-person-to-restaurant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          delivery_person_id: person.delivery_person_id
        })
      })

      if (!response.ok) throw new Error('Failed to assign delivery person')
      onUpdate()
    } catch (err) {
      console.error('Error assigning delivery person:', err)
    }
  }

  const handleUnassign = async (person) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user'))
      const response = await fetch(`${API_URL}/restaurant/unassign-delivery-person-from-restaurant`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          delivery_person_id: person.delivery_person_id
        })
      })

      if (!response.ok) throw new Error('Failed to unassign delivery person')
      onUpdate()
    } catch (err) {
      console.error('Error unassigning delivery person:', err)
    }
  }
  // Debug log to see the delivery people data
  console.log('Delivery People Data:', deliveryPeople)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Delivery People</h2>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Delivery Person
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryPeople.map((person) => (
          <Card key={person.delivery_person_id}>
            <CardHeader className="relative">
              <CardTitle>{person.name}</CardTitle>
              <CardDescription>{person.phone}</CardDescription>
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => {
                      setCurrentPerson(person)
                      setFormData({ name: person.name, phone: person.phone })
                      setShowEditDialog(true)
                    }}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => {
                        setCurrentPerson(person)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleAssign(person)}
                >
                  Assign
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleUnassign(person)}
                >
                  Unassign
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Delivery Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Delivery Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Delivery Person</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this delivery person? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}