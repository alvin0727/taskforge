import { UserCircle } from 'lucide-react';
import { ProjectMember } from "@/lib/types/project";
import { useOrganizationStore } from '@/stores/organizationStore';
import { useProjectStore } from "@/stores/projectStore";
import { useEffect, useState, useMemo } from "react";
import ProjectService from "@/services/projects/projectService";

export const useEnsureProjectMembers = () => {
  const projects = useProjectStore((state) => state.projects);
  const projectMembersMap = useProjectStore((state) => state.projectMembers);
  const setProjectMembers = useProjectStore((state) => state.setProjectMembers);
  const activeOrg = useOrganizationStore((state) => state.activeOrg);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!activeOrg || projects.length === 0) return;

    const fetchMembersForMissingProjects = async () => {
      const projectsNeedingMembers = projects.filter(
        project => !projectMembersMap[project.id] || projectMembersMap[project.id].length === 0
      );

      if (projectsNeedingMembers.length === 0) return;

      for (const project of projectsNeedingMembers) {
        if (loading[project.id]) continue; // Skip if already loading

        setLoading(prev => ({ ...prev, [project.id]: true }));
        
        try {
          const data = await ProjectService.getProjectMembers(activeOrg.id, project.slug);
          setProjectMembers(project.id, data.members || []);
        } catch (error) {
          console.error(`Failed to fetch members for project ${project.slug}:`, error);
          // Set empty array to prevent repeated requests
          setProjectMembers(project.id, []);
        } finally {
          setLoading(prev => ({ ...prev, [project.id]: false }));
        }
      }
    };

    fetchMembersForMissingProjects();
  }, [activeOrg, projects, projectMembersMap, setProjectMembers]);

  return { loading };
};

// Get all team members from all projects (flattened and deduplicated)
export const useTeamMembers = () => {
  const projectMembers = useProjectStore((state) => state.projectMembers);
  
  // Call the hook to ensure project members are loaded
  useEnsureProjectMembers();
  
  return useMemo(() => {
    const allMembers: ProjectMember[] = Object.values(projectMembers).flat();
    
    // Deduplicate members by ID
    const uniqueMembers = allMembers.reduce((acc, member) => {
      if (!acc.find(m => m.id === member.id)) {
        acc.push(member);
      }
      return acc;
    }, [] as ProjectMember[]);

    return uniqueMembers.map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.name
        ? member.name
            .split(/[ ._]/)
            .filter(Boolean)
            .map((n) => n[0].toUpperCase())
            .join('')
            .slice(0, 2)
        : '',
    }));
  }, [projectMembers]);
};

// Get team members for a specific project
export const useProjectTeamMembers = (projectId?: string) => {
  const projectMembers = useProjectStore((state) => state.projectMembers);
  
  // Call the hook to ensure project members are loaded
  useEnsureProjectMembers();
  
  return useMemo(() => {
    if (!projectId || !projectMembers[projectId]) return [];
    
    return projectMembers[projectId].map((member) => ({
      id: member.id,
      name: member.name,
      avatar: member.name
        ? member.name
            .split(/[ ._]/)
            .filter(Boolean)
            .map((n) => n[0].toUpperCase())
            .join('')
            .slice(0, 2)
        : '',
    }));
  }, [projectMembers, projectId]);
};

// Legacy function for backward compatibility (avoid using this)
export const getTeamMembers = (): { id: string; name: string; avatar: string }[] => {
  const { projectMembers } = useProjectStore.getState();
  const allMembers: ProjectMember[] = Object.values(projectMembers).flat();
  
  // Deduplicate members by ID
  const uniqueMembers = allMembers.reduce((acc, member) => {
    if (!acc.find(m => m.id === member.id)) {
      acc.push(member);
    }
    return acc;
  }, [] as ProjectMember[]);

  return uniqueMembers.map((member) => ({
    id: member.id,
    name: member.name,
    avatar: member.name
      ? member.name
          .split(/[ ._]/)
          .filter(Boolean)
          .map((n) => n[0].toUpperCase())
          .join('')
          .slice(0, 2)
      : '',
  }));
};

export const getAssigneeAvatar = (
  assigneeId?: string,
  teamMembers: { id: string; name: string; avatar: string }[] = []
) => {
  if (!assigneeId) {
    return (
      <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
        <UserCircle size={12} className="text-neutral-400" />
      </div>
    );
  }

  const member = teamMembers.find(m => m.id === assigneeId);
  if (!member) {
    return (
      <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
        <UserCircle size={12} className="text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-medium text-white">
      {member.avatar}
    </div>
  );
};