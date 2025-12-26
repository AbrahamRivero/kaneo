import { create } from "zustand";
import { Department, User, UserStatus } from "@/lib/types/user";
import { mockUsers } from "@/mock-data/users";

export type DateFilter =
  | "all"
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days";

interface UserState {
  users: User[];
  searchQuery: string;
  statusFilter: UserStatus | "all";
  roleFilter: string | "all";
  departmentFilter: Department | "all";
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: UserStatus | "all") => void;
  setRoleFilter: (role: string | "all") => void;
  setDepartmentFilter: (department: Department | "all") => void;
  clearAllFilters: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: mockUsers,
  searchQuery: "",
  statusFilter: "all",
  roleFilter: "all",
  departmentFilter: "all",

  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setRoleFilter: (role) => set({ roleFilter: role }),
  setDepartmentFilter: (department) => set({ departmentFilter: department }),
  clearAllFilters: () =>
    set({
      searchQuery: "",
      statusFilter: "all",
      roleFilter: "all",
      departmentFilter: "all",
    }),

  addUser: (user) => set((state) => ({ users: [user, ...state.users] })),
  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}));
