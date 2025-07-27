import { create } from 'zustand';
import { Task, Workflow } from '@/lib/types/workflow';

interface TaskStore {
  workflow: Workflow | null;
  parentTasksByStatus: ParentTasksByStatus;
  setParentTasksByStatus: (parentTasksByStatus: ParentTasksByStatus) => void;
  updateParentTaskInStatus: (task: Task) => void;
  setWorkflow: (workflow: Workflow) => void;
}

interface ParentTasksByStatus {
  [status: string]: Task[];
}

export const useTaskStore = create<TaskStore>((set) => ({
  workflow: null,
  parentTasksByStatus: {},
  setWorkflow: (workflow) => {
    // Separate only parent tasks by status when setting workflow
    const parentTasksByStatus: ParentTasksByStatus = {};
    if (workflow?.tasks) {
      workflow.tasks
        .filter((task) => !task.parent_id) // only parent tasks
        .forEach((task) => {
          if (!parentTasksByStatus[task.status]) parentTasksByStatus[task.status] = [];
          parentTasksByStatus[task.status].push(task);
        });
      // Sort every column by order
      Object.keys(parentTasksByStatus).forEach(
        (status) => parentTasksByStatus[status].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      );
    }
    set({ workflow, parentTasksByStatus });
  },
  setParentTasksByStatus: (parentTasksByStatus) => set({ parentTasksByStatus }),
  updateParentTaskInStatus: (task) =>
    set((state) => {
      if (task.parent_id) return {}; // skip subtask
      const tasks = state.parentTasksByStatus[task.status] || [];
      const idx = tasks.findIndex((t) => t.id === task.id);
      if (idx !== -1) {
        tasks[idx] = task;
      } else {
        tasks.push(task);
      }
      return {
        parentTasksByStatus: {
          ...state.parentTasksByStatus,
          [task.status]: [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        },
      };
    }),
}));