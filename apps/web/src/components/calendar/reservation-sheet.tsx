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
  FileDown,
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
  eventRooms: EventRoom[];
  onDeleteSuccess: () => void;
}

function SingleReservationSection({
  reservation,
  dateStr,
  index,
  total,
  workspaceId,
  eventRooms,
  onDeleteSuccess,
}: SingleReservationSectionProps) {
  const navigate = useNavigate();
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const deleteReservation = useDeleteReservation();

  const dateRange = parseDateRange(reservation.dateRange);
  const dateRangeStr = formatDateRangeFromObject(dateRange);
  const days =
    dateRange.to && dateRange.to !== dateRange.from
      ? differenceInDays(
          new Date(`${dateRange.to}T00:00:00`),
          new Date(`${dateRange.from}T00:00:00`),
        ) + 1
      : 1;
  const dayTariffs = reservation.dayTariffs ?? [];

  const roomBreakdown =
    dayTariffs.length > 0
      ? Object.values(
          dayTariffs.reduce(
            (acc, dt) => {
              const sessionType = dt.sessionType ?? "unknown";
              if (!acc[sessionType]) {
                acc[sessionType] = { sessionType, days: 0, price: 0 };
              }
              acc[sessionType].days += 1;
              acc[sessionType].price += dt.price ?? 0;
              return acc;
            },
            {} as Record<
              string,
              { sessionType: string; days: number; price: number }
            >,
          ),
        )
      : reservation.totalRoomPrice
        ? [{ sessionType: "room", days, price: reservation.totalRoomPrice }]
        : [];

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

  const handleReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    const dateRange = parseDateRange(reservation.dateRange);
    const startDate = dateRange.from
      ? format(new Date(`${dateRange.from}T00:00:00`), "MMMM dd, yyyy")
      : "-";
    const endDate = dateRange.to
      ? format(new Date(`${dateRange.to}T00:00:00`), "MMMM dd, yyyy")
      : startDate;
    const dateRangeStr =
      dateRange.from === dateRange.to || !dateRange.to
        ? startDate
        : `${startDate} - ${endDate}`;
    const days =
      dateRange.to && dateRange.to !== dateRange.from
        ? differenceInDays(
            new Date(`${dateRange.to}T00:00:00`),
            new Date(`${dateRange.from}T00:00:00`),
          ) + 1
        : 1;

    const dayTariffs = reservation.dayTariffs ?? [];
    const services = reservation.services ?? [];
    const roomBreakdown =
      dayTariffs.length > 0
        ? Object.values(
            dayTariffs.reduce(
              (acc, dt) => {
                const sessionType = dt.sessionType ?? "unknown";
                if (!acc[sessionType]) {
                  acc[sessionType] = { sessionType, days: 0, price: 0 };
                }
                acc[sessionType].days += 1;
                acc[sessionType].price += dt.price ?? 0;
                return acc;
              },
              {} as Record<
                string,
                { sessionType: string; days: number; price: number }
              >,
            ),
          )
        : reservation.totalRoomPrice
          ? [{ sessionType: "room", days, price: reservation.totalRoomPrice }]
          : [];

    const roomName =
      eventRooms.find((r) => r.id === reservation.eventRoomId)?.name ||
      "Event Room";

    const getStatusLabel = (status?: string) => {
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
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reservation Report - ${reservation.title || reservation.clientName}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Calibri', 'Segoe UI', sans-serif; padding: 20px; color: #333; }
          .header { margin-bottom: 20px; border-bottom: 2px solid #4472c4; padding-bottom: 10px; }
          .header h1 { font-size: 24px; color: #4472c4; margin-bottom: 5px; }
          .header .subtitle { font-size: 14px; color: #666; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 600; color: #4472c4; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item { display: flex; flex-direction: column; }
          .info-label { font-size: 10px; color: #888; text-transform: uppercase; }
          .info-value { font-size: 14px; font-weight: 500; }
          .status { padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 500; }
          .status-confirmed { background-color: #d1fae5; color: #065f46; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-completed { background-color: #e0e7ff; color: #3730a3; }
          .yes { color: #059669; font-weight: 600; }
          .no { color: #dc2626; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px; }
          th { background-color: #4472c4; color: white; padding: 8px; text-align: left; font-weight: 600; border: 1px solid #365a8a; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .total-row { font-weight: 600; background-color: #e8f0fe; }
          .notes { background-color: #f8f9fa; padding: 12px; border-radius: 4px; font-size: 12px; line-height: 1.6; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
          .no-print { margin-top: 20px; text-align: center; }
          .no-print button { background: #4472c4; color: white; border: none; padding: 10px 20px; font-size: 14px; cursor: pointer; border-radius: 5px; margin-right: 10px; }
          .no-print button.close { background: #6b7280; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Reservation Report</h1>
          <div class="subtitle">Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}</div>
        </div>

        <div class="section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Room</span>
              <span class="info-value">${roomName}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Client Information</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Title / Event Name</span>
              <span class="info-value">${reservation.title || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Client Name</span>
              <span class="info-value">${reservation.clientName || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Company</span>
              <span class="info-value">${reservation.companyName || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Phone</span>
              <span class="info-value">${reservation.phone ? "+53 " + reservation.phone : "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">${reservation.email || "-"}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Expected Pax</span>
              <span class="info-value">${reservation.expectedPax ?? "-"}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Reservation Details</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Date Range</span>
              <span class="info-value">${dateRangeStr}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Duration</span>
              <span class="info-value">${days} day${days !== 1 ? "s" : ""}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value"><span class="status status-${reservation.status || "pending"}">${getStatusLabel(reservation.status)}</span></span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Confirmed</span>
              <span class="info-value ${reservation.paymentConfirmed ? "yes" : "no"}">${reservation.paymentConfirmed ? "Yes" : "No"}</span>
            </div>
          </div>
        </div>

        ${
          reservation.grandTotal
            ? `
        <div class="section">
          <div class="section-title">Pricing</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Details</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${roomBreakdown
                .map(
                  (room) => `
                <tr>
                  <td>Room (${room.sessionType.replace("_", " ")})</td>
                  <td>${room.days > 1 ? room.days + " days" : "1 day"}</td>
                  <td style="text-align: right;">$${room.price.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              ${
                (reservation.totalServicePrice ?? 0) > 0
                  ? `
                <tr>
                  <td>Total Services</td>
                  <td></td>
                  <td style="text-align: right;">$${(reservation.totalServicePrice ?? 0).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              ${
                (reservation.serviceChargeAmount ?? 0) > 0
                  ? `
                <tr>
                  <td>Service Charge</td>
                  <td></td>
                  <td style="text-align: right;">$${(reservation.serviceChargeAmount ?? 0).toFixed(2)}</td>
                </tr>
              `
                  : ""
              }
              <tr class="total-row">
                <td>Grand Total</td>
                <td></td>
                <td style="text-align: right;">$${(reservation.grandTotal ?? 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        ${
          services.length > 0
            ? `
        <div class="section">
          <div class="section-title">Services</div>
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th style="text-align: center;">Pax</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${services
                .map(
                  (service) => `
                <tr>
                  <td>${service.service?.name || "Service"}</td>
                  <td style="text-align: center;">${service.pax}</td>
                  <td style="text-align: right;">$${(service.unitPrice ?? 0).toFixed(2)}</td>
                  <td style="text-align: right;">$${(service.totalPrice ?? 0).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        ${
          reservation.notes
            ? `
        <div class="section">
          <div class="section-title">Notes</div>
          <div class="notes">${reservation.notes}</div>
        </div>
        `
            : ""
        }

        <div class="footer">
          <span>Kaneo - Event Room Management</span>
          <span>Page 1</span>
        </div>

        <div class="no-print">
          <button onclick="window.print()">Print / Save as PDF</button>
          <button class="close" onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
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
              className="size-7 hover:bg-muted"
              onClick={handleReport}
              title="Generate Report"
            >
              <FileDown className="size-3.5 text-muted-foreground" />
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
            {eventRooms.find((r) => r.id === reservation.eventRoomId)
              ?.allowsMultipleReservations &&
              (reservation.expectedPax ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <Users className="size-4" />
                  </div>
                  <span>Expected Pax: {reservation.expectedPax}</span>
                </div>
              )}
          </div>

          {hasPricing && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                <DollarSign className="size-4" />
                <span>Pricing</span>
              </div>
              <div className="text-xs bg-muted/50 p-3 rounded-lg space-y-2">
                {roomBreakdown.map((room) => (
                  <div key={room.sessionType} className="flex justify-between">
                    <span className="text-muted-foreground">
                      Room ({room.sessionType.replace("_", " ")}
                      {room.days > 1 ? ` × ${room.days} days` : ""})
                    </span>
                    <span>${room.price.toFixed(2)}</span>
                  </div>
                ))}
                {(reservation.totalServicePrice ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Services
                    </span>
                    <span>
                      ${(reservation.totalServicePrice ?? 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {(() => {
                  const subTotal =
                    (reservation.totalRoomPrice ?? 0) +
                    (reservation.totalServicePrice ?? 0);
                  const serviceChargePercent =
                    subTotal > 0 && (reservation.serviceChargeAmount ?? 0) > 0
                      ? Math.round(
                          ((reservation.serviceChargeAmount ?? 0) / subTotal) *
                            100,
                        )
                      : 0;
                  return (reservation.serviceChargeAmount ?? 0) > 0 ? (
                    <div className="flex justify-between text-muted-foreground">
                      <span>
                        Service Charge ({serviceChargePercent}% of Room +
                        Services)
                      </span>
                      <span>
                        ${(reservation.serviceChargeAmount ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ) : null;
                })()}
                <div className="flex justify-between font-medium border-t pt-2 mt-1">
                  <span>Total</span>
                  <span>${(reservation.grandTotal ?? 0).toFixed(2)}</span>
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
                  eventRooms={eventRooms}
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
