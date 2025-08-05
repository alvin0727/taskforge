import api from "@/lib/axios";
import { SidebarProject, RequestCreateProject } from "@/lib/types/project";

export async function getSideBarProject(orgId: string): Promise<{ projects: SidebarProject[]; total: number }> {
    const res = await api.get(`/projects/${orgId}/sidebar-projects`);
    return res.data;
}

export async function createNewProject(project: RequestCreateProject): Promise<{ message: string; project: SidebarProject }> {
    const res = await api.post(`/projects/create-project`, project);
    return res.data;
}
export default {
    getSideBarProject,
    createNewProject,
};