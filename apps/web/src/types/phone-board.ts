export type PhoneBoardExtensionType = "digital" | "analog";

export type PhoneBoardCell = {
  extension?: string;
  type?: PhoneBoardExtensionType;
  blocked?: boolean;
};

export type PhoneBoardCellMap = Record<string, PhoneBoardCell>;

export const ROWS = 50;
export const COLS = 10;

export function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function parseCellKey(key: string): { row: number; col: number } {
  const [row, col] = key.split("-").map(Number);
  return { row, col };
}

/** Returns true if cell (r,c) is "before" (row,col) in matrix order (by row then column). */
export function isBeforeInMatrix(
  r: number,
  c: number,
  row: number,
  col: number,
): boolean {
  if (r < row) return true;
  if (r > row) return false;
  return c < col;
}

/** Check if (r,c) is on the same row as target but before col, or same col but before row. */
export function isInSearchHighlight(
  r: number,
  c: number,
  targetRow: number,
  targetCol: number,
): "target" | "before-row" | "before-col" | "none" {
  if (r === targetRow && c === targetCol) return "target";
  if (r === targetRow && c < targetCol) return "before-row";
  if (r < targetRow && c === targetCol) return "before-col";
  return "none";
}
