import { create } from 'zustand';
import { SidebarProject } from '@/lib/types/project';

interface ProjectState {
  projects: SidebarProject[];
  setProjects: (projects: SidebarProject[]) => void;
  getProjectById: (projectId: string) => SidebarProject | undefined;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],

  setProjects: (projects) => set({ projects }),
  getProjectById: (projectId) => get().projects.find(p => p.id === projectId),
}));