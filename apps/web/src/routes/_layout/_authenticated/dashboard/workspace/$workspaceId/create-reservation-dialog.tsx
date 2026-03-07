"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateReservation,
  useUpdateReservation,
} from "@/hooks/mutations/event-room";
import { useState } from "react";

interface CreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventRooms: any[];
  selectedReservation?: any;
}

export function CreateReservationDialog({
  open,
  onOpenChange,
  workspaceId,
  eventRooms,
  selectedReservation,
}: CreateReservationDialogProps) {
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const [formData, setFormData] = useState({
    clientName: selectedReservation?.clientName || "",
    companyName: selectedReservation?.companyName || "",
    phone: selectedReservation?.phone || "",
    email: selectedReservation?.email || "",
    eventRoomId: selectedReservation?.eventRoomId || "",
    startDate: selectedReservation?.startDate
      ? selectedReservation.startDate.split("T")[0]
      : "",
    endDate: selectedReservation?.endDate
      ? selectedReservation.endDate.split("T")[0]
      : "",
    adultPax: selectedReservation?.adultPax || 0,
    childrenPax: selectedReservation?.childrenPax || 0,
    notes: selectedReservation?.notes || "",
    paymentConfirmed: selectedReservation?.paymentConfirmed || false,
    coffeeBreak: selectedReservation?.coffeeBreak || false,
    lunch: selectedReservation?.lunch || false,
    cocktail: selectedReservation?.cocktail || false,
    canapes: selectedReservation?.canapes || false,
    openBar: selectedReservation?.openBar || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      workspaceId,
      ...formData,
      adultPax: Number(formData.adultPax),
      childrenPax: Number(formData.childrenPax),
    };

    if (selectedReservation?.id) {
      await updateReservation.mutateAsync({
        id: selectedReservation.id,
        payload,
      });
    } else {
      await createReservation.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedReservation?.id ? "Edit Reservation" : "New Reservation"}
          </DialogTitle>
          <DialogDescription>
            {selectedReservation?.id
              ? "Update the reservation details below."
              : "Fill in the reservation details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eventRoom">Event Room *</Label>
              <Select
                value={formData.eventRoomId}
                onValueChange={(value) =>
                  setFormData({ ...formData, eventRoomId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {eventRooms.map((room: any) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} (Capacity: {room.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="adultPax">Adult Guests *</Label>
                <Input
                  id="adultPax"
                  type="number"
                  min="0"
                  value={formData.adultPax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      adultPax: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="childrenPax">Children Guests</Label>
                <Input
                  id="childrenPax"
                  type="number"
                  min="0"
                  value={formData.childrenPax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      childrenPax: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Services</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="coffeeBreak"
                    checked={formData.coffeeBreak}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        coffeeBreak: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="coffeeBreak" className="text-sm">
                    Coffee Break
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lunch"
                    checked={formData.lunch}
                    onChange={(e) =>
                      setFormData({ ...formData, lunch: e.target.checked })
                    }
                  />
                  <label htmlFor="lunch" className="text-sm">
                    Lunch
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="cocktail"
                    checked={formData.cocktail}
                    onChange={(e) =>
                      setFormData({ ...formData, cocktail: e.target.checked })
                    }
                  />
                  <label htmlFor="cocktail" className="text-sm">
                    Cocktail
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="canapes"
                    checked={formData.canapes}
                    onChange={(e) =>
                      setFormData({ ...formData, canapes: e.target.checked })
                    }
                  />
                  <label htmlFor="canapes" className="text-sm">
                    Canapés
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="openBar"
                    checked={formData.openBar}
                    onChange={(e) =>
                      setFormData({ ...formData, openBar: e.target.checked })
                    }
                  />
                  <label htmlFor="openBar" className="text-sm">
                    Open Bar
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paymentConfirmed"
                checked={formData.paymentConfirmed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentConfirmed: e.target.checked,
                  })
                }
              />
              <label htmlFor="paymentConfirmed" className="text-sm">
                Payment Confirmed
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {selectedReservation?.id ? "Update" : "Create"} Reservation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
