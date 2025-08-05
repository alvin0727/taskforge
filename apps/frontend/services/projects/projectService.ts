import projectAdapter from "@/adapters/api/projectAdapter";
import { SidebarProject, RequestCreateProject } from "@/lib/types/project";

export async function getSideBarProject(orgId: string): Promise<{ projects: SidebarProject[], total: number }> {
    return await projectAdapter.getSideBarProject(orgId);
}

export async function createNewProject(project: RequestCreateProject): Promise<{ message: string; project: SidebarProject }> {
    return await projectAdapter.createNewProject(project);
}

export default {
    getSideBarProject,
    createNewProject,
};