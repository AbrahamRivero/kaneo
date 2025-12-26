/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Search,
  CircleDot,
  ChevronDown,
  FileInput,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  CirclePause,
  Trash2,
} from "lucide-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import type { Project, ProjectWithStatistics } from "@/lib/types/project";
import icons from "@/lib/constants/project-icons";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import useProjectStore, { type ProjectStatus } from "@/store/project";
import { useRouter } from "next/navigation";

const getProjectStatus = (project: ProjectWithStatistics) => {
  if (project.statistics.totalTasks === 0) return "inactive";
  if (project.statistics.completionPercentage === 100) return "completed";
  return "in-progress";
};

const statusConfig = {
  completed: {
    label: "Completado",
    icon: CheckCircle2,
    className: "text-emerald-600",
    bgClass:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  inactive: {
    label: "Inactivo",
    icon: CirclePause,
    className: "text-picton-blue-600",
    bgClass:
      "bg-picton-blue-50 dark:bg-picton-blue-950/30 border-picton-blue-200 dark:border-picton-blue-800",
  },
  "in-progress": {
    label: "En progreso",
    icon: XCircle,
    className: "text-supernova-600",
    bgClass:
      "bg-supernova-50 dark:bg-supernova-950/30 border-supernova-200 dark:border-supernova-800",
  },
};

function getProjectColumns(
  onEdit?: (workspace: ProjectWithStatistics | null) => void
): ColumnDef<ProjectWithStatistics>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const project = row.original;
        if (!project || !project.id || !project.statistics) return null;

        const IconComponent =
          icons[project.icon as keyof typeof icons] || icons.Layout;

        return (
          <div className="flex items-center gap-2.5">
            <IconComponent className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">{project.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progreso",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <div className="flex items-center gap-2">
            <CircularProgressbar
              value={project.statistics.completionPercentage}
              strokeWidth={12}
              styles={buildStyles({
                pathColor: "#10b981",
                trailColor: "#EDEDED",
                strokeLinecap: "round",
              })}
              className="size-4"
            />
            <span className="text-sm text-muted-foreground">
              {project.statistics.completionPercentage}%
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Fecha Límite",
      cell: ({ row }) => {
        const project = row.original;
        return (
          <span
            className={cn(
              "inline-flex px-2 py-0.5 text-xs font-medium rounded"
            )}
          >
            {project.statistics.dueDate
              ? new Date(project.statistics.dueDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )
              : "No due date"}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estatus",
      cell: ({ row }) => {
        const project = row.original;

        const status = getProjectStatus(project);

        const config = statusConfig[status];
        const Icon = config.icon;
        return (
          <div
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium",
              config.bgClass
            )}
          >
            <Icon className={cn("size-3.5", config.className)} />
            <span className={config.className}>{config.label}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const project = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(project.id);
                }}
              >
                Copiar ID del proyecto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(project);
                }}
              >
                Editar Proyecto
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => e.stopPropagation()}
              >
                Eliminar Proyecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

interface ProjectsTableProps {
  projects?: ProjectWithStatistics[];
  showFilters?: boolean;
  onEdit?: (project: Project | null) => void;
}

export function ProjectsTable({
  projects = [],
  showFilters = true,
  onEdit,
}: ProjectsTableProps) {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    clearAllFilters,
  } = useProjectStore();

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || getProjectStatus(project) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { push } = useRouter();

  const table = useReactTable({
    data: filteredProjects,
    columns: getProjectColumns(onEdit),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: { pageSize: 8 },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleProjectClick = (projectId: string, workspaceId: string) => {
    push(`/dashboard/workspace/${workspaceId}/project/${projectId}/board`);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {showFilters && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proyecto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-full md:w-[200px]"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <CircleDot className="size-4" />
                  {statusFilter === "all"
                    ? "Todos los elementos"
                    : statusConfig[statusFilter].label}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem
                  checked={statusFilter === "all"}
                  onCheckedChange={() => setStatusFilter("all")}
                >
                  <div className="flex items-center gap-2">
                    Todos los elementos
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={statusFilter === key}
                    onCheckedChange={() =>
                      setStatusFilter(key as ProjectStatus)
                    }
                  >
                    <div className="flex items-center gap-2">
                      {config.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters} className="gap-2">
                  <Trash2 className="size-3" />
                  Limpiar filtros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button variant="outline" size="sm" className="h-9 gap-2">
            <FileInput className="size-4" />
            Importar
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-muted-foreground font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const { workspaceId, id: projectId } = row.original;

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => handleProjectClick(projectId, workspaceId)}
                    className="cursor-pointer"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getProjectColumns().length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, table.getPageCount()) },
              (_, i) => {
                const pageIndex = i;
                const isActive =
                  table.getState().pagination.pageIndex === pageIndex;
                return (
                  <button
                    type="button"
                    key={pageIndex}
                    onClick={() => table.setPageIndex(pageIndex)}
                    className={cn(
                      "size-8 rounded-lg text-sm font-semibold",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {pageIndex + 1}
                  </button>
                );
              }
            )}
            {table.getPageCount() > 5 && (
              <>
                <span className="px-2 text-muted-foreground">...</span>
                <button
                  type="button"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  className="size-8 rounded-lg text-sm font-semibold text-foreground hover:bg-muted"
                >
                  {table.getPageCount()}
                </button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Mostrando{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            a{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            de {table.getFilteredRowModel().rows.length} entradas
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                Mostrar {table.getState().pagination.pageSize}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[5, 8, 10, 20, 50].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => table.setPageSize(size)}
                >
                  Mostrar {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
