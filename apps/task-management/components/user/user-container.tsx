"use client";

import { useState } from "react";
import type { User } from "@/lib/types/user";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { UsersTable } from "./user-data-table";
import { UserDialog } from "./user-dialog";

const UserContainer = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User | null) => {
    setIsDialogOpen(true);
    setSelectedUser(user);
  };
  return (
    <main className="w-full h-full overflow-x-auto">
      <div className="gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
        <div className="flex w-full justify-end mb-4">
          <Button onClick={handleCreateUser} size="sm" className="gap-2">
            <Plus className="size-4" /> Nuevo Usuario
          </Button>
        </div>
        <UsersTable showFilters onEdit={handleEditUser} />
      </div>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
      />
    </main>
  );
};

export default UserContainer;
