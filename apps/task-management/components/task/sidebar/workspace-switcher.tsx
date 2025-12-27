import { useRouter } from "next/navigation";
import { useUserPreferencesStore } from "@/store/user-preferences";
import useGetWorkspaces from "@/hooks/queries/workspace/use-get-workspaces";
import useWorkspaceStore from "@/store/workspace";
import { useCallback, useEffect, useMemo, useState } from "react";
import type Workspace from "@/lib/types/workspace";
import {
  getModifierKeyText,
  useRegisterShortcuts,
} from "@/hooks/use-keyboard-shortcuts";
import { shortcuts } from "@/lib/constants/shortcuts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Plus } from "lucide-react";

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspaceStore();
  const { setActiveWorkspaceId } = useUserPreferencesStore();
  const { data: workspaces } = useGetWorkspaces();

  const { push } = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] =
    useState(false);

  const handleWorkspaceChange = useCallback(
    (selectedWorkspace: Workspace) => {
      setWorkspace(selectedWorkspace);
      setActiveWorkspaceId(selectedWorkspace.id);
      push(`/workspace/${selectedWorkspace.id}`);
    },
    [setWorkspace, setActiveWorkspaceId, push]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!workspaces || workspaces.length === 0) return;

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key >= "1" &&
        event.key <= "9"
      ) {
        event.preventDefault();
        const index = Number.parseInt(event.key) - 1;
        if (index < workspaces.length) {
          handleWorkspaceChange(workspaces[index]);
          setIsOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, workspaces, handleWorkspaceChange]);

  const handleSwitchWorkspace = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleCreateWorkspace = useCallback(() => {
    setIsCreateWorkspaceModalOpen(true);
  }, []);

  const shortcutsConfig = useMemo(
    () => ({
      sequentialShortcuts: {
        [shortcuts.workspace.prefix]: {
          [shortcuts.workspace.switch]: handleSwitchWorkspace,
          [shortcuts.workspace.create]: handleCreateWorkspace,
        },
      },
    }),
    [handleSwitchWorkspace, handleCreateWorkspace]
  );

  useRegisterShortcuts(shortcutsConfig);

  if (!workspace) {
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 h-auto p-0! hover:bg-transparent"
        >
          <div className="size-6 bg-linear-to-br from-purple-500 to-pink-600 rounded-sm shadow flex items-center justify-center text-white text-xs font-semibold">
            {workspace.name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate font-semibold">{workspace.name}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {workspaces?.map((ws: Workspace, index) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => {
              handleWorkspaceChange(ws);
              setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="size-6 bg-linear-to-br from-purple-500 to-pink-600 rounded-sm shadow flex items-center justify-center text-white text-xs font-semibold">
                {ws.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold">
                {ws.name}{" "}
                <span className="ml-auto text-xs text-muted-foreground">
                  {getModifierKeyText()} {index > 8 ? "0" : index + 1}
                </span>
              </span>
              <Check className="size-4 ml-auto" />
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setIsCreateWorkspaceModalOpen(true);
          }}
        >
          <Plus className="size-4" />
          <span>Añadir departamento</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
