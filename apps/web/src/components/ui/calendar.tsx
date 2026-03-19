import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import * as React from "react";
import { type DayButton, DayPicker } from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2.5rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: "w-fit",
        months: "flex flex-col gap-4 sm:flex-row relative",
        month: "flex flex-col gap-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1 absolute inset-x-0 z-10",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 opacity-50 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 p-0 opacity-50 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        table: "w-full",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        week_number_header: "w-[--cell-size] select-none",
        week_number: "text-muted-foreground select-none text-[0.8rem]",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal relative focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        ),
        range_end: "day-range-end",
        range_start: "day-range-start",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-[--cell-size] items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "h-9 w-9 p-0 font-normal",
        modifiers.today && "bg-accent text-accent-foreground",
        modifiers.selected &&
          !modifiers.range_start &&
          !modifiers.range_end &&
          !modifiers.range_middle &&
          "bg-primary text-primary-foreground",
        modifiers.range_start &&
          "bg-primary text-primary-foreground rounded-l-md rounded-r-none",
        modifiers.range_end &&
          "bg-primary text-primary-foreground rounded-r-md rounded-l-none",
        modifiers.range_middle &&
          "bg-accent text-accent-foreground rounded-none",
        modifiers.outside && "text-muted-foreground opacity-50",
        modifiers.disabled &&
          "text-muted-foreground opacity-50 pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
