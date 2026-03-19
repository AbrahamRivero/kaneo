import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DateRange,
  type EventRoom,
  getReservations,
} from "@/fetchers/event-room";
import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from "date-fns";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

export type ReportPeriod = "weekly" | "monthly" | "quarterly";

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

interface ReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  eventRooms: EventRoom[];
}

function getDateRange(period: ReportPeriod): {
  startDate: string;
  endDate: string;
  label: string;
} {
  const today = new Date();

  switch (period) {
    case "weekly":
      return {
        startDate: format(
          startOfWeek(today, { weekStartsOn: 1 }),
          "yyyy-MM-dd",
        ),
        endDate: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        label: `Week of ${format(startOfWeek(today, { weekStartsOn: 1 }), "MMM dd, yyyy")}`,
      };
    case "monthly":
      return {
        startDate: format(startOfMonth(today), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd"),
        label: format(today, "MMMM yyyy"),
      };
    case "quarterly":
      return {
        startDate: format(startOfQuarter(today), "yyyy-MM-dd"),
        endDate: format(endOfQuarter(today), "yyyy-MM-dd"),
        label: `Q${Math.ceil((today.getMonth() + 1) / 3)} ${format(today, "yyyy")}`,
      };
  }
}

function formatEventInfo(reservation: {
  title?: string | null;
  clientName: string;
  companyName?: string | null;
}): string {
  const parts = [];
  if (reservation.title) parts.push(reservation.title);
  if (reservation.clientName) parts.push(reservation.clientName);
  if (reservation.companyName) parts.push(reservation.companyName);
  return parts.join(" / ") || "-";
}

function formatStatus(status: string | null): string {
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
      return "Pending";
  }
}

function formatPayment(paymentConfirmed: boolean | null | undefined): string {
  return paymentConfirmed ? "Yes" : "No";
}

export function ReportsDialog({
  open,
  onOpenChange,
  workspaceId,
  eventRooms,
}: ReportsDialogProps) {
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const { startDate, endDate, label } = getDateRange(period);

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const reservations = await getReservations(
        workspaceId,
        startDate,
        endDate,
        selectedRoomId !== "all" ? selectedRoomId : undefined,
      );

      const reservationsWithRoom = reservations.map((res) => ({
        ...res,
        roomName: eventRooms.find((r) => r.id === res.eventRoomId)?.name || "",
      }));

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to print");
        return;
      }

      const roomLabel =
        selectedRoomId === "all"
          ? "All Rooms"
          : eventRooms.find((r) => r.id === selectedRoomId)?.name || "";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reservations Report - ${label}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Calibri', 'Segoe UI', sans-serif; 
              padding: 20px;
              color: #333;
            }
            .header {
              margin-bottom: 20px;
              border-bottom: 2px solid #4472c4;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 24px;
              color: #4472c4;
              margin-bottom: 5px;
            }
            .header .subtitle {
              font-size: 14px;
              color: #666;
            }
            .meta {
              display: flex;
              gap: 30px;
              margin-bottom: 20px;
              font-size: 12px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              color: #888;
              font-size: 10px;
              text-transform: uppercase;
            }
            .meta-value {
              font-weight: 600;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th {
              background-color: #4472c4;
              color: white;
              padding: 10px 8px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #365a8a;
            }
            td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e8f0fe;
            }
            .status {
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 11px;
              font-weight: 500;
            }
            .status-confirmed { background-color: #d1fae5; color: #065f46; }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .status-completed { background-color: #e0e7ff; color: #3730a3; }
            .yes { color: #059669; font-weight: 600; }
            .no { color: #dc2626; font-weight: 600; }
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 10px;
              color: #888;
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Reservations Report</h1>
            <div class="subtitle">Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}</div>
          </div>
          
          <div class="meta">
            <div class="meta-item">
              <span class="meta-label">Period</span>
              <span class="meta-value">${label}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date Range</span>
              <span class="meta-value">${startDate} to ${endDate}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Room</span>
              <span class="meta-value">${roomLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Reservations</span>
              <span class="meta-value">${reservationsWithRoom.length}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30%">Event / Client / Company</th>
                <th style="width: 15%">Date</th>
                <th style="width: 20%">Room</th>
                <th style="width: 15%">Status</th>
                <th style="width: 10%">Payment</th>
              </tr>
            </thead>
            <tbody>
              ${
                reservationsWithRoom.length === 0
                  ? `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 30px; color: #888;">
                    No reservations found for this period
                  </td>
                </tr>
              `
                  : reservationsWithRoom
                      .map(
                        (res) => `
                <tr>
                  <td>${formatEventInfo(res)}</td>
                  <td>${(() => {
                    const dr = parseDateRange(res.dateRange);
                    return format(
                      new Date(`${dr.from}T00:00:00`),
                      "MMM dd, yyyy",
                    );
                  })()}</td>
                  <td>${res.roomName}</td>
                  <td><span class="status status-${res.status || "pending"}">${formatStatus(res.status)}</span></td>
                  <td class="${res.paymentConfirmed ? "yes" : "no"}">${formatPayment(res.paymentConfirmed)}</td>
                </tr>
              `,
                      )
                      .join("")
              }
            </tbody>
          </table>

          <div class="footer">
            <span>Kaneo - Event Room Management</span>
            <span>Page 1</span>
          </div>

          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="
              background: #4472c4;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              cursor: pointer;
              border-radius: 5px;
              margin-right: 10px;
            ">Print / Save as PDF</button>
            <button onclick="window.close()" style="
              background: #6b7280;
              color: white;
              border: none;
              padding: 10px 20px;
              font-size: 14px;
              cursor: pointer;
              border-radius: 5px;
            ">Close</button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Error generating report");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[280px]">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base">Generate Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as ReportPeriod)}
          >
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="quarterly">This Quarter</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
            <SelectTrigger className="w-full h-8 text-sm">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {eventRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            className="w-full h-8 text-sm mt-2"
            onClick={generateReport}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-3.5 w-3.5" />
            )}
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
