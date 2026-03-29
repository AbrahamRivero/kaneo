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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { EventRoom } from "@/fetchers/event-room";
import {
  useCreateReservation,
  useUpdateReservation,
} from "@/hooks/mutations/event-room";
import { useGetRoomTariffs, useGetServices } from "@/hooks/queries/event-room";
import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/calendar-store";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { differenceInDays, format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";

export type DateRange = { from: Date; to?: Date };

export type ServiceWithPax = {
  serviceId: string;
  pax: number;
};

export type ReservationFormValues = {
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  eventRoomId: string;
  dateRange: DateRange;
  notes?: string;
  paymentConfirmed?: boolean;
  roomTariffId?: string;
  services?: ServiceWithPax[];
  dayTariffs?: {
    date: string;
    roomTariffId: string;
    price: number;
  }[];
  status?: "all" | "pending" | "confirmed" | "completed";
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
    notes: z.string().optional(),
    paymentConfirmed: z.boolean().optional(),
    roomTariffId: z.string().optional(),
    services: z
      .array(
        z.object({
          serviceId: z.string(),
          pax: z.number().min(1, { error: "Pax must be at least 1" }),
        }),
      )
      .optional(),
    dayTariffs: z
      .array(
        z.object({
          date: z.string(),
          roomTariffId: z.string(),
          price: z.number(),
        }),
      )
      .optional(),
    status: z.enum(["all", "pending", "confirmed", "completed"]).default("all"),
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
    notes?: string | null;
    paymentConfirmed?: boolean | null;
    roomTariffId?: string | null;
    services?: { serviceId: string; pax: number }[] | null;
    dayTariffs?: { date: string; roomTariffId: string; price: number }[] | null;
    status?: string | null;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    const parsed = JSON.parse(dateRangeStr) as { from: string; to?: string };
    const [year, month, day] = parsed.from.split("-").map(Number);
    const dateFrom = new Date(year, month - 1, day);
    if (parsed.to) {
      const [ty, tm, td] = parsed.to.split("-").map(Number);
      const dateTo = new Date(ty, tm - 1, td);
      return { from: dateFrom, to: dateTo };
    }
    return { from: dateFrom };
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
  const [datePickerOpen, setDatePickerOpen] = useState<boolean | "from" | "to">(
    false,
  );
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [servicesSearch, setServicesSearch] = useState("");
  const [servicesPage, setServicesPage] = useState(1);
  const [tempServices, setTempServices] = useState<ServiceWithPax[]>([]);
  const [dayTariffs, setDayTariffs] = useState<
    { date: string; roomTariffId: string; price: number }[]
  >(initialData?.dayTariffs || []);
  const [useDifferentTariffsPerDay, setUseDifferentTariffsPerDay] = useState(
    Boolean(initialData?.dayTariffs && initialData.dayTariffs.length > 0),
  );
  const servicesLimit = 10;

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
      notes: initialData?.notes || "",
      status:
        (initialData?.status as "pending" | "confirmed" | "completed") ||
        "pending",
      paymentConfirmed: initialData?.paymentConfirmed || false,
      roomTariffId: initialData?.roomTariffId || undefined,
      services: initialData?.services || [],
      dayTariffs: initialData?.dayTariffs || [],
    },
  });

  useEffect(() => {
    if (initialData) {
      const parsedDateRange = initialData.dateRange
        ? parseDateRange(initialData.dateRange)
        : { from: new Date() };
      setDateRange(parsedDateRange);
      form.reset({
        title: initialData.title || "",
        clientName: initialData.clientName || "",
        companyName: initialData.companyName || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        eventRoomId: initialData.eventRoomId || "",
        dateRange: parsedDateRange,
        notes: initialData.notes || "",
        status:
          (initialData.status as "pending" | "confirmed" | "completed") ||
          "pending",
        paymentConfirmed: initialData.paymentConfirmed || false,
        roomTariffId: initialData.roomTariffId || undefined,
        services: initialData.services || [],
        dayTariffs: initialData.dayTariffs || [],
      });
    }
  }, [initialData, form.reset]);

  useEffect(() => {
    if (initialData?.dayTariffs && initialData.dayTariffs.length > 0) {
      setDayTariffs(initialData.dayTariffs);
    }
  }, [initialData?.dayTariffs]);

  useEffect(() => {
    if (useDifferentTariffsPerDay) {
      form.setValue("dayTariffs", dayTariffs);
    }
  }, [dayTariffs, useDifferentTariffsPerDay, form]);

  const { data: servicesData } = useGetServices(workspaceId);
  const { data: dialogServicesData } = useGetServices(
    workspaceId,
    servicesPage,
    servicesLimit,
  );
  const { data: roomTariffsData } = useGetRoomTariffs(workspaceId);

  const services = servicesData?.data ?? [];
  const roomTariffs = roomTariffsData?.data ?? [];
  const selectedEventRoomId = form.watch("eventRoomId");
  const filteredTariffs = selectedEventRoomId
    ? roomTariffs.filter((tariff) => tariff.eventRoomId === selectedEventRoomId)
    : roomTariffs;

  const selectedTariffId = form.watch("roomTariffId");
  const selectedServicesWithPax = form.watch("services") || [];

  const formDateRange = form.watch("dateRange");
  const effectiveDateRange = formDateRange || dateRange;

  const selectedTariff = roomTariffs.find((t) => t.id === selectedTariffId);

  const daysInRange = effectiveDateRange.to
    ? Array.from(
        {
          length:
            differenceInDays(effectiveDateRange.to, effectiveDateRange.from) +
            1,
        },
        (_, i) => {
          const d = new Date(effectiveDateRange.from);
          d.setDate(d.getDate() + i);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        },
      )
    : (() => {
        const d = new Date(effectiveDateRange.from);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return [`${year}-${month}-${day}`];
      })();

  const selectedServices = services.filter((s) =>
    selectedServicesWithPax.some((sp) => sp.serviceId === s.id),
  );

  const calculatePricing = () => {
    const days = effectiveDateRange.to
      ? differenceInDays(effectiveDateRange.to, effectiveDateRange.from) + 1
      : 1;
    let tariffPrice: number;
    if (useDifferentTariffsPerDay && dayTariffs.length > 0) {
      tariffPrice = dayTariffs.reduce((sum, dt) => sum + (dt.price ?? 0), 0);
    } else {
      tariffPrice = (selectedTariff?.price ?? 0) * days;
    }
    const servicesPrice = selectedServicesWithPax.reduce(
      (sum: number, sp: ServiceWithPax) => {
        const svc = services.find((s) => s.id === sp.serviceId);
        return sum + (svc?.pricePerPax ?? 0) * sp.pax * days;
      },
      0,
    );
    const serviceChargePercent = selectedTariff?.serviceChargePercent ?? 0;
    const subTotal = tariffPrice + servicesPrice;
    const serviceChargeAmount = subTotal * (serviceChargePercent / 100);
    const grandTotal = subTotal + serviceChargeAmount;
    const totalPax = selectedServicesWithPax.reduce(
      (sum: number, sp: ServiceWithPax) => sum + sp.pax,
      0,
    );
    return {
      tariffPrice,
      servicesPrice,
      serviceChargePercent,
      serviceChargeAmount,
      grandTotal,
      totalPax,
      days,
    };
  };

  const pricing = calculatePricing();

  const onSubmitHandler = async (formData: ReservationFormValues) => {
    try {
      const {
        status,
        dateRange: formDateRange,
        services: formServices,
        dayTariffs: formDayTariffs,
        ...restFormData
      } = formData;

      const dateRangePayload = {
        from: format(formDateRange.from, "yyyy-MM-dd"),
        to: formDateRange.to
          ? format(formDateRange.to, "yyyy-MM-dd")
          : format(formDateRange.from, "yyyy-MM-dd"),
      };

      const days = formDateRange.to
        ? differenceInDays(formDateRange.to, formDateRange.from) + 1
        : 1;

      const servicesPayload = (formServices || [])
        .map((sp) => {
          const svc = services.find((s) => s.id === sp.serviceId);
          if (!svc) return null;
          const unitPrice = svc.pricePerPax ?? 0;
          return {
            serviceId: sp.serviceId,
            pax: sp.pax,
            unitPrice,
            totalPrice: unitPrice * sp.pax * days,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      let dayTariffsPayload:
        | { date: string; roomTariffId: string; price: number }[]
        | undefined;
      if (days > 1 && formDayTariffs && formDayTariffs.length > 0) {
        dayTariffsPayload = formDayTariffs;
      }

      const payload = {
        workspaceId,
        ...restFormData,
        eventRoomId: restFormData.eventRoomId || "",
        roomTariffId: restFormData.roomTariffId || undefined,
        dateRange: dateRangePayload,
        services: servicesPayload.length > 0 ? servicesPayload : undefined,
        dayTariffs: dayTariffsPayload,
        totalRoomPrice: pricing.tariffPrice || undefined,
        totalServicePrice: pricing.servicesPrice || undefined,
        serviceChargeAmount: pricing.serviceChargeAmount || undefined,
        grandTotal: pricing.grandTotal || undefined,
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Event title"
              {...form.register("title")}
            />
          </div>

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
                  value as "pending" | "confirmed" | "completed",
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="dateFrom">From</Label>
              <Popover
                open={datePickerOpen === "from"}
                onOpenChange={(open) =>
                  setDatePickerOpen(open ? "from" : false)
                }
              >
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
                      format(dateRange.from, "P")
                    ) : (
                      <span>Select</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => {
                      if (date) {
                        const newDateRange = { ...dateRange, from: date };
                        setDateRange(newDateRange);
                        form.setValue("dateRange", newDateRange);
                        setDatePickerOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateTo">To</Label>
              <Popover
                open={datePickerOpen === "to"}
                onOpenChange={(open) => setDatePickerOpen(open ? "to" : false)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateRange.to ? (
                      format(dateRange.to, "P")
                    ) : (
                      <span>Select</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => {
                      const newDateRange = { ...dateRange, to: date };
                      setDateRange(newDateRange);
                      form.setValue("dateRange", newDateRange);
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="paymentConfirmed" className="text-sm font-medium">
                Payment Confirmed
              </Label>
              <span className="text-xs text-muted-foreground">
                Indicates if paid
              </span>
            </div>
            <Controller
              control={form.control}
              name="paymentConfirmed"
              render={({ field }) => (
                <Switch
                  id="paymentConfirmed"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="roomTariff">Room Tariff</Label>
            <Select
              value={form.watch("roomTariffId") || ""}
              onValueChange={(value) =>
                form.setValue("roomTariffId", value || undefined)
              }
              disabled={!selectedEventRoomId || filteredTariffs.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    !selectedEventRoomId
                      ? "Select a room first"
                      : filteredTariffs.length === 0
                        ? "No tariffs"
                        : "Select tariff (optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredTariffs.map((tariff) => (
                  <SelectItem key={tariff.id} value={tariff.id}>
                    {tariff.sessionType.replace("_", " ")} -{" "}
                    {tariff.price ? `$${tariff.price}` : "No price"}
                    {tariff.serviceChargePercent > 0 &&
                      ` (+${tariff.serviceChargePercent}% svc)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pricing.days > 1 && (
            <div className="flex items-center justify-between py-2">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="useDifferentTariffsPerDay"
                  className="text-sm font-medium"
                >
                  Different tariffs per day
                </Label>
                <span className="text-xs text-muted-foreground">
                  Enable to set different tariff for each day
                </span>
              </div>
              <Switch
                id="useDifferentTariffsPerDay"
                checked={useDifferentTariffsPerDay}
                onCheckedChange={(checked) => {
                  setUseDifferentTariffsPerDay(checked);
                  if (checked && dayTariffs.length === 0 && selectedTariffId) {
                    const initialDayTariffs = daysInRange.map((date) => ({
                      date,
                      roomTariffId: selectedTariffId,
                      price: selectedTariff?.price ?? 0,
                    }));
                    setDayTariffs(initialDayTariffs);
                  }
                }}
              />
            </div>
          )}

          {pricing.days > 1 && useDifferentTariffsPerDay && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tariff per day</Label>
              {daysInRange.map((date) => {
                const currentTariff = dayTariffs.find((dt) => dt.date === date);
                const tariffOptions = filteredTariffs.map((tariff) => (
                  <SelectItem key={tariff.id} value={tariff.id}>
                    {tariff.sessionType} - ${tariff.price}
                  </SelectItem>
                ));
                return (
                  <div key={date} className="flex items-center gap-2">
                    <span className="w-24 text-sm text-muted-foreground">
                      {format(new Date(`${date}T00:00:00`), "MMM dd")}
                    </span>
                    <Select
                      value={currentTariff?.roomTariffId || ""}
                      onValueChange={(roomTariffId) => {
                        const tariff = roomTariffs.find(
                          (t) => t.id === roomTariffId,
                        );
                        const newDayTariffs = [...dayTariffs];
                        const existingIndex = newDayTariffs.findIndex(
                          (dt) => dt.date === date,
                        );
                        const dayTariffEntry = {
                          date,
                          roomTariffId,
                          price: tariff?.price ?? 0,
                        };
                        if (existingIndex >= 0) {
                          newDayTariffs[existingIndex] = dayTariffEntry;
                        } else {
                          newDayTariffs.push(dayTariffEntry);
                        }
                        setDayTariffs(newDayTariffs);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select tariff" />
                      </SelectTrigger>
                      <SelectContent>{tariffOptions}</SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      ${currentTariff?.price ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes"
              {...form.register("notes")}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Services</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempServices([...selectedServicesWithPax]);
                  setServicesSearch("");
                  setServicesPage(1);
                  setServicesDialogOpen(true);
                }}
              >
                <Plus className="size-4 mr-1" />
                Add Services
              </Button>
            </div>
            <button
              type="button"
              className="border rounded-md overflow-hidden cursor-pointer hover:border-primary/50 transition-colors w-full text-left"
              onClick={() => {
                setTempServices([...selectedServicesWithPax]);
                setServicesSearch("");
                setServicesPage(1);
                setServicesDialogOpen(true);
              }}
            >
              {selectedServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <UtensilsCrossed className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">No services selected</p>
                  <p className="text-xs mt-1">Click here to add services</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Pax</TableHead>
                      <TableHead className="text-right">Price/Pax</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedServicesWithPax.map((sp) => {
                      const svc = services.find((s) => s.id === sp.serviceId);
                      if (!svc) return null;
                      return (
                        <TableRow key={sp.serviceId}>
                          <TableCell className="font-medium">
                            <span
                              className="max-w-[300px] block truncate"
                              title={svc.name}
                            >
                              {svc.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{sp.pax}</TableCell>
                          <TableCell className="text-right">
                            ${svc.pricePerPax ?? 0}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                const current =
                                  form.getValues("services") || [];
                                form.setValue(
                                  "services",
                                  current.filter(
                                    (s) => s.serviceId !== sp.serviceId,
                                  ),
                                );
                              }}
                            >
                              <X className="size-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </button>
          </div>

          <Dialog
            open={servicesDialogOpen}
            onOpenChange={setServicesDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Select Gastronomic Services</DialogTitle>
                <DialogDescription>
                  Search and select the services for this reservation.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={servicesSearch}
                    onChange={(e) => {
                      setServicesSearch(e.target.value);
                      setServicesPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                <div className="border rounded-md max-h-[350px] overflow-y-auto">
                  {(() => {
                    const allServices = dialogServicesData?.data ?? [];
                    const filtered = servicesSearch
                      ? allServices.filter(
                          (s) =>
                            s.name
                              .toLowerCase()
                              .includes(servicesSearch.toLowerCase()) ||
                            s.description
                              ?.toLowerCase()
                              .includes(servicesSearch.toLowerCase()),
                        )
                      : allServices;

                    if (filtered.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Search className="size-8 mb-2 opacity-50" />
                          <p className="text-sm">
                            {servicesSearch
                              ? "No services match your search"
                              : "No services available"}
                          </p>
                        </div>
                      );
                    }

                    return filtered.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center justify-between p-3 hover:bg-accent border-b last:border-b-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={tempServices.some(
                              (sp) => sp.serviceId === service.id,
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempServices((prev) => [
                                  ...prev,
                                  { serviceId: service.id, pax: 1 },
                                ]);
                              } else {
                                setTempServices((prev) =>
                                  prev.filter(
                                    (sp) => sp.serviceId !== service.id,
                                  ),
                                );
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <span className="text-sm font-medium">
                              {service.name}
                            </span>
                            {service.description && (
                              <p
                                className="text-xs text-muted-foreground max-w-[200px] truncate"
                                title={service.description}
                              >
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {tempServices.some(
                            (sp) => sp.serviceId === service.id,
                          ) && (
                            <Input
                              type="number"
                              min="1"
                              className="w-16 h-8 text-sm"
                              value={
                                tempServices.find(
                                  (sp) => sp.serviceId === service.id,
                                )?.pax || 1
                              }
                              onChange={(e) => {
                                const pax =
                                  Number.parseInt(e.target.value) || 1;
                                setTempServices((prev) =>
                                  prev.map((sp) =>
                                    sp.serviceId === service.id
                                      ? { ...sp, pax }
                                      : sp,
                                  ),
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            ${service.pricePerPax ?? 0}/pax
                          </span>
                        </div>
                      </label>
                    ));
                  })()}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {tempServices.length} service(s) selected
                  </span>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setServicesPage((p) => p - 1)}
                          className={
                            servicesPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span className="flex h-9 items-center px-3 text-sm text-muted-foreground">
                          Page {servicesPage} of{" "}
                          {dialogServicesData
                            ? Math.ceil(
                                dialogServicesData.total / servicesLimit,
                              )
                            : 1}
                        </span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setServicesPage((p) => p + 1)}
                          className={
                            !dialogServicesData ||
                            servicesPage >=
                              Math.ceil(
                                dialogServicesData.total / servicesLimit,
                              )
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setServicesDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    form.setValue("services", tempServices);
                    setServicesDialogOpen(false);
                  }}
                >
                  Confirm Selection ({tempServices.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {(selectedTariff || selectedServices.length > 0) && (
            <div className="border rounded-md p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="size-4" />
                <Label className="font-medium">Pricing Summary</Label>
              </div>
              <div className="space-y-1 text-sm">
                {selectedTariff && (
                  <div className="flex justify-between">
                    <span>
                      Room ({selectedTariff.sessionType.replace("_", " ")}
                      {pricing.days > 1 ? ` × ${pricing.days} days` : ""})
                    </span>
                    <span>${pricing.tariffPrice.toFixed(2)}</span>
                  </div>
                )}
                {selectedServices.length > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Services ({pricing.totalPax} pax
                      {pricing.days > 1 ? ` × ${pricing.days} days` : ""})
                    </span>
                    <span>${pricing.servicesPrice.toFixed(2)}</span>
                  </div>
                )}
                {pricing.serviceChargePercent > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      Service Charge ({pricing.serviceChargePercent}%)
                    </span>
                    <span>${pricing.serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2 mt-2">
                  <span>Total</span>
                  <span>${pricing.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
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
