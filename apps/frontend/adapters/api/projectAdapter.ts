import api from "@/lib/axios";
import { 
    SidebarProject, 
    RequestCreateProject, 
    ProjectMember,
    AddProjectMemberRequest,
    AddProjectMemberResponse
} from "@/lib/types/project";

export async function getSideBarProject(orgId: string): Promise<{ projects: SidebarProject[]; total: number }> {
    const res = await api.get(`/projects/${orgId}/sidebar-projects`);
    return res.data;
}

export async function createNewProject(project: RequestCreateProject): Promise<{ message: string; project: SidebarProject }> {
    const res = await api.post(`/projects/create-project`, project);
    return res.data;
}

export async function getProjectMembers(orgId: string, slug: string): Promise<{ members: ProjectMember[] }> {
    const res = await api.get(`/projects/${orgId}/member-projects/${slug}`);
    return res.data;
}

export async function addMembersToProject(
    organizationId: string, 
    projectSlug: string, 
    memberIds: string[]
): Promise<AddProjectMemberResponse> {
    const requestData: AddProjectMemberRequest = {
        organization_id: organizationId,
        project_slug: projectSlug,
        member_ids: memberIds
    };
    
    const res = await api.post(`/projects/add-project-members`, requestData);
    return res.data;
}

export default {
    getSideBarProject,
    createNewProject,
    getProjectMembers,
    addMembersToProject,
};