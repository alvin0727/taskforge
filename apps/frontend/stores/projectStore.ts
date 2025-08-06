import { create } from 'zustand';
import { SidebarProject, ProjectMember } from '@/lib/types/project';

interface ProjectState {
  projects: SidebarProject[];
  setProjects: (projects: SidebarProject[]) => void;
  getProjectById: (projectId: string) => SidebarProject | undefined;
  getProjectBySlug: (slug: string) => SidebarProject | undefined;
  projectMembers: { [projectId: string]: ProjectMember[] };
  setProjectMembers: (projectId: string, members: ProjectMember[]) => void;
  addMembersToProject: (projectId: string, newMembers: ProjectMember[]) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  projectMembers: {},
  setProjects: (projects) => set({ projects }),
  getProjectById: (projectId) => get().projects.find(p => p.id === projectId),
  getProjectBySlug: (slug) => get().projects.find(p => p.slug === slug),
  setProjectMembers: (projectId, members) =>
    set((state) => ({
      projectMembers: { ...state.projectMembers, [projectId]: members }
    })),
  addMembersToProject: (projectId: string, newMembers: ProjectMember[]) => {
    set((state) => {
      const currentMembers = state.projectMembers[projectId] || [];
      const updatedMembers = [...currentMembers, ...newMembers];

      return {
        projectMembers: {
          ...state.projectMembers,
          [projectId]: updatedMembers
        }
      };
    });
  },
}));