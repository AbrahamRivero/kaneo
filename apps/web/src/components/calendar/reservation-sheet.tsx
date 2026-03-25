import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DateRange, EventRoom, Reservation } from "@/fetchers/event-room";
import { useDeleteReservation } from "@/hooks/mutations/event-room";
import queryClient from "@/query-client";
import { useNavigate } from "@tanstack/react-router";
import { differenceInDays, format } from "date-fns";
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  DollarSign,
  Pen,
  Phone,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReservationSheetProps {
  reservations: Reservation[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventRooms: EventRoom[];
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

function formatDateRangeFromObject(dateRange: DateRange): string {
  const start = new Date(`${dateRange.from}T00:00:00`);
  const end = new Date(`${dateRange.to || dateRange.from}T00:00:00`);

  if (dateRange.from === dateRange.to || !dateRange.to) {
    return format(start, "EEEE, MMMM dd, yyyy");
  }

  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
}

function getStatusColor(status?: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-500/20 text-green-600 dark:text-green-400";
    case "pending":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    case "completed":
      return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
}

function getStatusIcon(status?: string): React.ReactNode {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 className="size-3 text-green-500" />;
    default:
      return null;
  }
}

interface SingleReservationSectionProps {
  reservation: Reservation;
  dateStr: string;
  index: number;
  total: number;
  workspaceId: string;
  onDeleteSuccess: () => void;
}

function SingleReservationSection({
  reservation,
  dateStr,
  index,
  total,
  workspaceId,
  onDeleteSuccess,
}: SingleReservationSectionProps) {
  const navigate = useNavigate();
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const deleteReservation = useDeleteReservation();

  const dateRange = parseDateRange(reservation.dateRange);
  const dateRangeStr = formatDateRangeFromObject(dateRange);
  const totalPax = reservation.adultPax + reservation.childrenPax;
  const days =
    dateRange.to && dateRange.to !== dateRange.from
      ? differenceInDays(
          new Date(`${dateRange.to}T00:00:00`),
          new Date(`${dateRange.from}T00:00:00`),
        ) + 1
      : 1;
  const reservationServices = reservation.services ?? [];

  const hasPricing = reservation.grandTotal != null;

  const handleDelete = async () => {
    try {
      await deleteReservation.mutateAsync(reservation.id);
      toast.success("Reservation deleted successfully");
      setDeleteAlertOpen(false);
      onDeleteSuccess();
    } catch {
      toast.error("Failed to delete reservation");
    }
  };

  const handleEdit = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms/reservations/$id",
      params: { workspaceId, id: reservation.id },
    });
  };

  return (
    <>
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reservation for{" "}
              <strong>{reservation.title || reservation.clientName}</strong> on{" "}
              {dateStr}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className={`${
          index > 0 && index < total ? "border-t border-border pt-4 mt-4" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Reservation {index + 1}
            </span>
            {getStatusIcon(reservation.status)}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 hover:bg-muted"
              onClick={handleEdit}
              title="Edit reservation"
            >
              <Pen className="size-3.5 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 hover:bg-red-500/10"
              onClick={() => setDeleteAlertOpen(true)}
              title="Delete reservation"
            >
              <Trash2 className="size-3.5 text-red-500" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}
            >
              {getStatusLabel(reservation.status)}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <Avatar className="size-9 border-[1.4px] border-background shrink-0">
              <AvatarImage
                src={`https://api.dicebear.com/9.x/glass/svg?seed=${reservation.id}`}
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[13px] font-medium text-foreground leading-[18px]">
                  {reservation.title || reservation.clientName}
                </p>
                {reservation.email && (
                  <CheckCircle2 className="size-3 text-green-500 shrink-0" />
                )}
              </div>
              {reservation.email && (
                <p className="text-xs text-muted-foreground leading-none">
                  {reservation.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1">
                <CalendarIcon className="size-4" />
              </div>
              <span>{dateRangeStr}</span>
            </div>
            {reservation.companyName && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Company: {reservation.companyName}</span>
              </div>
            )}
            {reservation.phone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="p-1">
                  <Phone className="size-4" />
                </div>
                <span>+53 {reservation.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1">
                <Users className="size-4" />
              </div>
              <span>
                {totalPax} guests
                <span className="mx-1">•</span>
                {reservation.adultPax} adults
                {reservation.childrenPax > 0 &&
                  `, ${reservation.childrenPax} children`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1">
                {reservation.paymentConfirmed ? (
                  <DollarSign className="size-4 text-green-500" />
                ) : (
                  <DollarSign className="size-4 text-amber-500" />
                )}
              </div>
              <span>
                Payment:{" "}
                {reservation.paymentConfirmed ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Confirmed
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    Pending
                  </span>
                )}
              </span>
            </div>
          </div>

          {hasPricing && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                <DollarSign className="size-4" />
                <span>Pricing</span>
              </div>
              <div className="text-xs bg-muted/50 p-3 rounded-lg space-y-2">
                {reservation.totalRoomPrice != null &&
                  reservation.totalRoomPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Room{days > 1 ? ` (× ${days} days)` : ""}
                      </span>
                      <span>${reservation.totalRoomPrice.toFixed(2)}</span>
                    </div>
                  )}
                {reservationServices.map((service) => (
                  <div key={service.id} className="flex justify-between">
                    <span className="text-muted-foreground truncate mr-2">
                      {service.gastronomicService?.name || "Service"}
                      <span className="text-[10px] ml-1">
                        (${service.unitPrice.toFixed(2)} × {service.quantity}
                        {days > 1 ? ` × ${days}d` : ""})
                      </span>
                    </span>
                    <span className="whitespace-nowrap">
                      ${service.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
                {reservationServices.length === 0 &&
                  (reservation.totalServicePrice ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Services</span>
                      <span>
                        ${(reservation.totalServicePrice ?? 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                {(reservation.serviceChargeAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Charge</span>
                    <span>
                      ${(reservation.serviceChargeAmount ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2 mt-1">
                  <span>Total</span>
                  <span>${(reservation.grandTotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] pt-0.5">
                  <span>{totalPax} pax</span>
                  {days > 1 && (
                    <>
                      <span className="size-0.5 rounded-full bg-muted-foreground" />
                      <span>{days} days</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {reservation.notes && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                <Bell className="size-4" />
                <span>Notes</span>
              </div>
              <p className="text-xs text-muted-foreground leading-[1.6] bg-muted/50 p-3 rounded-lg">
                {reservation.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function EventSheet({
  reservations,
  open,
  onOpenChange,
  workspaceId,
  eventRooms,
}: ReservationSheetProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    }
  }, [open]);

  if (!reservations || reservations.length === 0) return null;

  const firstReservation = reservations[0];
  const eventRoom = eventRooms.find(
    (r) => r.id === firstReservation.eventRoomId,
  );
  const roomName = eventRoom?.name || "Event Room";
  const firstDateRange = parseDateRange(firstReservation.dateRange);
  const dateStr = formatDateRangeFromObject(firstDateRange);

  const handleDeleteSuccess = () => {
    setRefreshKey((k) => k + 1);
    if (refreshKey >= reservations.length - 1) {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setRefreshKey(0);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[560px] overflow-y-auto p-0 border-l border-r border-t [&>button]:hidden"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 pt-4 pb-4 border-b border-border">
            <div className="flex items-center justify-end mb-2">
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 rounded-full bg-muted hover:bg-muted"
                >
                  <X className="size-4 text-muted-foreground" />
                </Button>
              </SheetClose>
            </div>

            <div className="flex flex-col gap-1">
              <SheetTitle className="text-lg font-semibold text-foreground leading-normal">
                {roomName}
              </SheetTitle>
              <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                <span>{dateStr}</span>
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span>
                  {reservations.length} reservation
                  {reservations.length !== 1 ? "s" : ""}
                </span>
              </div>
              {eventRoom?.allowsMultipleReservations && (
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1">
                  Multiple reservations allowed
                </span>
              )}
            </div>
          </SheetHeader>

          <div key={refreshKey} className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-4 max-w-[512px] mx-auto">
              {reservations.map((reservation, index) => (
                <SingleReservationSection
                  key={reservation.id}
                  reservation={reservation}
                  dateStr={dateStr}
                  index={index}
                  total={reservations.length}
                  workspaceId={workspaceId}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
