"use client";

import { UserCircle } from 'lucide-react';
import { ProjectMember } from "@/lib/types/project";
import { useOrganizationStore } from '@/stores/organizationStore';
import { useProjectStore } from "@/stores/projectStore";
import { useEffect, useState, useMemo } from "react";
import ProjectService from "@/services/projects/projectService";

// Enhanced hook that takes projectId parameter
export const useEnsureProjectMembers = (projectId?: string) => {
  const projects = useProjectStore((state) => state.projects);
  const projectMembersMap = useProjectStore((state) => state.projectMembers);
  const setProjectMembers = useProjectStore((state) => state.setProjectMembers);
  const activeOrg = useOrganizationStore((state) => state.activeOrg);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!activeOrg || projects.length === 0) return;

    const fetchMembersForProjects = async () => {
      // If projectId is provided, focus on that project
      const targetProjects = projectId 
        ? projects.filter(project => project.id === projectId)
        : projects;

      const projectsNeedingMembers = targetProjects.filter(
        project => !projectMembersMap[project.id] || projectMembersMap[project.id].length === 0
      );

      if (projectsNeedingMembers.length === 0) return;

      for (const project of projectsNeedingMembers) {
        if (loading[project.id]) continue;

        setLoading(prev => ({ ...prev, [project.id]: true }));
        
        try {
          const data = await ProjectService.getProjectMembers(activeOrg.id, project.slug);
          setProjectMembers(project.id, data.members || []);
        } catch (error) {
          console.error(`Failed to fetch members for project ${project.slug}:`, error);
          setProjectMembers(project.id, []);
        } finally {
          setLoading(prev => ({ ...prev, [project.id]: false }));
        }
      }
    };

    fetchMembersForProjects();
  }, [activeOrg, projects, projectMembersMap, setProjectMembers, projectId, loading]);

  return { loading };
};

// Get team members for a specific project
export const useProjectTeamMembers = (projectId?: string) => {
  const projectMembers = useProjectStore((state) => state.projectMembers);
  
  // Ensure members are loaded for this specific project
  useEnsureProjectMembers(projectId);
  
  return useMemo(() => {
    if (!projectId || !projectMembers[projectId]) return [];
    
    return projectMembers[projectId].map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email, // Include email from ProjectMember
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

// Get all team members from all projects (flattened and deduplicated)
export const useTeamMembers = () => {
  const projectMembers = useProjectStore((state) => state.projectMembers);
  
  // Call the hook to ensure project members are loaded for all projects
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
      email: member.email,
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

// Enhanced team members hook that focuses on current project first
export const useCurrentProjectTeamMembers = (currentProjectId?: string) => {
  const [members, setMembers] = useState<{ id: string; name: string; email: string; avatar: string }[]>([]);
  
  // Get members for current project first
  const currentProjectMembers = useProjectTeamMembers(currentProjectId);
  
  // Get all members as fallback
  const allTeamMembers = useTeamMembers();
  
  useEffect(() => {
    if (currentProjectId && currentProjectMembers.length > 0) {
      // Use current project members if available
      setMembers(currentProjectMembers);
    } else {
      // Fallback to all team members
      setMembers(allTeamMembers);
    }
  }, [currentProjectId, currentProjectMembers, allTeamMembers]);
  
  return members;
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

// Enhanced getAssigneeAvatar with better error handling
export const getAssigneeAvatar = (
  assigneeId?: string,
  teamMembers: { id: string; name: string; avatar: string; email?: string }[] = []
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
    <div 
      className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-medium text-white"
      title={member.name}
    >
      {member.avatar}
    </div>
  );
};