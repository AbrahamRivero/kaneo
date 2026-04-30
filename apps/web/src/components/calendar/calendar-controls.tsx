"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  DollarSign,
  DoorOpen,
  FileText,
  Plus,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import type { EventRoom } from "@/fetchers/event-room";

interface CalendarControlsProps {
  eventRooms: EventRoom[];
  onOpenReports?: () => void;
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
      <span className="font-medium truncate min-w-0">
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

export function CalendarControls({
  eventRooms,
  onOpenReports,
}: CalendarControlsProps) {
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
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const selectedRoom = eventRooms.find((r) => r.id === eventRoomFilter);

  const handleAddStatusFilter = (status: string) => {
    setReservationStatusFilter(
      status as "all" | "pending" | "confirmed" | "completed" | "cancelled",
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
                "h-7 px-2 gap-1.5 justify-start font-normal text-xs shrink-0",
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

        {onOpenReports && (
          <Button
            variant="outline"
            className="h-7 px-2 text-xs gap-1 shrink-0"
            onClick={onOpenReports}
          >
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Reports</span>
          </Button>
        )}

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
          <PopoverContent
            className="p-0 w-[320px] sm:w-[400px] md:w-[520px] lg:w-[640px] max-h-[80vh] overflow-hidden bg-background/95 backdrop-blur-sm border border-border/60 shadow-xl rounded-xl"
            align="start"
            side="bottom"
          >
            <div className="flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => {
                      setReservationStatusFilter("all");
                      setEventRoomFilter(null);
                      setPaymentConfirmedFilter("all");
                      setFilterPopoverOpen(false);
                    }}
                  >
                    <X className="size-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                        <CircleDashed className="size-4 text-amber-500" />
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Status
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between h-8 px-3 text-xs rounded-lg transition-all",
                            reservationStatusFilter === "pending"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => handleAddStatusFilter("pending")}
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="size-3.5 text-amber-500" />
                            <span className="font-medium">Pending</span>
                          </div>
                          {reservationStatusFilter === "pending" && (
                            <Check className="size-4 text-amber-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between h-8 px-3 text-xs rounded-lg transition-all",
                            reservationStatusFilter === "confirmed"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => handleAddStatusFilter("confirmed")}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="size-3.5 text-green-500" />
                            <span className="font-medium">Confirmed</span>
                          </div>
                          {reservationStatusFilter === "confirmed" && (
                            <Check className="size-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between h-8 px-3 text-xs rounded-lg transition-all",
                            reservationStatusFilter === "completed"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => handleAddStatusFilter("completed")}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCheck className="size-3.5 text-blue-500" />
                            <span className="font-medium">Completed</span>
                          </div>
                          {reservationStatusFilter === "completed" && (
                            <Check className="size-4 text-blue-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between h-8 px-3 text-xs rounded-lg transition-all",
                            reservationStatusFilter === "cancelled"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => handleAddStatusFilter("cancelled")}
                        >
                          <div className="flex items-center gap-2">
                            <XCircle className="size-3.5 text-red-500" />
                            <span className="font-medium">Cancelled</span>
                          </div>
                          {reservationStatusFilter === "cancelled" && (
                            <Check className="size-4 text-red-500" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                        <DollarSign className="size-4 text-emerald-500" />
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          Payment
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between h-8 px-3 text-xs rounded-lg transition-all",
                            paymentConfirmedFilter === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() => handleAddPaymentFilter("confirmed")}
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="size-3.5 text-emerald-500" />
                            <span className="font-medium">Confirmed</span>
                          </div>
                          {paymentConfirmedFilter === "confirmed" && (
                            <Check className="size-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-between h-8 px-3 text-xs rounded-lg transition-all",
                            paymentConfirmedFilter === "not_confirmed"
                              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground",
                          )}
                          onClick={() =>
                            handleAddPaymentFilter("not_confirmed")
                          }
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="size-3.5 text-orange-500" />
                            <span className="font-medium">Not confirmed</span>
                          </div>
                          {paymentConfirmedFilter === "not_confirmed" && (
                            <Check className="size-4 text-orange-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="my-4 border-gray-300 dark:border-gray-600" />
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-300 dark:border-gray-600">
                    <DoorOpen className="size-4 text-violet-500" />
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Space
                    </h4>
                    {eventRoomFilter && (
                      <span className="text-[10px] text-violet-500 font-medium">
                        (
                        {eventRooms.find((r) => r.id === eventRoomFilter)?.name}
                        )
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eventRooms.map((room) => (
                      <Button
                        key={room.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-7 px-3 text-xs rounded-full transition-all border",
                          eventRoomFilter === room.id
                            ? "border-violet-500 bg-violet-500/15 text-violet-600 dark:text-violet-300"
                            : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => handleAddSpaceFilter(room.id)}
                      >
                        <DoorOpen className="size-3 mr-1.5 text-violet-500" />
                        <span>{room.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
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
