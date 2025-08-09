import projectAdapter from "@/adapters/api/projectAdapter";
import {
    SidebarProject,
    RequestCreateProject,
    ProjectMember,
    AddProjectMemberResponse,
    ListProjectQueryRequest,
    ListProjectsAPIResponse
} from "@/lib/types/project";

export async function getSideBarProject(orgId: string): Promise<{ projects: SidebarProject[], total: number }> {
    return await projectAdapter.getSideBarProject(orgId);
}

export async function createNewProject(project: RequestCreateProject): Promise<{ message: string; project: SidebarProject }> {
    return await projectAdapter.createNewProject(project);
}

export async function getProjectMembers(orgId: string, slug: string): Promise<{ members: ProjectMember[] }> {
    return await projectAdapter.getProjectMembers(orgId, slug);
}

export async function addMembersToProject(
    organizationId: string,
    projectSlug: string,
    memberIds: string[]
): Promise<AddProjectMemberResponse['data']> {
    const response = await projectAdapter.addMembersToProject(organizationId, projectSlug, memberIds);
    return response.data;
}

export async function listProjects(
    organizationId: string,
    query: ListProjectQueryRequest
): Promise<ListProjectsAPIResponse> {
    return await projectAdapter.listProjects(organizationId, query);
}
export default {
    getSideBarProject,
    createNewProject,
    getProjectMembers,
    addMembersToProject,
    listProjects
};