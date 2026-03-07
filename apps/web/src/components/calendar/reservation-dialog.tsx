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
import { useCreateReservation, useUpdateReservation } from "@/hooks/mutations/event-room";
import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/calendar-store";
import type { EventRoom, Reservation } from "@/types/event-room";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";


export type ReservationFormValues = {
  clientName: string,
  companyName: string,
  phone?: string,
  email: string,
  eventRoomId?: string,
  startDate?: Date,
  endDate?: Date,
  adultPax?: number,
  childrenPax?: number,
  notes?: string,
  paymentConfirmed?: boolean,
  coffeeBreak?: boolean,
  lunch?: boolean,
  cocktail?: boolean,
  canapes?: boolean,
  openBar?: boolean
  status?: "all" | "pending" | "confirmed" | "cancelled" | "completed"
};

const reservationSchema = z.object({
  clientName: z.string().min(3, { error: "Client Name is too short" }),
  companyName: z.string().min(3, { error: "Company Name is too short" }),
  phone: z.string().min(8, { error: "Phone is too short" }).optional(),
  email: z.email(),
  eventRoomId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
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
  eventRooms,
  selectedReservation
}: ReservationDialogProps) {
  const { goToDate } = useCalendarStore();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [timezone, setTimezone] = useState("");
  const [participants, setParticipants] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const form = useForm<ReservationFormValues>({
    resolver: standardSchemaResolver(reservationSchema),
    defaultValues: {
      clientName: selectedReservation?.clientName || "",
      companyName: selectedReservation?.companyName || "",
      phone: selectedReservation?.phone || "",
      email: selectedReservation?.email || "",
      eventRoomId: selectedReservation?.eventRoomId || "",
      startDate: selectedReservation?.startDate
        ? selectedReservation.startDate
        : new Date(),
      endDate: selectedReservation?.endDate
        ? selectedReservation.endDate
        : new Date(),
      adultPax: selectedReservation?.adultPax || 0,
      childrenPax: selectedReservation?.childrenPax || 0,
      notes: selectedReservation?.notes || "",
      paymentConfirmed: selectedReservation?.paymentConfirmed || false,
      coffeeBreak: selectedReservation?.coffeeBreak || false,
      lunch: selectedReservation?.lunch || false,
      cocktail: selectedReservation?.cocktail || false,
      canapes: selectedReservation?.canapes || false,
      openBar: selectedReservation?.openBar || false,
    }
  })

  const onSubmitHandler = async (formData: ReservationFormValues) => {
    setIsPending(true);

    try {
      const payload = {
        workspaceId,
        ...formData,
        eventRoomId: formData.eventRoomId ?? "",
        startDate: formData.startDate?.toDateString() ?? new Date().toDateString(),
        endDate: formData.endDate?.toDateString() ?? new Date().toDateString(),
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
    } catch (error) {
      console.log(error)
    }


    goToDate(date);
    form.reset()
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Reservation</DialogTitle>
          <DialogDescription>
            Add a new reservation to your calendar. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Event title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Date</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      if (selectedDate)
                        setDate(selectedDate)
                      setDatePickerOpen(false);
                    }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
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
                    required
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
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="participants">
                Participants (comma-separated)
              </Label>
              <Input
                id="participants"
                placeholder="user1, user2, user3"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="meetingLink">Meeting Link (optional)</Label>
              <Input
                id="meetingLink"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone (optional)</Label>
              <Input
                id="timezone"
                placeholder="GMT+7 Pontianak"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
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
            <Button type="submit">Create Reservation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
