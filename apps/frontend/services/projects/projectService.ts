import projectAdapter from "@/adapters/api/projectAdapter";

export async function getSideBarProject(orgId: string): Promise<any> {
    return await projectAdapter.getSideBarProject(orgId);
}

export default {
    getSideBarProject,
};