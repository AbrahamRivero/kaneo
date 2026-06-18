import type { DateRange } from "@/fetchers/event-room";

export function parseDateRange(dateRangeStr: string): DateRange {
  try {
    const parsed = JSON.parse(dateRangeStr) as { from?: string; to?: string };
    const from = parsed.from?.split("T")[0]?.trim() || "";
    const to = parsed.to ? parsed.to.split("T")[0]?.trim() || "" : undefined;
    if (from && Number.isNaN(new Date(`${from}T00:00:00`).getTime())) {
      return { from: "", to: "" };
    }
    return { from, to };
  } catch {
    return { from: "", to: "" };
  }
}
