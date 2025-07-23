import { create } from "zustand";
import { Task } from "@/lib/types/workflow";

type TaskStore = {
  taskTree: Task[];
  setTaskTree: (tasks: Task[]) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
};

export const useTaskStore = create<TaskStore>((set) => ({
  taskTree: [],
  setTaskTree: (tasks) => set({ taskTree: tasks }),
  updateTask: (taskId, updates) =>
    set((state) => ({
      taskTree: updateTaskInTree(state.taskTree, taskId, updates),
    })),
}));

// Recursive helper to update a task by ID
function updateTaskInTree(
  tree: Task[],
  taskId: string,
  updates: Partial<Task>
): Task[] {
  return tree.map((task) => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }

    if (task.children) {
      return {
        ...task,
        children: updateTaskInTree(task.children, taskId, updates),
      };
    }

    return task;
  });
}
