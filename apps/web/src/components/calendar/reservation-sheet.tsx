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
import { useDeleteReservation } from "@/hooks/mutations/event-room";
import type { EventRoom, Reservation } from "@/types/event-room";
import { format } from "date-fns";
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Copy,
  DollarSign,
  FilePlus,
  Pen,
  Phone,
  Printer,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ReservationDialog } from "./reservation-dialog";

interface ReservationSheetProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventRooms: EventRoom[];
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return format(date, "EEEE, MMMM dd, yyyy");
}

function getStatusColor(status?: string): string {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "completed":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusLabel(status?: string): string {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return "Unknown";
  }
}

export function EventSheet({
  reservation,
  open,
  onOpenChange,
  workspaceId,
  eventRooms,
}: ReservationSheetProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const deleteReservation = useDeleteReservation();

  if (!reservation) return null;

  const eventRoom = eventRooms.find((r) => r.id === reservation.eventRoomId);

  const dateStr = formatDate(reservation.date);
  const startTimeStr = formatTime(reservation.startTime);
  const endTimeStr = formatTime(reservation.endTime);

  const organizerName = reservation.clientName;
  const organizerCompany = reservation.companyName;
  const totalPax = reservation.adultPax + reservation.childrenPax;

  const services = [
    { label: "Coffee Break", value: reservation.coffeeBreak },
    { label: "Lunch", value: reservation.lunch },
    { label: "Cocktail", value: reservation.cocktail },
    { label: "Canapés", value: reservation.canapes },
    { label: "Open Bar", value: reservation.openBar },
  ].filter((s) => s.value);

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteReservation.mutateAsync(reservation.id);
      toast.success("Reservation deleted successfully");
      setDeleteAlertOpen(false);
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete reservation");
    }
  };

  const handlePrint = () => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Reservation Report - ${reservation.title || reservation.clientName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
    .services { background: #f0f0f0; padding: 15px; border-radius: 8px; }
    .footer { margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>Reservation Report</h1>
  
  <div class="section">
    <div><span class="label">Event:</span> <span class="value">${reservation.title || "N/A"}</span></div>
    <div><span class="label">Date:</span> <span class="value">${dateStr}</span></div>
    <div><span class="label">Time:</span> <span class="value">${startTimeStr} - ${endTimeStr}</span></div>
    <div><span class="label">Status:</span> <span class="status">${getStatusLabel(reservation.status)}</span></div>
  </div>

  <div class="section">
    <h2>Client Information</h2>
    <div><span class="label">Name:</span> <span class="value">${reservation.clientName}</span></div>
    ${reservation.companyName ? `<div><span class="label">Company:</span> <span class="value">${reservation.companyName}</span></div>` : ""}
    ${reservation.email ? `<div><span class="label">Email:</span> <span class="value">${reservation.email}</span></div>` : ""}
    ${reservation.phone ? `<div><span class="label">Phone:</span> <span class="value">+53 ${reservation.phone}</span></div>` : ""}
  </div>

  <div class="section">
    <h2>Event Details</h2>
    <div><span class="label">Event Room:</span> <span class="value">${eventRoom?.name || "N/A"}</span></div>
    <div><span class="label">Capacity:</span> <span class="value">${eventRoom?.capacity || "N/A"}</span></div>
    <div><span class="label">Total Guests:</span> <span class="value">${totalPax} (${reservation.adultPax} adults, ${reservation.childrenPax} children)</span></div>
    ${reservation.paymentConfirmed ? `<div><span class="label">Payment:</span> <span class="value">Confirmed</span></div>` : `<div><span class="label">Payment:</span> <span class="value">Pending</span></div>`}
  </div>

  ${
    services.length > 0
      ? `
  <div class="section">
    <h2>Services</h2>
    <div class="services">
      ${services.map((s) => `• ${s.label}`).join("<br>")}
    </div>
  </div>
  `
      : ""
  }

  ${
    reservation.notes
      ? `
  <div class="section">
    <h2>Notes</h2>
    <p>${reservation.notes}</p>
  </div>
  `
      : ""
  }

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Reservation ID: ${reservation.id}</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDuplicateReservation = () => {
    setEditDialogOpen(true);
  };

  return (
    <>
      <ReservationDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            onOpenChange(false);
          }
        }}
        workspaceId={workspaceId}
        eventRooms={eventRooms}
        selectedReservation={reservation}
      />

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

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[560px] overflow-y-auto p-0 border-l border-r border-t [&>button]:hidden"
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-4 pt-4 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-muted"
                    onClick={handleEdit}
                    title="Edit reservation"
                  >
                    <Pen className="size-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-muted"
                    onClick={handlePrint}
                    title="Print report"
                  >
                    <Printer className="size-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-muted"
                    onClick={handleDuplicateReservation}
                    title="Duplicate reservation"
                  >
                    <Copy className="size-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 hover:bg-red-50"
                    onClick={() => setDeleteAlertOpen(true)}
                    title="Delete reservation"
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
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

              <div className="flex flex-col gap-1 mb-4">
                <SheetTitle className="text-xl font-semibold text-foreground leading-normal">
                  {reservation.title || reservation.clientName}
                </SheetTitle>
                <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <span>{dateStr}</span>
                  <span className="size-1 rounded-full bg-muted-foreground" />
                  <span>
                    {startTimeStr} - {endTimeStr}
                  </span>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-4 max-w-[512px] mx-auto">
                <div className="flex flex-col gap-3 pb-4 border-b border-border">
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
                  {eventRoom && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Event Room
                      </span>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-medium text-foreground">
                          {eventRoom.name} (Capacity: {eventRoom.capacity})
                        </span>
                        {eventRoom.allowsMultipleReservations && (
                          <span className="text-[10px] text-cyan-600">
                            Multiple reservations allowed
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9 border-[1.4px] border-background shrink-0">
                      <AvatarImage
                        src={`https://api.dicebear.com/9.x/glass/svg?seed=${reservation.id}`}
                      />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[13px] font-medium text-foreground leading-[18px]">
                          {organizerName}
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
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  {organizerCompany && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="p-1">
                        <CalendarIcon className="size-4" />
                      </div>
                      <span>Company: {organizerCompany}</span>
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
                        <span className="text-green-600 font-medium">
                          Confirmed
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Pending
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {services.length > 0 && (
                  <div className="flex flex-col gap-2 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <div className="p-1">
                        <FilePlus className="size-4" />
                      </div>
                      <span>Services</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {services.map((service) => (
                        <span
                          key={service.label}
                          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
                        >
                          {service.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {reservation.notes && (
                  <div className="pt-4 border-t border-border">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
