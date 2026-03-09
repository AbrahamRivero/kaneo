import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/calendar-store";
import type { EventRoom, Reservation } from "@/types/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

export type ReservationFormValues = {
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email: string;
  eventRoomId?: string;
  adultPax?: number;
  childrenPax?: number;
  notes?: string;
  paymentConfirmed?: boolean;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
  status?: "all" | "pending" | "confirmed" | "cancelled" | "completed";
};

const reservationSchema = z.object({
  title: z.string().optional(),
  clientName: z.string().min(3, { error: "Client Name is too short" }),
  companyName: z.string().optional(),
  phone: z.string().min(8, { error: "Phone is too short" }).optional(),
  email: z.email(),
  eventRoomId: z.string().optional(),
  adultPax: z.number().optional(),
  childrenPax: z.number().optional(),
  notes: z.string().optional(),
  paymentConfirmed: z.boolean().optional(),
  coffeeBreak: z.boolean().optional(),
  lunch: z.boolean().optional(),
  cocktail: z.boolean().optional(),
  canapes: z.boolean().optional(),
  openBar: z.boolean().optional(),
  status: z
    .enum(["all", "pending", "confirmed", "cancelled", "completed"])
    .default("all"),
});

interface ReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventRooms: EventRoom[];
  selectedReservation?: Reservation;
}

