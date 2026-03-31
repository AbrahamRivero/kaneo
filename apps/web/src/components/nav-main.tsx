import { useNavigate, useParams } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LayoutGrid,
  Phone,
  Search,
  Tag,
  Users,
} from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/cn";
import useWorkspaceStore from "@/store/workspace";
import { useState } from "react";
import SearchCommandMenu from "./search-command-menu";
import { SettingsMenu } from "./settings-menu";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function NavMain() {
  const { workspace } = useWorkspaceStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { workspaceId: currentWorkspaceId, projectId: currentProjectId } =
    useParams({
      strict: false,
    });

  const phoneBoardEnabled = Boolean(
    (workspace as { phoneBoardEnabled?: boolean } | undefined)
      ?.phoneBoardEnabled,
  );
  const eventRoomsEnabled = Boolean(
    (workspace as { eventRoomsEnabled?: boolean } | undefined)
      ?.eventRoomsEnabled,
  );

  if (!workspace) return null;

  const isInProject = currentProjectId && currentWorkspaceId === workspace.id;
  const currentPath = window.location.pathname;
  const isBoard = currentPath.includes("/board");
  const isBacklog = currentPath.includes("/backlog");

  const navItems = [
    {
      title: "Projects",
      url: `/dashboard/workspace/${workspace.id}`,
      icon: LayoutDashboard,
      isActive:
        window.location.pathname === `/dashboard/workspace/${workspace.id}`,
      isDisabled: false,
    },
    {
      title: "Search",
      onClick: () => {
        setOpen(true);
      },
      icon: Search,
      isActive: false,
      isDisabled: false,
    },
    {
      title: "Analytics",
      url: `/dashboard/workspace/${workspace.id}/analytics`,
      icon: BarChart3,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/analytics`,
      isDisabled: false,
    },
    {
      title: "Members",
      url: `/dashboard/workspace/${workspace.id}/members`,
      icon: Users,
      isActive:
        window.location.pathname ===
        `/dashboard/workspace/${workspace.id}/members`,
      isDisabled: false,
    },
  ];

  const handleNavClick = (url: string) => {
    navigate({ to: url });
  };

  const handleViewChange = (view: "board" | "backlog") => {
    if (!currentProjectId) return;
    navigate({
      to: `/dashboard/workspace/$workspaceId/project/$projectId/${view}`,
      params: {
        workspaceId: workspace.id,
        projectId: currentProjectId,
      },
    });
  };

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Main</SidebarGroupLabel>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                disabled={item.isDisabled}
                className="w-full flex gap-2 justify-start items-start"
              >
                <Button
                  onClick={() => {
                    if (item.url) {
                      handleNavClick(item.url);
                    } else {
                      item.onClick?.();
                    }
                  }}
                  variant="ghost"
                  className={cn("w-full", item.isActive && "bg-accent")}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  <span>{item.title}</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {workspace?.id && phoneBoardEnabled && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Phone Board"
                className="w-full flex gap-2 justify-start items-start"
              >
                <Button
                  onClick={() =>
                    handleNavClick(
                      `/dashboard/workspace/${workspace.id}/phone-board`,
                    )
                  }
                  variant="ghost"
                  className={cn(
                    "w-full",
                    window.location.pathname ===
                      `/dashboard/workspace/${workspace.id}/phone-board` &&
                      "bg-accent",
                  )}
                >
                  <Phone className="w-4 h-4" />
                  <span>Phone Board</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {workspace?.id && eventRoomsEnabled && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-2 justify-between",
                      window.location.pathname.includes("/event-rooms") &&
                        "bg-accent",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Event Rooms</span>
                    </div>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    onClick={() =>
                      handleNavClick(
                        `/dashboard/workspace/${workspace.id}/event-rooms`,
                      )
                    }
                    className={cn(
                      "cursor-pointer",
                      window.location.pathname ===
                        `/dashboard/workspace/${workspace.id}/event-rooms` &&
                        "bg-accent",
                    )}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Calendar</span>
                      <span className="text-xs text-muted-foreground">
                        View reservations
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      handleNavClick(
                        `/dashboard/workspace/${workspace.id}/event-rooms/manage`,
                      )
                    }
                    className={cn(
                      "cursor-pointer",
                      window.location.pathname.includes(
                        "/event-rooms/manage",
                      ) && "bg-accent",
                    )}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Manage Rooms</span>
                      <span className="text-xs text-muted-foreground">
                        Create and edit rooms
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      handleNavClick(
                        `/dashboard/workspace/${workspace.id}/event-rooms/pricing/services`,
                      )
                    }
                    className={cn(
                      "cursor-pointer",
                      window.location.pathname.includes(
                        "/event-rooms/pricing/services",
                      ) && "bg-accent",
                    )}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Additional Services</span>
                      <span className="text-xs text-muted-foreground">
                        Manage service catalog
                      </span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() =>
                      handleNavClick(
                        `/dashboard/workspace/${workspace.id}/event-rooms/pricing/tariffs`,
                      )
                    }
                    className={cn(
                      "cursor-pointer",
                      window.location.pathname.includes(
                        "/event-rooms/pricing/tariffs",
                      ) && "bg-accent",
                    )}
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">Room Tariffs</span>
                      <span className="text-xs text-muted-foreground">
                        Manage room prices
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}

          {isInProject && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-2 justify-between",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isBoard ? (
                        <LayoutGrid className="w-4 h-4" />
                      ) : (
                        <Calendar className="w-4 h-4" />
                      )}
                      <span>View</span>
                    </div>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleViewChange("board")}
                    className={cn("cursor-pointer", isBoard && "bg-accent")}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Active Board
                    {isBoard && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleViewChange("backlog")}
                    className={cn("cursor-pointer", isBacklog && "bg-accent")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Backlog
                    {isBacklog && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SettingsMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SearchCommandMenu open={open} setOpen={setOpen} />
    </>
  );
}
