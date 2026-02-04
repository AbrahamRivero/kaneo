import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import type { PhoneBoardCell as CellType, PhoneBoardExtensionType } from "@/types/phone-board";
import { Lock, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const EXTENSION_REGEX = /^\d{3}$/;

type HighlightKind = "target" | "before-row" | "before-col" | "none";

interface PhoneBoardCellProps {
  row: number;
  col: number;
  cell: CellType | undefined;
  highlight: HighlightKind;
  usedExtensions: Set<string>;
  onCellChange: (row: number, col: number, value: CellType) => void;
  disabled?: boolean;
}

export function PhoneBoardCell({
  row,
  col,
  cell,
  highlight,
  usedExtensions,
  onCellChange,
  disabled,
}: PhoneBoardCellProps) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(cell?.blocked ?? false);
  const [extension, setExtension] = useState(cell?.extension ?? "");
  const [type, setType] = useState<PhoneBoardExtensionType | "">(
    cell?.type ?? "",
  );
  const [extensionError, setExtensionError] = useState("");

  useEffect(() => {
    if (open) {
      setBlocked(cell?.blocked ?? false);
      setExtension(cell?.extension ?? "");
      setType(cell?.type ?? "");
      setExtensionError("");
    }
  }, [open, cell?.blocked, cell?.extension, cell?.type]);

  const isBlocked = cell?.blocked ?? false;

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setBlocked(cell?.blocked ?? false);
        setExtension(cell?.extension ?? "");
        setType(cell?.type ?? "");
        setExtensionError("");
      }
      setOpen(next);
    },
    [cell],
  );

  const handleSave = useCallback(() => {
    if (blocked) {
      onCellChange(row, col, { blocked: true });
      setOpen(false);
      return;
    }
    const ext = extension.trim();
    if (!EXTENSION_REGEX.test(ext)) {
      setExtensionError("Extension must be 3 digits");
      return;
    }
    const others = new Set(usedExtensions);
    if (cell?.extension) others.delete(cell.extension);
    if (others.has(ext)) {
      setExtensionError("This extension is already used in another cell");
      return;
    }
    setExtensionError("");
    onCellChange(row, col, {
      blocked: false,
      extension: ext,
      type: type === "digital" || type === "analog" ? type : undefined,
    });
    setOpen(false);
  }, [
    blocked,
    extension,
    type,
    usedExtensions,
    cell?.extension,
    row,
    col,
    onCellChange,
  ]);

  const displayContent = isBlocked ? (
    <span className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm">
      <Lock className="h-4 w-4" />
      Blocked
    </span>
  ) : cell?.extension ? (
    <div className="flex flex-col items-center justify-center leading-tight gap-0.5">
      <span className="font-mono font-semibold text-base">
        {cell.extension}
      </span>
      {cell.type && (
        <span className="text-xs text-muted-foreground capitalize">
          {cell.type}
        </span>
      )}
    </div>
  ) : (
    <span className="text-muted-foreground/50 text-sm">—</span>
  );

  const highlightClass =
    highlight === "target"
      ? "bg-primary/20 dark:bg-primary/30 ring-2 ring-primary/50"
      : highlight === "before-row" || highlight === "before-col"
        ? "bg-accent/50"
        : "";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "min-w-[5rem] sm:min-w-[6rem] w-full aspect-square max-w-[7rem] flex items-center justify-center rounded-md border border-border bg-card text-center transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
            highlightClass,
          )}
        >
          {displayContent}
          {!disabled && (
            <span className="sr-only">
              Edit cell row {row} column {col}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`blocked-${row}-${col}`} className="text-base font-medium">Blocked cell</Label>
            <Switch
              id={`blocked-${row}-${col}`}
              checked={blocked}
              onCheckedChange={setBlocked}
            />
          </div>
          {!blocked && (
            <>
              <div className="space-y-2.5">
                <Label htmlFor={`ext-${row}-${col}`} className="text-sm font-medium">Extension (3 digits)</Label>
                <Input
                  id={`ext-${row}-${col}`}
                  value={extension}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                    setExtension(v);
                    setExtensionError("");
                  }}
                  placeholder="e.g. 101"
                  maxLength={3}
                  className="font-mono h-10 text-base"
                  aria-invalid={!!extensionError}
                />
                {extensionError && (
                  <p className="text-sm text-destructive">{extensionError}</p>
                )}
              </div>
              <div className="space-y-2.5">
                <Label className="text-sm font-medium">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as PhoneBoardExtensionType | "")}
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="analog">Analog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Pencil className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