export function ReservationDialog({
  open,
  onOpenChange,
  workspaceId,
  eventRooms = [],
  selectedReservation,
}: ReservationDialogProps) {
  const { goToDate } = useCalendarStore();
  const [startDate, setStartDate] = useState<Date>(() => {
    if (selectedReservation?.date) {
      const [year, month, day] = selectedReservation.date
        .split("-")
        .map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const [startTime, setStartTime] = useState(
    selectedReservation?.startTime || "",
  );
  const [endTime, setEndTime] = useState(selectedReservation?.endTime || "");
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const prevReservationIdRef = useRef<string | undefined>(
    selectedReservation?.id,
  );

  // keep local date/time state in sync when editing a different reservation
  useEffect(() => {
    if (!selectedReservation) {
      const today = new Date();
      setStartDate(today);
      setStartTime("");
      setEndTime("");
      form.reset();
      prevReservationIdRef.current = undefined;
      return;
    }

    if (prevReservationIdRef.current !== selectedReservation.id) {
      prevReservationIdRef.current = selectedReservation.id;
      const [year, month, day] = selectedReservation.date
        .split("-")
        .map(Number);
      setStartDate(new Date(year, month - 1, day));
      setStartTime(selectedReservation.startTime || "");
      setEndTime(selectedReservation.endTime || "");
      form.reset({
        title: selectedReservation.title || "",
        clientName: selectedReservation.clientName || "",
        companyName: selectedReservation.companyName || "",
        phone: selectedReservation.phone || "",
        email: selectedReservation.email || "",
        eventRoomId: selectedReservation.eventRoomId || "",
        adultPax: selectedReservation.adultPax || 0,
        childrenPax: selectedReservation.childrenPax || 0,
        notes: selectedReservation.notes || "",
        status:
          (selectedReservation.status as
            | "pending"
            | "confirmed"
            | "cancelled"
            | "completed") || "pending",
        paymentConfirmed: selectedReservation.paymentConfirmed || false,
        coffeeBreak: selectedReservation.coffeeBreak || false,
        lunch: selectedReservation.lunch || false,
        cocktail: selectedReservation.cocktail || false,
        canapes: selectedReservation.canapes || false,
        openBar: selectedReservation.openBar || false,
      });
    }
  }, [selectedReservation]);

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const form = useForm<ReservationFormValues>({
    resolver: standardSchemaResolver(reservationSchema),
    defaultValues: {
      title: selectedReservation?.title || "",
      clientName: selectedReservation?.clientName || "",
      companyName: selectedReservation?.companyName || "",
      phone: selectedReservation?.phone || "",
      email: selectedReservation?.email || "",
      eventRoomId: selectedReservation?.eventRoomId || "",
      adultPax: selectedReservation?.adultPax || 0,
      childrenPax: selectedReservation?.childrenPax || 0,
      notes: selectedReservation?.notes || "",
      status:
        (selectedReservation?.status as
          | "pending"
          | "confirmed"
          | "cancelled"
          | "completed") || "pending",
      paymentConfirmed: selectedReservation?.paymentConfirmed || false,
      coffeeBreak: selectedReservation?.coffeeBreak || false,
      lunch: selectedReservation?.lunch || false,
      cocktail: selectedReservation?.cocktail || false,
      canapes: selectedReservation?.canapes || false,
      openBar: selectedReservation?.openBar || false,
    },
  });

  const onSubmitHandler = async (formData: ReservationFormValues) => {
    try {
      const { status, ...restFormData } = formData;

      // Create start and end DateTime from date and times
      const startDateTime = new Date(startDate);
      if (startTime) {
        const [hours, minutes] = startTime.split(":");
        startDateTime.setHours(
          Number.parseInt(hours, 10),
          Number.parseInt(minutes, 10),
        );
      }
      const endDateTime = new Date(startDate);
      if (endTime) {
        const [hours, minutes] = endTime.split(":");
        endDateTime.setHours(
          Number.parseInt(hours, 10),
          Number.parseInt(minutes, 10),
        );
      }

      if (endDateTime < startDateTime) {
        // simple validation: end before start not allowed
        console.warn("End date must be after start date");
        return;
      }

      const payload = {
        workspaceId,
        ...restFormData,
        eventRoomId: restFormData.eventRoomId ?? "",
        date: format(startDate, "yyyy-MM-dd"),
        startTime: startTime || "00:00:00",
        endTime: endTime || "00:00:00",
        adultPax: Number(restFormData.adultPax),
        childrenPax: Number(restFormData.childrenPax),
      };

      if (selectedReservation?.id) {
        const updatePayload = {
          ...payload,
          ...(status && status !== "all" && { status }),
        };
        await updateReservation.mutateAsync({
          id: selectedReservation.id,
          payload: updatePayload,
        });
      } else {
        await createReservation.mutateAsync({
          ...payload,
          ...(status && status !== "all" && { status }),
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.log(error);
    }

    goToDate(startDate);
    form.reset();
    // reset date/time fields for next open
    const today = new Date();
    setStartDate(today);
    setStartTime("");
    setEndTime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedReservation ? "Edit Reservation" : "Create Reservation"}
          </DialogTitle>
          <DialogDescription>
            {selectedReservation
              ? "Update the reservation details below."
              : "Add a new reservation to your calendar. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Event title"
                {...form.register("title")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="eventRoom">Event Room</Label>
                <Select
                  value={form.watch("eventRoomId") || ""}
                  onValueChange={(value) => form.setValue("eventRoomId", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select event room" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} (Capacity: {room.capacity})
                        {room.allowsMultipleReservations && " - Multiple"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const selectedRoom = eventRooms.find(
                    (r) => r.id === form.watch("eventRoomId"),
                  );
                  if (selectedRoom?.allowsMultipleReservations) {
                    return (
                      <p className="text-xs text-muted-foreground mt-1">
                        This space allows multiple reservations at the same
                        time. Capacity is shared among all reservations.
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status") || "pending"}
                  onValueChange={(value) =>
                    form.setValue(
                      "status",
                      value as
                        | "pending"
                        | "confirmed"
                        | "cancelled"
                        | "completed",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  placeholder="Client name"
                  {...form.register("clientName")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  placeholder="Company name"
                  {...form.register("companyName")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...form.register("email")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+53 5xxxxxxx"
                  {...form.register("phone")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Popover
                  open={startPickerOpen}
                  onOpenChange={setStartPickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Select date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(selectedDate) => {
                        if (selectedDate) setStartDate(selectedDate);
                        setStartPickerOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="adultPax">Adults</Label>
                <Input
                  id="adultPax"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register("adultPax", { valueAsNumber: true })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="childrenPax">Children</Label>
                <Input
                  id="childrenPax"
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register("childrenPax", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Services</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("coffeeBreak")} />
                  <span className="text-sm">Coffee Break</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("lunch")} />
                  <span className="text-sm">Lunch</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("cocktail")} />
                  <span className="text-sm">Cocktail</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("canapes")} />
                  <span className="text-sm">Canapés</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...form.register("openBar")} />
                  <span className="text-sm">Open Bar</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...form.register("paymentConfirmed")}
                  />
                  <span className="text-sm">Payment Confirmed</span>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Additional notes"
                {...form.register("notes")}
              />
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
              {selectedReservation
                ? "Update Reservation"
                : "Create Reservation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
