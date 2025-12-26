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
import { useUserStore } from "@/store/user-store";
import {
  XCircle,
  CheckCircle2,
  MoreHorizontal,
  Search,
  CircleDot,
  ChevronDown,
  FileInput,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Department, Role, User, UserStatus } from "@/lib/types/user";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";
import { Avatar, AvatarFallback } from "../ui/avatar";
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

const statusConfig: Record<
  UserStatus,
  { label: string; icon: React.ElementType; className: string; bgClass: string }
> = {
  active: {
    label: "Activo",
    icon: CheckCircle2,
    className: "text-emerald-600",
    bgClass:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
  },
  inactive: {
    label: "Inactivo",
    icon: XCircle,
    className: "text-red-600",
    bgClass: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
  },
};

const departments: Department[] = [
  "Controles",
  "A+B",
  "Comercial",
  "Economía",
  "RRHH",
  "Seguridad",
  "AtCliente",
];

const departmentColors: Record<Department, string> = {
  Controles:
    "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300",
  RRHH: "bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-300",
  "A+B": "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  Comercial:
    "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300",
  AtCliente:
    "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
  Economía: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300",
  Seguridad: "bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300",
};

const roles: Role[] = ["Admin", "Editor", "Espectador"];

const roleColors: Record<string, string> = {
  Admin:
    "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300",
  Espectador:
    "bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300",
  Editor:
    "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300",
};

function getUserColumns(
  onEdit?: (user: User | null) => void
): ColumnDef<User>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccione todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccione una fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="size-6">
              <AvatarFallback className="text-xs bg-muted">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("email")}
        </span>
      ),
    },
    {
      accessorKey: "department",
      header: "Departamento",
      cell: ({ row }) => {
        const department = row.getValue("department") as Department;
        return (
          <span
            className={cn(
              "inline-flex px-2 py-0.5 text-xs font-medium rounded",
              departmentColors[department]
            )}
          >
            {department}
          </span>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <span
            className={cn(
              "inline-flex px-2 py-0.5 text-xs font-medium rounded",
              roleColors[role] || "bg-muted text-muted-foreground"
            )}
          >
            {role}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estatus",
      cell: ({ row }) => {
        const status = row.getValue("status") as UserStatus;
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
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                Copiar ID de usuario
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (onEdit) onEdit(user);
                }}
              >
                Editar Usuario
              </DropdownMenuItem>
              <DropdownMenuItem>
                {user.status === "active"
                  ? "Desactivar Usuario"
                  : "Activar Usuario"}
              </DropdownMenuItem>
              <DropdownMenuItem>Eliminar Usuario</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

interface UsersTableProps {
  showFilters?: boolean;
  onEdit?: (user: User | null) => void;
}

export function UsersTable({ showFilters = true, onEdit }: UsersTableProps) {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    roleFilter,
    setRoleFilter,
    clearAllFilters,
    users,
  } = useUserStore();

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === "" ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;
      const matchesDepartment =
        departmentFilter === "all" || user.department === departmentFilter;
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
    });
  }, [users, searchQuery, statusFilter, departmentFilter, roleFilter]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: filteredUsers,
    columns: getUserColumns(onEdit),
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

  return (
    <div className="rounded-xl border border-border bg-card">
      {showFilters && (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuario..."
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
                    ? "Todos"
                    : statusConfig[statusFilter].label}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuCheckboxItem
                  checked={statusFilter === "all"}
                  onCheckedChange={() => setStatusFilter("all")}
                >
                  Todos los estatus
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                {Object.entries(statusConfig).map(([key, config]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={statusFilter === key}
                    onCheckedChange={() => setStatusFilter(key as UserStatus)}
                  >
                    <div className="flex items-center gap-2">
                      <config.icon
                        className={cn("size-3.5", config.className)}
                      />
                      {config.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  {roleFilter === "all" ? "Roles" : roleFilter}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">Rol</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={roleFilter === "all"}
                  onCheckedChange={() => setRoleFilter("all")}
                >
                  Todos los Roles
                </DropdownMenuCheckboxItem>
                {roles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={roleFilter === role}
                    onCheckedChange={() => setRoleFilter(role)}
                  >
                    {role}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters} className="gap-2">
                  <Trash2 className="size-3" />
                  Limpiar filtros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  {departmentFilter === "all"
                    ? "Departamentos"
                    : departmentFilter}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs">
                  Departamento
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={departmentFilter === "all"}
                  onCheckedChange={() => setDepartmentFilter("all")}
                >
                  Todos los Departamentos
                </DropdownMenuCheckboxItem>
                {departments.map((dept) => (
                  <DropdownMenuCheckboxItem
                    key={dept}
                    checked={departmentFilter === dept}
                    onCheckedChange={() => setDepartmentFilter(dept)}
                  >
                    {dept}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearAllFilters}>
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getUserColumns().length}
                  className="h-24 text-center"
                >
                  No results.
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
                    key={i}
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
