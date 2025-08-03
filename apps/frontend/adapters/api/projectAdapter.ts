import api from "@/lib/axios";

export async function getSideBarProject(orgId: string): Promise<any> {
    const res = await api.get(`/projects/${orgId}/sidebar-projects`);
    return res.data;
}

export default {
    getSideBarProject,
};