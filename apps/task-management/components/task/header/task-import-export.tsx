"use client";

import * as React from "react";
import {
  ChevronDown,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TaskImportExport() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 hidden lg:flex">
          Importar / Exportar
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Download className="size-4" />
          Exportar
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <FileJson className="size-4" />
          Exportar como JSON
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileSpreadsheet className="size-4" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileText className="size-4" />
          Exportar como Markdown
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2">
          <Upload className="size-4" />
          Importar
        </DropdownMenuLabel>
        <DropdownMenuItem>
          <FileJson className="size-4" />
          Importar desde JSON
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileSpreadsheet className="size-4" />
          Importar desde CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

