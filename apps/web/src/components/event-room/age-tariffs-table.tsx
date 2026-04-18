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
import type { AgeGroupTariff } from "@/types/event-room";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

const PAGE_SIZES = [5, 10, 15, 25];

export interface AgeGroupTariffsTableProps {
  tariffs: AgeGroupTariff[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onEdit: (tariff: AgeGroupTariff) => void;
  onDelete: (id: string) => void;
}

export function AgeGroupTariffsTable({
  tariffs,
  total,
  page,
  limit,
  onPageChange,
  onLimitChange,
  onEdit,
  onDelete,
}: AgeGroupTariffsTableProps) {
  const totalPages = Math.ceil(total / limit);

  if (total === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="size-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            No age group tariffs found
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Create one to get started.
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
            {(page - 1) * limit + 1}
            &ndash;
            {Math.min(page * limit, total)}
          </span>{" "}
          of <span className="font-medium text-foreground">{total}</span>{" "}
          tariffs
        </p>
        <Select
          value={limit.toString()}
          onValueChange={(value) => onLimitChange(Number(value))}
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
                Room
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Tariff Name
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Age Range
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Price
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Validity Period
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tariffs.map((tariff, index) => (
              <TableRow
                key={tariff.id}
                className={cn(
                  "border-border/40 transition-colors hover:bg-muted/30",
                  index % 2 === 0 ? "bg-card" : "bg-card/60",
                )}
              >
                <TableCell className="px-4 py-3.5">
                  <span className="font-medium text-foreground">
                    {tariff.roomName || "Unknown Room"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="text-muted-foreground">
                    {tariff.name}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="text-muted-foreground">
                    {tariff.maxAge
                      ? `${tariff.minAge} - ${tariff.maxAge} years`
                      : `${tariff.minAge}+ years`}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="text-muted-foreground">
                    {tariff.price ? `${tariff.price} CUP` : "—"}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <div className="text-xs text-muted-foreground">
                    {tariff.validFrom && tariff.validTo ? (
                      <span>
                        {new Date(tariff.validFrom).toLocaleDateString()} - {new Date(tariff.validTo).toLocaleDateString()}
                      </span>
                    ) : tariff.validFrom ? (
                      <span>From {new Date(tariff.validFrom).toLocaleDateString()}</span>
                    ) : tariff.validTo ? (
                      <span>Until {new Date(tariff.validTo).toLocaleDateString()}</span>
                    ) : (
                      <span className="text-green-600">Always active</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEdit(tariff)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => onDelete(tariff.id)}
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
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/60"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "size-8 rounded-lg text-xs font-medium",
                    page === pageNum
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/60"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
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