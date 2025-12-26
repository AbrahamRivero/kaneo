"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Plus, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskFilters } from "./task-filters";
import { TaskSort } from "./task-sort";
import { TaskImportExport } from "./task-import-export";

export function TaskHeader() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    new Date("2024-09-07")
  );
  return (
    <div className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-3 lg:px-6 py-3">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-semibold">Tarea</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <ThemeToggle />

          <Button
            variant="secondary"
            size="sm"
            className="gap-2 hidden lg:flex"
          >
            <LinkIcon className="size-4" />
            Share
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 lg:px-6 py-3 border-t border-border overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <TaskFilters />
          <TaskSort />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hidden lg:flex font-normal"
              >
                <CalendarIcon className="size-4" />
                {date
                  ? date.toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                onSelect={(selectedDate: Date | undefined) => {
                  setDate(selectedDate);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
          <TaskImportExport />
          <Button size="sm" className="sm:gap-2 shrink-0 flex items-center">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Crear tarea</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
