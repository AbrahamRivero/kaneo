import { create } from "zustand";
import { type ITask, tasks, groupTasksByStatus } from "@/mock-data/tasks";
import type { Status } from "@/mock-data/statuses";

interface TasksState {
  tasks: ITask[];
  tasksByStatus: Record<string, ITask[]>;
  addTask: (task: ITask) => void;
  updateTask: (taskId: string, updates: Partial<ITask>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: Status) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: tasks,
  tasksByStatus: groupTasksByStatus(tasks),

  addTask: (task) =>
    set((state) => {
      const newTasks = [...state.tasks, task];
      return {
        tasks: newTasks,
        tasksByStatus: groupTasksByStatus(newTasks),
      };
    }),

  updateTask: (taskId, updates) =>
    set((state) => {
      const newTasks = state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      );
      return {
        tasks: newTasks,
        tasksByStatus: groupTasksByStatus(newTasks),
      };
    }),

  deleteTask: (taskId) =>
    set((state) => {
      const newTasks = state.tasks.filter((task) => task.id !== taskId);
      return {
        tasks: newTasks,
        tasksByStatus: groupTasksByStatus(newTasks),
      };
    }),

  updateTaskStatus: (taskId, status) =>
    set((state) => {
      const newTasks = state.tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      );
      return {
        tasks: newTasks,
        tasksByStatus: groupTasksByStatus(newTasks),
      };
    }),
}));
