import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COLS,
  ROWS,
  cellKey,
  isInSearchHighlight,
  type PhoneBoardCellMap,
} from "@/types/phone-board";
import type { PhoneBoardCell as PhoneBoardCellType } from "@/types/phone-board";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { PhoneBoardCell } from "./phone-board-cell";

interface PhoneBoardTableProps {
  cells: PhoneBoardCellMap;
  searchTarget: { row: number; col: number } | null;
  onCellChange: (row: number, col: number, value: PhoneBoardCellType) => void;
  onSearch: (extension: string) => void;
  isSaving?: boolean;
}

export function PhoneBoardTable({
  cells,
  searchTarget,
  onCellChange,
  onSearch,
  isSaving,
}: PhoneBoardTableProps) {
  const [searchInput, setSearchInput] = useState("");

  const usedExtensions = useMemo(() => {
    const set = new Set<string>();
    for (const key of Object.keys(cells)) {
      const c = cells[key];
      if (c?.extension && !c.blocked) set.add(c.extension);
    }
    return set;
  }, [cells]);

  const handleSearch = () => {
    const trimmed = searchInput.trim().replace(/\D/g, "").slice(0, 3);
    if (trimmed.length === 3) {
      onSearch(trimmed);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search extension (3 digits)"
            value={searchInput}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 3);
              setSearchInput(v);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 h-10 font-mono text-base"
            maxLength={3}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleSearch}
          disabled={searchInput.trim().replace(/\D/g, "").length !== 3}
          className="h-10 px-6"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
        <div className="overflow-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80 border-b">
              <tr>
                <th className="w-14 min-w-14 border-r border-border p-2 text-center text-muted-foreground font-semibold text-sm">
                  #
                </th>
                {Array.from({ length: COLS }, (_, i) => i + 1).map((col) => (
                  <th
                    key={col}
                    className="min-w-[5rem] sm:min-w-[6rem] w-20 border-r border-border p-2 text-center text-muted-foreground font-semibold text-sm"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => (
                <tr key={row} className="hover:bg-muted/30 transition-colors">
                  <td className="sticky left-0 z-10 w-14 min-w-14 border-r border-border bg-muted/90 backdrop-blur supports-[backdrop-filter]:bg-muted/70 p-2 text-center text-muted-foreground font-semibold text-sm">
                    {row}
                  </td>
                  {Array.from({ length: COLS }, (_, i) => i + 1).map((col) => {
                    const key = cellKey(row, col);
                    const cell = cells[key];
                    const highlight = searchTarget
                      ? isInSearchHighlight(row, col, searchTarget.row, searchTarget.col)
                      : "none";
                    return (
                      <td
                        key={key}
                        className="border-b border-r border-border p-1.5 align-top"
                      >
                        <PhoneBoardCell
                          row={row}
                          col={col}
                          cell={cell}
                          highlight={highlight}
                          usedExtensions={usedExtensions}
                          onCellChange={onCellChange}
                          disabled={isSaving}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
