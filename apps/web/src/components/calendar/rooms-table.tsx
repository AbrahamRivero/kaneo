import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZES = [5, 10, 15, 25];

export interface Room {
  id: string;
  name: string;
  capacity: number;
  description?: string | null | undefined;
}

interface RoomsTableProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

export function RoomsTable({ rooms, onEdit, onDelete }: RoomsTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(rooms.length / pageSize);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (rooms.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="size-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No rooms found</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Event rooms will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {(currentPage - 1) * pageSize + 1}
            &ndash;
            {Math.min(currentPage * pageSize, rooms.length)}
          </span>{" "}
          of <span className="font-medium text-foreground">{rooms.length}</span>{" "}
          rooms
        </p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[130px] rounded-lg border-border/60 text-xs">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent align="end">
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Capacity
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRooms.map((room, index) => (
              <TableRow
                key={room.id}
                className={cn(
                  "border-border/40 transition-colors hover:bg-muted/30",
                  index % 2 === 0 ? "bg-card" : "bg-card/60",
                )}
              >
                <TableCell className="px-4 py-3.5">
                  <span className="font-medium text-foreground">
                    {room.name}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Users className="size-4" />
                    {room.capacity}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="text-muted-foreground">
                    {room.description || "—"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(room)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(room)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/60"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "size-8 rounded-lg text-xs font-medium",
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/60"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
