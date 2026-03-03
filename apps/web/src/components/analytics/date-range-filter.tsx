import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "@/hooks/queries/analytics/use-get-analytics";

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange as (value: string) => void}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="this-week">This Week</SelectItem>
        <SelectItem value="this-month">This Month</SelectItem>
        <SelectItem value="last-month">Last Month</SelectItem>
        <SelectItem value="this-quarter">This Quarter</SelectItem>
      </SelectContent>
    </Select>
  );
}
