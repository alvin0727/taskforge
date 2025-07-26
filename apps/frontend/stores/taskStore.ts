import { create } from 'zustand';
import { Task, Workflow } from '@/lib/types/workflow';

interface TaskStore {
  workflow: Workflow | null;
  setWorkflow: (workflow: Workflow) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  workflow: null,
  setWorkflow: (workflow) => set({ workflow }),
}));

