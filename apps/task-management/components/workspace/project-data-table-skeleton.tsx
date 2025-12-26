import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ProjectsTableSkeleton() {
  const skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-full md:w-[200px]" />
          <Skeleton className="h-9 w-[150px]" />
        </div>
        <Skeleton className="h-9 w-[100px]" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-4 w-20" />
              </TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-4 rounded-sm" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-md" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
