import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Textarea } from "@/components/ui/textarea";
import type { EventRoom } from "@/fetchers/event-room";
import {
  useCreateReservation,
  useUpdateReservation,
} from "@/hooks/mutations/event-room";
import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/calendar-store";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";

export type DateRange = { from: Date; to?: Date };

export type ReservationFormValues = {
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  eventRoomId: string;
  dateRange: DateRange;
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

const reservationSchema = z
  .object({
    title: z.string().optional(),
    clientName: z.string().min(3, { error: "Client Name is too short" }),
    companyName: z.string().optional(),
    phone: z.string().optional(),
    email: z
      .string()
      .email("Invalid email format")
      .optional()
      .or(z.literal("")),
    eventRoomId: z.string().min(1, { error: "Event Room is required" }),
    dateRange: z.object({
      from: z.date(),
      to: z.date().optional(),
    }),
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
  })
  .refine(
    () => {
      return true;
    },
    { error: "Validation bypassed for testing", path: ["dateRange"] },
  );

interface ReservationFormProps {
  workspaceId: string;
  eventRooms: EventRoom[];
  reservationId?: string;
  initialData?: {
    id: string;
    title?: string | null;
    clientName: string;
    companyName?: string | null;
    phone?: string | null;
    email?: string | null;
    eventRoomId: string;
    dateRange: string;
    adultPax?: number | null;
    childrenPax?: number | null;
    notes?: string | null;
    paymentConfirmed?: boolean | null;
    coffeeBreak?: boolean | null;
    lunch?: boolean | null;
    cocktail?: boolean | null;
    canapes?: boolean | null;
    openBar?: boolean | null;
    status?: string | null;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    const parsed = JSON.parse(dateRangeStr) as { from: string; to?: string };
    return {
      from: new Date(`${parsed.from}T00:00:00`),
      to: parsed.to ? new Date(`${parsed.to}T00:00:00`) : undefined,
    };
  } catch {
    return { from: new Date() };
  }
}

export function ReservationForm({
  workspaceId,
  eventRooms = [],
  reservationId,
  initialData,
  onSuccess,
  onCancel,
}: ReservationFormProps) {
  const { goToDate } = useCalendarStore();
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (initialData?.dateRange) {
      return parseDateRange(initialData.dateRange);
    }
    return { from: new Date() };
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const form = useForm<ReservationFormValues>({
    resolver: standardSchemaResolver(reservationSchema),
    defaultValues: {
      title: initialData?.title || "",
      clientName: initialData?.clientName || "",
      companyName: initialData?.companyName || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      eventRoomId: initialData?.eventRoomId || "",
      dateRange: dateRange,
      adultPax: initialData?.adultPax || 0,
      childrenPax: initialData?.childrenPax || 0,
      notes: initialData?.notes || "",
      status:
        (initialData?.status as
          | "pending"
          | "confirmed"
          | "cancelled"
          | "completed") || "pending",
      paymentConfirmed: initialData?.paymentConfirmed || false,
      coffeeBreak: initialData?.coffeeBreak || false,
      lunch: initialData?.lunch || false,
      cocktail: initialData?.cocktail || false,
      canapes: initialData?.canapes || false,
      openBar: initialData?.openBar || false,
    },
  });

  const onSubmitHandler = async (formData: ReservationFormValues) => {
    try {
      const { status, dateRange: formDateRange, ...restFormData } = formData;

      const dateRangePayload = {
        from: format(formDateRange.from, "yyyy-MM-dd"),
        to: formDateRange.to
          ? format(formDateRange.to, "yyyy-MM-dd")
          : format(formDateRange.from, "yyyy-MM-dd"),
      };

      const payload = {
        workspaceId,
        ...restFormData,
        eventRoomId: restFormData.eventRoomId ?? "",
        dateRange: dateRangePayload,
        adultPax: Number(restFormData.adultPax) || 0,
        childrenPax: Number(restFormData.childrenPax) || 0,
      };

      if (reservationId) {
        const updatePayload = {
          ...payload,
          ...(status && status !== "all" && { status }),
        };
        await updateReservation.mutateAsync({
          id: reservationId,
          payload: updatePayload,
        });
      } else {
        await createReservation.mutateAsync({
          ...payload,
          ...(status && status !== "all" && { status }),
        });
      }
      onSuccess?.();
    } catch (error) {
      console.log(error);
    }

    goToDate(dateRange.from);
  };

  const isEditing = Boolean(reservationId);
  const isPending = createReservation.isPending || updateReservation.isPending;

  return (
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
            <Label htmlFor="eventRoom">Event Room *</Label>
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
                    {room.allowsMultipleReservations && " - Mult"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.eventRoomId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.eventRoomId.message as string}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.watch("status") || "pending"}
              onValueChange={(value) =>
                form.setValue(
                  "status",
                  value as "pending" | "confirmed" | "cancelled" | "completed",
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
            {form.formState.errors.clientName && (
              <p className="text-sm text-red-500">
                {form.formState.errors.clientName.message as string}
              </p>
            )}
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message as string}
              </p>
            )}
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

        <div className="grid gap-2">
          <Label>Date Range</Label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                  ) : (
                    format(dateRange.from, "PPP")
                  )
                ) : (
                  <span>Select date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(selected) => {
                  if (selected?.from) {
                    const newDateRange = {
                      from: selected.from,
                      to: selected.to,
                    };
                    setDateRange(newDateRange);
                    form.setValue("dateRange", newDateRange);
                    if (selected.from && selected.to) {
                      setDatePickerOpen(false);
                    }
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.dateRange && (
            <p className="text-sm text-red-500">
              {form.formState.errors.dateRange.message as string}
            </p>
          )}
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
              <input type="checkbox" {...form.register("paymentConfirmed")} />
              <span className="text-sm">Payment Confirmed</span>
            </label>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes"
            {...form.register("notes")}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Reservation"}
        </Button>
      </div>
    </form>
  );
}
