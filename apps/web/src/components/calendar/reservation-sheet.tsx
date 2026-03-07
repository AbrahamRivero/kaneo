import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Reservation } from "@/types/event-room";
import { format } from "date-fns";
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  FilePlus,
  FileText,
  Layers,
  Pen,
  Phone,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface ReservationSheetProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return format(date, "EEEE, MMMM dd");
}

export function EventSheet({ reservation, open, onOpenChange }: ReservationSheetProps) {
  if (!reservation) return null;

  const startDate = formatDate(reservation.startDate.toDateString());
  const endDate = formatDate(reservation.endDate.toDateString());
  const startTimeStr = formatTime(reservation.startTime);
  const endTimeStr = formatTime(reservation.endTime);

  const organizerName = reservation.clientName;
  const organizerCompany = reservation.companyName;
  const totalPax = reservation.adultPax + reservation.childrenPax

  return (
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
                >
                  <Pen className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-muted"
                >
                  <FileText className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-muted"
                >
                  <Layers className="size-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 hover:bg-muted"
                >
                  <Trash2 className="size-4 text-muted-foreground" />
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
                {reservation.title}
              </SheetTitle>
              <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                <span>{startDate}</span>
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span>
                  {startTimeStr} - {endTimeStr}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                <span>{endDate}</span>
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span>
                  {startTimeStr} - {endTimeStr}
                </span>
              </div>
            </div>

          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-4 max-w-[512px] mx-auto">
              <div className="flex flex-col gap-4">
                <div
                  className="flex items-start gap-3 relative"
                >
                  <Avatar className="size-7 border-[1.4px] border-background shrink-0">
                    <AvatarImage
                      src={`https://api.dicebear.com/9.x/glass/svg?seed=${reservation.id}`}
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 relative">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 relative">
                          <p className="text-[13px] font-medium text-foreground leading-[18px]">
                            {organizerName}
                          </p>
                          <span className="text-[10px] font-medium text-cyan-500 px-0.5 py-0.5 rounded-full">
                            Organizer
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-none">
                          {reservation.email}
                        </p>
                      </div>
                      <CheckCircle2 className="size-3 text-green-500 shrink-0 absolute right-0 top-[17px]" />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <Bell className="size-4" />
                  </div>
                  <span>Reminder: 30min before</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <CalendarIcon className="size-4" />
                  </div>
                  <span>Organizer: {organizerCompany}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <Phone className="size-4" />
                  </div>
                  <span>(CU) +53 {reservation.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <Users className="size-4" />
                  </div>
                  <span>
                    {totalPax} persons
                    <span className="mx-1">•</span>
                    {reservation.adultPax} adults pax
                    {reservation.childrenPax} children pax
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="p-1">
                    <FilePlus className="size-4" />
                  </div>
                  <span>Notes from Organizer</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground leading-[1.6]">
                  {reservation.notes}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
