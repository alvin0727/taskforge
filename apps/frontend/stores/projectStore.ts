import { create } from 'zustand';
import { SidebarProject, ProjectMember, ProjectListItem, ProjectStats } from '@/lib/types/project';

interface ProjectState {
  projects: SidebarProject[];
  setProjects: (projects: SidebarProject[]) => void;
  getProjectById: (projectId: string) => SidebarProject | undefined;
  getProjectBySlug: (slug: string) => SidebarProject | undefined;

  // Project Members Management
  projectMembers: { [projectId: string]: ProjectMember[] };
  setProjectMembers: (projectId: string, members: ProjectMember[]) => void;
  addMembersToProject: (projectId: string, newMembers: ProjectMember[]) => void;
  removeMemberFromProject: (projectId: string, memberId: string) => void;
  updateProjectMember: (projectId: string, memberId: string, updates: Partial<ProjectMember>) => void;

  // Project List
  projectList: ProjectListItem[];
  projectStats: { [projectId: string]: ProjectStats };
  setProjectList: (projects: ProjectListItem[]) => void;
  setProjectStats: (projectId: string, stats: ProjectStats) => void;

  // Helper methods
  getProjectMembers: (projectId: string) => ProjectMember[];
  getAllUniqueMembers: () => ProjectMember[];
  hasProjectMembers: (projectId: string) => boolean;
  clearProjectMembers: (projectId: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  projectList: [],
  projectMembers: {},
  projectStats: {},

  setProjects: (projects) => set({ projects }),

  setProjectList: (projects) => set({ projectList: projects }),

  getProjectById: (projectId) => get().projects.find(p => p.id === projectId),

  getProjectBySlug: (slug) => get().projects.find(p => p.slug === slug),

  setProjectMembers: (projectId, members) =>
    set((state) => ({
      projectMembers: {
        ...state.projectMembers,
        [projectId]: members || []
      }
    })),

  setProjectStats: (projectId, stats) =>
    set((state) => ({
      projectStats: {
        ...state.projectStats,
        [projectId]: stats
      }
    })),

  addMembersToProject: (projectId: string, newMembers: ProjectMember[]) => {
    set((state) => {
      const currentMembers = state.projectMembers[projectId] || [];

      // Filter out duplicates based on member ID
      const uniqueNewMembers = newMembers.filter(
        newMember => !currentMembers.find(existing => existing.id === newMember.id)
      );

      const updatedMembers = [...currentMembers, ...uniqueNewMembers];

      return {
        projectMembers: {
          ...state.projectMembers,
          [projectId]: updatedMembers
        }
      };
    });
  },

  removeMemberFromProject: (projectId: string, memberId: string) => {
    set((state) => {
      const currentMembers = state.projectMembers[projectId] || [];
      const updatedMembers = currentMembers.filter(member => member.id !== memberId);

      return {
        projectMembers: {
          ...state.projectMembers,
          [projectId]: updatedMembers
        }
      };
    });
  },

  updateProjectMember: (projectId: string, memberId: string, updates: Partial<ProjectMember>) => {
    set((state) => {
      const currentMembers = state.projectMembers[projectId] || [];
      const updatedMembers = currentMembers.map(member =>
        member.id === memberId ? { ...member, ...updates } : member
      );

      return {
        projectMembers: {
          ...state.projectMembers,
          [projectId]: updatedMembers
        }
      };
    });
  },

  // Helper methods
  getProjectMembers: (projectId: string) => {
    return get().projectMembers[projectId] || [];
  },

  getAllUniqueMembers: () => {
    const { projectMembers } = get();
    const allMembers: ProjectMember[] = Object.values(projectMembers).flat();

    // Deduplicate members by ID
    const uniqueMembers = allMembers.reduce((acc, member) => {
      if (!acc.find(m => m.id === member.id)) {
        acc.push(member);
      }
      return acc;
    }, [] as ProjectMember[]);

    return uniqueMembers;
  },

  hasProjectMembers: (projectId: string) => {
    const members = get().projectMembers[projectId];
    return members && members.length > 0;
  },

  clearProjectMembers: (projectId: string) => {
    set((state) => {
      const newProjectMembers = { ...state.projectMembers };
      delete newProjectMembers[projectId];

      return {
        projectMembers: newProjectMembers
      };
    });
  },
}));