"use client";

import type * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Circle,
  Star,
  Calendar,
  Users,
  Building,
  ChevronDown,
  Paperclip,
  Folder,
  Mail,
  Layers,
  Search,
  Check,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import Image from "next/image";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

function SidebarItem({ icon, label, href, badge }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "w-full justify-between px-3 py-2 h-auto text-sm transition-all",
        isActive
          ? "bg-slate-200/60 dark:bg-muted/70 hover:bg-slate-200/80 in-dark:hover:bg-muted/50 text-foreground font-medium"
          : "text-muted-foreground hover:bg-slate-200/80 in-dark:hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <div className="bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center">
          {badge}
        </div>
      )}
    </Link>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        className="gap-2 px-1 mb-2 text-xs h-auto py-0 text-muted-foreground hover:text-foreground"
      >
        <span>{title}</span>
        <ChevronDown className="size-3" />
      </Button>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function TaskSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="pb-0">
        <div className="px-4 pt-4 pb-0">
          <div className="flex items-center justify-between">
            <WorkspaceSwitcher />
            <Image
              src="/ln.png"
              alt="lndev.me"
              className="size-5 object-cover rounded-full"
              width={20}
              height={20}
            />
          </div>

          <div className="mt-4 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-8 pr-10 text-xs h-8 bg-background"
            />
            <Kbd className="absolute right-2 top-1/2 -translate-y-1/2">/</Kbd>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <div className="space-y-0.5 mb-6">
          <SidebarItem
            icon={<LayoutGrid className="size-4" />}
            label="Dashboard"
            href="/"
          />
          <SidebarItem
            icon={<Bell className="size-4" />}
            label="Notificaciones"
            href="/notifications"
            badge="12"
          />
          <SidebarItem
            icon={<Circle className="size-4" />}
            label="Asignadas a mí"
            href="/tasks?assignee=me"
          />
          <SidebarItem
            icon={<Star className="size-4" />}
            label="Proyectos"
            href="/tasks"
          />
          <SidebarItem
            icon={<FileSpreadsheet className="size-4" />}
            label="Plan de trabajo"
            href="/plan"
          />
          <SidebarItem
            icon={<Calendar className="size-4" />}
            label="Nomencladores"
            href="/nomenclators"
          />
          <SidebarItem
            icon={<Users className="size-4" />}
            label="Usuarios"
            href="/users"
          />
          <SidebarItem
            icon={<Building className="size-4" />}
            label="Departamentos"
            href="/workspaces"
          />
        </div>

        <SidebarSection title="Espacio de trabajo">
          <SidebarItem
            icon={<Paperclip className="size-4" />}
            label="Adjuntos"
            href="/attachments"
          />
          <SidebarItem
            icon={<Folder className="size-4" />}
            label="Documentos"
            href="/documents"
          />
          <SidebarItem
            icon={<Mail className="size-4" />}
            label="Emails"
            href="/emails"
          />
        </SidebarSection>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-0.5">
        <SidebarItem
          icon={<Layers className="size-4" />}
          label="Cuenta"
          href="/account"
        />
      </SidebarFooter>
    </Sidebar>
  );
}
