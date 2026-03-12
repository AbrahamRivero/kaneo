"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/calendar-store";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Check,
  CheckCheck,
  CheckCircle,
  CircleDashed,
  Clock,
  DoorOpen,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import type { EventRoom } from "@/fetchers/event-room";

interface CalendarControlsProps {
  eventRooms: EventRoom[];
}

interface FilterPillProps {
  label: string;
  value: string;
  onRemove: () => void;
  icon?: React.ReactNode;
}

function FilterPill({ label, value, onRemove, icon }: FilterPillProps) {
  return (
    <div className="flex items-center gap-1 h-7 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full hover:bg-secondary/80 transition-colors">
      {icon && <span className="size-3 shrink-0">{icon}</span>}
      <span className="font-medium truncate max-w-[100px]">
        {label}: {value}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5 shrink-0"
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

export function CalendarControls({ eventRooms }: CalendarControlsProps) {
  const {
    searchQuery,
    setSearchQuery,
    goToToday,
    goToDate,
    currentWeekStart,
    reservationStatusFilter,
    setReservationStatusFilter,
    eventRoomFilter,
    setEventRoomFilter,
    paymentConfirmedFilter,
    setPaymentConfirmedFilter,
  } = useCalendarStore();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const weekStart = format(currentWeekStart, "MMM dd");
  const weekEnd = format(
    new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    "MMM dd yyyy",
  );

  const hasActiveFilters =
    reservationStatusFilter !== "all" ||
    eventRoomFilter !== null ||
    paymentConfirmedFilter !== "all";

  const activeFilterCount = [
    reservationStatusFilter !== "all",
    eventRoomFilter !== null,
    paymentConfirmedFilter !== "all",
  ].filter(Boolean).length;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const selectedRoom = eventRooms.find((r) => r.id === eventRoomFilter);

  const handleAddStatusFilter = (status: string) => {
    setReservationStatusFilter(
      status as "all" | "pending" | "confirmed" | "cancelled" | "completed",
    );
    setFilterPopoverOpen(false);
  };

  const handleAddSpaceFilter = (roomId: string) => {
    setEventRoomFilter(roomId);
    setFilterPopoverOpen(false);
  };

  const handleAddPaymentFilter = (status: string) => {
    setPaymentConfirmedFilter(status as "all" | "confirmed" | "not_confirmed");
    setFilterPopoverOpen(false);
  };

  return (
    <div className="px-3 md:px-6 py-3 border-b border-border">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[150px] max-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-7 text-xs bg-background"
          />
        </div>

        <Button
          variant="outline"
          className="h-7 px-2 text-xs shrink-0"
          onClick={goToToday}
        >
          Today
        </Button>

        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-7 px-2 gap-1.5 justify-start text-left font-normal text-xs shrink-0",
                "hover:bg-accent",
              )}
            >
              <CalendarIcon className="size-3.5 text-muted-foreground" />
              <span className="text-xs">
                {weekStart} - {weekEnd}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentWeekStart}
              onSelect={(date) => {
                if (date) {
                  goToDate(date);
                  setDatePickerOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs gap-1 shrink-0"
            >
              <Plus className="size-3" />
              <span className="hidden sm:inline">Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-[200px]! min-w-[200px]!" align="end">
            <div className="space-y-2">
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                  Status
                </h4>
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 px-2 text-xs"
                    onClick={() => handleAddStatusFilter("pending")}
                  >
                    <div className="flex items-center">
                      <Clock className="size-3 mr-1.5 text-muted-foreground" />
                      Pending
                    </div>
                    {reservationStatusFilter === "pending" && (
                      <Check className="size-3 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 px-2 text-xs"
                    onClick={() => handleAddStatusFilter("confirmed")}
                  >
                    <div className="flex items-center">
                      <CheckCircle className="size-3 mr-1.5 text-green-500" />
                      Confirmed
                    </div>
                    {reservationStatusFilter === "confirmed" && (
                      <Check className="size-3 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 px-2 text-xs"
                    onClick={() => handleAddStatusFilter("cancelled")}
                  >
                    <div className="flex items-center">
                      <XCircle className="size-3 mr-1.5 text-red-500" />
                      Cancelled
                    </div>
                    {reservationStatusFilter === "cancelled" && (
                      <Check className="size-3 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 px-2 text-xs"
                    onClick={() => handleAddStatusFilter("completed")}
                  >
                    <div className="flex items-center">
                      <CheckCheck className="size-3 mr-1.5 text-muted-foreground" />
                      Completed
                    </div>
                    {reservationStatusFilter === "completed" && (
                      <Check className="size-3 text-primary" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator className="my-1" />

              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                  Space
                </h4>
                <div className="space-y-0.5">
                  {eventRooms.slice(0, 5).map((room) => (
                    <Button
                      key={room.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between h-7 px-2 text-xs"
                      onClick={() => handleAddSpaceFilter(room.id)}
                    >
                      <div className="flex items-center">
                        <DoorOpen className="size-3 mr-1.5 text-muted-foreground" />
                        {room.name}
                      </div>
                      {eventRoomFilter === room.id && (
                        <Check className="size-3 text-primary" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="my-1" />

              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 px-1">
                  Payment
                </h4>
                <div className="space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 px-2 text-xs"
                    onClick={() => handleAddPaymentFilter("confirmed")}
                  >
                    <div className="flex items-center">
                      <CheckCircle className="size-3 mr-1.5 text-green-500" />
                      Confirmed
                    </div>
                    {paymentConfirmedFilter === "confirmed" && (
                      <Check className="size-3 text-primary" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-7 px-2 text-xs"
                    onClick={() => handleAddPaymentFilter("not_confirmed")}
                  >
                    <div className="flex items-center">
                      <Clock className="size-3 mr-1.5 text-muted-foreground" />
                      Not confirmed
                    </div>
                    {paymentConfirmedFilter === "not_confirmed" && (
                      <Check className="size-3 text-primary" />
                    )}
                  </Button>
                </div>
              </div>

              {hasActiveFilters && (
                <>
                  <Separator className="my-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => {
                      setReservationStatusFilter("all");
                      setEventRoomFilter(null);
                      setPaymentConfirmedFilter("all");
                      setFilterPopoverOpen(false);
                    }}
                  >
                    <X className="size-3 mr-1.5" />
                    Clear all filters
                  </Button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {reservationStatusFilter !== "all" && (
              <FilterPill
                label="Status"
                value={getStatusLabel(reservationStatusFilter)}
                onRemove={() => setReservationStatusFilter("all")}
                icon={<CircleDashed className="size-3 text-muted-foreground" />}
              />
            )}
            {eventRoomFilter !== null && selectedRoom && (
              <FilterPill
                label="Space"
                value={selectedRoom.name}
                onRemove={() => setEventRoomFilter(null)}
                icon={<DoorOpen className="size-3 text-muted-foreground" />}
              />
            )}
            {paymentConfirmedFilter !== "all" && (
              <FilterPill
                label="Payment"
                value={
                  paymentConfirmedFilter === "confirmed"
                    ? "Confirmed"
                    : "Pending"
                }
                onRemove={() => setPaymentConfirmedFilter("all")}
                icon={
                  paymentConfirmedFilter === "confirmed" ? (
                    <CheckCircle className="size-3 text-green-500" />
                  ) : (
                    <Clock className="size-3 text-muted-foreground" />
                  )
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
