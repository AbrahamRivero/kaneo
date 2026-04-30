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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DateRange, EventRoom, Reservation } from "@/fetchers/event-room";
import {
  useDeleteReservation,
  useUpdatePaymentStatus,
  useUpdateReservation,
} from "@/hooks/mutations/event-room";
import { useGetAgeGroupTariffs } from "@/hooks/queries/event-room";
import { useGetUserName } from "@/hooks/queries/user/use-get-user-name";
import { useAuth } from "@/components/providers/auth-provider/hooks/use-auth";
import { useWorkspacePermission } from "@/hooks/useWorkspacePermission";
import queryClient from "@/query-client";
import { useNavigate } from "@tanstack/react-router";
import { differenceInDays, format } from "date-fns";
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileDown,
  HandCoins,
  Pen,
  Phone,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ReservationSheetProps {
  reservations: Reservation[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventRooms: EventRoom[];
  roomTariffs?: {
    id: string;
    sessionType: string;
    price: number | null;
    serviceChargePercent: number;
  }[];
  onReservationUpdate?: (updatedReservation: Reservation) => void;
}

const capitalizeWords = (str: string): string => {
  return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

function getReservationDateMeta(reservation: Reservation): {
  dateRange: DateRange;
  dateRangeStr: string;
  days: number;
} {
  const dateRange = parseDateRange(reservation.dateRange);
  const dateRangeStr = formatDateRangeFromObject(dateRange);
  const days =
    dateRange.to && dateRange.to !== dateRange.from
      ? differenceInDays(
          new Date(`${dateRange.to}T00:00:00`),
          new Date(`${dateRange.from}T00:00:00`),
        ) + 1
      : 1;

  return { dateRange, dateRangeStr, days };
}

function getRoomBreakdown(
  reservation: Reservation & {
    roomBreakdown?: Array<{
      sessionType: string;
      days: number;
      price: number;
    }>;
    totalRoomPrice?: number | null;
    roomTariffId?: string | null;
    dayTariffs?: Array<{
      date: string;
      price: number;
      sessionType?: string;
    }>;
  },
  days: number,
  _getAgePrice?: (name: "adult" | "child" | "infant", date: string) => number,
  _dateRange?: DateRange,
): { sessionType: string; days: number; price: number }[] {
  if (reservation.roomBreakdown && reservation.roomBreakdown.length > 0) {
    return reservation.roomBreakdown.map((item) => ({
      sessionType: item.sessionType,
      days: item.days,
      price: item.price,
    }));
  }

  const dayTariffs = reservation.dayTariffs ?? [];

  if (dayTariffs.length > 0) {
    return Object.values(
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
    );
  }

  const totalRoomPrice = reservation.totalRoomPrice ?? 0;
  const roomTariffId = reservation.roomTariffId;

  if (roomTariffId && totalRoomPrice > 0) {
    return [
      {
        sessionType: "room",
        days: days,
        price: totalRoomPrice,
      },
    ];
  }

  return [];
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
    case "cancelled":
      return "bg-red-500/20 text-red-600 dark:text-red-400";
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
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
}

function getStatusIcon(status?: string): React.ReactNode {
  switch (status) {
    case "confirmed":
      return <CheckCircle2 className="size-3 text-green-500" />;
    case "cancelled":
      return <XCircle className="size-3 text-red-500" />;
    default:
      return null;
  }
}

function getReservationCharges(
  reservation: Reservation & {
    totalRoomPrice?: number | null;
    totalServicePrice?: number | null;
    roomChargeAmount?: number | null;
    serviceChargeAmount?: number | null;
  },
  _hasAgeBasedPricing = false,
  _tariffServiceChargePercent = 0,
): {
  roomCharge: number;
  servicesCharge: number;
  roomServiceChargePercent: number;
} {
  const roomCharge = reservation.roomChargeAmount ?? 0;
  const servicesCharge = reservation.serviceChargeAmount ?? 0;
  const totalRoomPrice = reservation.totalRoomPrice ?? 0;

  let roomServiceChargePercent = 0;
  if (totalRoomPrice > 0 && roomCharge > 0) {
    roomServiceChargePercent = Math.round((roomCharge / totalRoomPrice) * 100);
  }

  return { roomCharge, servicesCharge, roomServiceChargePercent };
}

interface SingleReservationSectionProps {
  reservation: Reservation;
  dateStr: string;
  index: number;
  total: number;
  workspaceId: string;
  eventRooms: EventRoom[];
  roomTariffs?: {
    id: string;
    sessionType: string;
    price: number | null;
    serviceChargePercent: number;
  }[];
  onDeleteSuccess: () => void;
  onReservationUpdate?: (updatedReservation: Reservation) => void;
}

function SingleReservationSection({
  reservation,
  dateStr,
  index,
  total,
  workspaceId,
  eventRooms,
  roomTariffs,
  onDeleteSuccess,
  onReservationUpdate,
}: SingleReservationSectionProps) {
  const navigate = useNavigate();
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const deleteReservation = useDeleteReservation();
  const updatePaymentStatus = useUpdatePaymentStatus();
  const updateReservation = useUpdateReservation();
  const { user } = useAuth();
  const { isViewer } = useWorkspacePermission();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const { dateRange, dateRangeStr, days } = getReservationDateMeta(reservation);
  const eventRoom = eventRooms.find((r) => r.id === reservation.eventRoomId);
  const hasAgeBasedPricing = eventRoom?.hasAgeBasedPricing ?? false;

  const { data: ageTariffsData } = useGetAgeGroupTariffs(
    workspaceId,
    hasAgeBasedPricing ? reservation.eventRoomId : undefined,
  );
  const ageTariffs = ageTariffsData?.data ?? [];
  const { data: creatorName } = useGetUserName(reservation.userId);
  const { data: cancellerName } = useGetUserName(reservation.cancelledBy);

  const getDisplayName = (name: string | null | undefined, id: string | null | undefined, fallback: string) => {
    if (name) return name;
    if (id) return fallback;
    return "";
  };

  const getAgePrice = (name: "adult" | "child" | "infant", date: string) => {
    const validTariff = ageTariffs.find(
      (t) =>
        t.name?.toLowerCase() === name.toLowerCase() &&
        (!t.validFrom || new Date(t.validFrom) <= new Date(date)) &&
        (!t.validTo || new Date(t.validTo) >= new Date(date)),
    );
    return validTariff?.price ?? 0;
  };

  const selectedTariff = roomTariffs?.find(
    (t) => t.id === reservation.roomTariffId,
  );
  const tariffServiceChargePercent = selectedTariff?.serviceChargePercent ?? 0;

  const roomBreakdown = getRoomBreakdown(
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    reservation as any,
    days,
    getAgePrice,
    dateRange,
  );

  const hasPricing = (reservation.grandTotal ?? 0) > 0;

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

  const handleTogglePayment = async () => {
    try {
      const newPaymentStatus = !reservation.paymentConfirmed;
      const newStatus = newPaymentStatus ? "confirmed" : "pending";
      await updatePaymentStatus.mutateAsync({
        id: reservation.id,
        paymentConfirmed: newPaymentStatus,
      });
      toast.success(
        newPaymentStatus
          ? "Payment marked as paid"
          : "Payment marked as pending",
      );
      const updatedReservation: Reservation = {
        ...reservation,
        paymentConfirmed: newPaymentStatus,
        status: newStatus,
      };
      if (onReservationUpdate) {
        onReservationUpdate(updatedReservation);
      }
    } catch {
      toast.error("Failed to update payment status");
    }
  };

  const handleCancel = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to cancel a reservation");
      return;
    }
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        payload: {
          cancellationReason,
          cancelledBy: user.id,
          status: "cancelled",
        },
      } as Parameters<typeof updateReservation.mutateAsync>[0]);
      toast.success("Reservation cancelled successfully");
      setCancelDialogOpen(false);
      setCancellationReason("");
      const updatedReservation: Reservation = {
        ...reservation,
        status: "cancelled",
        cancellationReason,
        cancelledBy: user.id,
        updatedAt: new Date().toISOString(),
      };
      if (onReservationUpdate) {
        onReservationUpdate(updatedReservation);
      }
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Failed to cancel reservation");
    }
  };

  const handleReactivate = async () => {
    try {
      await updateReservation.mutateAsync({
        id: reservation.id,
        payload: {
          cancellationReason: undefined,
          cancelledBy: undefined,
          status: "pending",
        },
      } as Parameters<typeof updateReservation.mutateAsync>[0]);
      toast.success("Reservation reactivated successfully");
      const updatedReservation: Reservation = {
        ...reservation,
        status: "pending",
        cancellationReason: null,
        cancelledBy: null,
        updatedAt: new Date().toISOString(),
      };
      if (onReservationUpdate) {
        onReservationUpdate(updatedReservation);
      }
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      toast.error("Failed to reactivate reservation");
    }
  };

  const handleReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    const { dateRange, days } = getReservationDateMeta(reservation);
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
    const services = reservation.services ?? [];

    const getAgePriceForReport = (
      name: "adult" | "child" | "infant",
      date: string,
    ) => {
      const validTariff = ageTariffs.find(
        (t) =>
          t.name?.toLowerCase() === name.toLowerCase() &&
          (!t.validFrom || new Date(t.validFrom) <= new Date(date)) &&
          (!t.validTo || new Date(t.validTo) >= new Date(date)),
      );
      return validTariff?.price ?? 0;
    };

    const roomBreakdown = getRoomBreakdown(
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      reservation as any,
      days,
      getAgePriceForReport,
      dateRange,
    );

    const roomName =
      eventRooms.find((r) => r.id === reservation.eventRoomId)?.name ||
      "Event Room";

    const eventRoomForReport = eventRooms.find(
      (r) => r.id === reservation.eventRoomId,
    );
    const hasAgeBasedPricingForReport =
      eventRoomForReport?.hasAgeBasedPricing ?? false;

    const selectedTariffForReport = roomTariffs?.find(
      (t) => t.id === reservation.roomTariffId,
    );
    const tariffServiceChargePercentForReport =
      selectedTariffForReport?.serviceChargePercent ?? 0;

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
          .cancellation { background-color: #fee2e2; padding: 12px; border-radius: 4px; font-size: 12px; line-height: 1.6; }
          .cancellation-title { font-weight: 600; color: #991b1b; margin-bottom: 8px; }
          .cancellation-label { color: #666; font-size: 10px; text-transform: uppercase; }
          .cancellation-value { font-weight: 500; color: #333; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
          .no-print { margin-top: 20px; text-align: center; }
          .no-print button { background: #4472c4; color: white; border: none; padding: 10px 20px; font-size: 14px; cursor: pointer; border-radius: 5px; margin-right: 10px; }
          .no-print button.close { background: #6b7280; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/HOTEL PALCO.jpeg" alt="Hotel Palco" style="max-width: 150px; margin-bottom: 15px;" />
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
              <span class="info-label">Guests</span>
              <span class="info-value">${
                reservation.ageBreakdown &&
                (reservation.ageBreakdown.adults > 0 ||
                  reservation.ageBreakdown.children > 0 ||
                  reservation.ageBreakdown.infants > 0)
                  ? `${reservation.ageBreakdown.adults} adults, ${reservation.ageBreakdown.children} children, ${reservation.ageBreakdown.infants} infants`
                  : reservation.expectedPax && reservation.expectedPax > 0
                    ? `${reservation.expectedPax} Pax`
                    : "-"
              }</span>
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
              <span class="info-label">Created</span>
              <span class="info-value">${reservation.createdAt ? format(new Date(reservation.createdAt), "MMM dd, yyyy 'at' HH:mm") : "-"}</span>
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
          (reservation.grandTotal ?? 0) > 0
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
                  <td>${
                    room.sessionType.includes("Adults") ||
                    room.sessionType.includes("Children") ||
                    room.sessionType.includes("Infants")
                      ? room.sessionType
                      : `Room (${capitalizeWords(room.sessionType)})`
                  }</td>
                  <td>${room.days > 1 ? room.days + " Days" : "1 Day"}</td>
                  <td style="text-align: right;">$${room.price.toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
              ${(() => {
                const { roomCharge, roomServiceChargePercent } =
                  getReservationCharges(
                    reservation,
                    hasAgeBasedPricingForReport,
                    tariffServiceChargePercentForReport,
                  );

                let html = "";
                if (roomCharge > 0) {
                  html += `
                <tr>
                  <td>Room Service Charge (${roomServiceChargePercent}%)</td>
                  <td></td>
                  <td style="text-align: right;">$${roomCharge.toFixed(2)}</td>
                </tr>`;
                }
                const totalRoom =
                  (reservation.totalRoomPrice ?? 0) +
                  (reservation.roomChargeAmount ?? 0);
                if (totalRoom > 0) {
                  html += `
                <tr class="total-row">
                  <td>Total Room</td>
                  <td></td>
                  <td style="text-align: right;">$${totalRoom.toFixed(2)}</td>
                </tr>`;
                }
                return html;
              })()}
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
              ${(() => {
                const { servicesCharge } = getReservationCharges(
                  reservation,
                  hasAgeBasedPricingForReport,
                  tariffServiceChargePercentForReport,
                );

                let html = "";
                if (servicesCharge > 0) {
                  html += `
                <tr>
                  <td>Services Charge (10%)</td>
                  <td></td>
                  <td style="text-align: right;">$${servicesCharge.toFixed(2)}</td>
                </tr>`;
                }
                const totalServices =
                  (reservation.totalServicePrice ?? 0) +
                  (reservation.serviceChargeAmount ?? 0);
                if (totalServices > 0) {
                  html += `
                <tr class="total-row">
                  <td>Total Services</td>
                  <td></td>
                  <td style="text-align: right;">$${totalServices.toFixed(2)}</td>
                </tr>`;
                }
                return html;
              })()}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        ${
          (reservation.grandTotal ?? 0) > 0
            ? `
        <div class="section">
          <table>
            <tbody>
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
          reservation.notes
            ? `
        <div class="section">
          <div class="section-title">Notes</div>
          <div class="notes">${reservation.notes}</div>
        </div>
        `
            : ""
        }

        ${
          reservation.status === "cancelled" && reservation.cancellationReason
            ? `
        <div class="section">
          <div class="section-title">Cancellation Details</div>
          <div class="cancellation">
            <div class="cancellation-title">Reason</div>
            <div>
              <span class="cancellation-label">Reason: </span>
              <span class="cancellation-value">${reservation.cancellationReason}</span>
            </div>
            ${
              reservation.updatedAt
                ? `
            <div>
              <span class="cancellation-label">Cancelled on: </span>
              <span class="cancellation-value">${format(new Date(reservation.updatedAt), "MMM dd, yyyy 'at' HH:mm")}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>
        `
            : ""
        }

        <div class="footer">
          <span>PalcoDesk - Event Room Management</span>
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

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this reservation for{" "}
              <strong>{reservation.title || reservation.clientName}</strong> on{" "}
              {dateStr}. This will release the room immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter cancellation reason..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Reservation
            </Button>
            <Button
              variant="default"
              onClick={handleCancel}
              disabled={!cancellationReason.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Cancel Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              disabled={isViewer || reservation.status === "cancelled"}
            >
              <Pen className={`size-3.5 ${reservation.status === "cancelled" ? "text-muted-foreground/50" : "text-muted-foreground"}`} />
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
              className={`size-7 ${
                reservation.status === "cancelled"
                  ? "text-muted-foreground/30 cursor-not-allowed"
                  : reservation.paymentConfirmed
                    ? "text-green-500 hover:text-green-600"
                    : "text-amber-500 hover:text-amber-600"
              }`}
              onClick={handleTogglePayment}
              title={
                reservation.status === "cancelled"
                  ? "Cannot change payment for cancelled reservations"
                  : reservation.paymentConfirmed
                    ? "Mark as pending"
                    : "Mark as paid"
              }
              disabled={isViewer || reservation.status === "cancelled"}
            >
              <CreditCard className="size-3.5" />
            </Button>
            {reservation.status === "cancelled" ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 hover:bg-green-500/10"
                onClick={handleReactivate}
                title="Reactivate reservation"
                disabled={isViewer}
              >
                <XCircle className="size-3.5 text-green-500" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 hover:bg-orange-500/10"
                onClick={() => setCancelDialogOpen(true)}
                title="Cancel reservation"
                disabled={isViewer}
              >
                <XCircle className="size-3.5 text-orange-500" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-7 hover:bg-red-500/10"
              onClick={() => setDeleteAlertOpen(true)}
              title="Delete reservation"
              disabled={isViewer}
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1">
                <Clock className="size-4" />
              </div>
              <span>
                Created:{" "}
                {format(
                  new Date(reservation.createdAt),
                  "MMM dd, yyyy 'at' HH:mm",
                )}
                {reservation.userId && (
                  <> by {getDisplayName(creatorName, reservation.userId, "Loading...")}</>
                )}
              </span>
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
                <span>{reservation.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="p-1">
                {reservation.paymentConfirmed ? (
                  <HandCoins className="size-4 text-green-500" />
                ) : (
                  <HandCoins className="size-4 text-amber-500" />
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
              ((reservation.ageBreakdown &&
                (reservation.ageBreakdown.adults > 0 ||
                  reservation.ageBreakdown.children > 0 ||
                  reservation.ageBreakdown.infants > 0)) ||
                (reservation.expectedPax ?? 0) > 0) && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <Users className="size-4" />
                  </div>
                  <span>
                    {reservation.ageBreakdown &&
                    (reservation.ageBreakdown.adults > 0 ||
                      reservation.ageBreakdown.children > 0 ||
                      reservation.ageBreakdown.infants > 0)
                      ? `${reservation.ageBreakdown.adults} adults, ${reservation.ageBreakdown.children} children, ${reservation.ageBreakdown.infants} infants`
                      : `Pax: ${reservation.expectedPax}`}
                  </span>
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
                      {room.sessionType.includes("Adults") ||
                      room.sessionType.includes("Children") ||
                      room.sessionType.includes("Infants")
                        ? room.sessionType
                        : `Room (${capitalizeWords(room.sessionType)}${
                            room.days > 1 ? ` ${room.days} Days` : ""
                          })`}
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
                  const {
                    roomCharge,
                    servicesCharge,
                    roomServiceChargePercent,
                  } = getReservationCharges(
                    reservation,
                    hasAgeBasedPricing,
                    tariffServiceChargePercent,
                  );

                  return (
                    <>
                      {roomCharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>
                            Room Service Charge ({roomServiceChargePercent}%)
                          </span>
                          <span>${roomCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {servicesCharge > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Services Charge (10%)</span>
                          <span>${servicesCharge.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  );
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

          {reservation.status === "cancelled" && reservation.cancellationReason && (
            <div className="pt-2 border-t border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
                <XCircle className="size-4" />
                <span>Cancellation Details</span>
              </div>
              <div className="text-xs bg-red-50 dark:bg-red-950/30 p-3 rounded-lg space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason:</span>
                  <span className="text-foreground font-medium">{reservation.cancellationReason}</span>
                </div>
                {reservation.cancelledBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled by:</span>
                    <span className="text-foreground">
                      {getDisplayName(cancellerName, reservation.cancelledBy, "Loading...")}
                    </span>
                  </div>
                )}
                {reservation.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled on:</span>
                    <span className="text-foreground">
                      {format(new Date(reservation.updatedAt), "MMM dd, yyyy 'at' HH:mm")}
                    </span>
                  </div>
                )}
              </div>
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
  roomTariffs,
  onReservationUpdate,
}: ReservationSheetProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [localReservations, setLocalReservations] = useState<
    Reservation[] | null
  >(null);

  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      setLocalReservations(reservations);
    }
  }, [open, reservations]);

  const handleReservationUpdate = (updatedReservation: Reservation) => {
    if (!localReservations) return;
    const updated = localReservations.map((res) =>
      res.id === updatedReservation.id ? updatedReservation : res,
    );
    setLocalReservations(updated);
    if (onReservationUpdate) {
      onReservationUpdate(updatedReservation);
    }
  };

  const currentReservations = localReservations || reservations;

  if (!currentReservations || currentReservations.length === 0) return null;

  const firstReservation = currentReservations[0];
  const eventRoom = eventRooms.find(
    (r) => r.id === firstReservation.eventRoomId,
  );
  const roomName = eventRoom?.name || "Event Room";
  const firstDateRange = parseDateRange(firstReservation.dateRange);
  const dateStr = formatDateRangeFromObject(firstDateRange);

  const handleDeleteSuccess = () => {
    setRefreshKey((k) => k + 1);
    if (refreshKey >= currentReservations.length - 1) {
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
                  {currentReservations.length} reservation
                  {currentReservations.length !== 1 ? "s" : ""}
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
              {currentReservations.map((reservation, index) => (
                <SingleReservationSection
                  key={reservation.id}
                  reservation={reservation}
                  dateStr={dateStr}
                  index={index}
                  total={currentReservations.length}
                  workspaceId={workspaceId}
                  eventRooms={eventRooms}
                  roomTariffs={roomTariffs}
                  onDeleteSuccess={handleDeleteSuccess}
                  onReservationUpdate={handleReservationUpdate}
                />
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
