import boardAdapter from "@/adapters/api/boardAdapter";
import { ListBoardsByOrganizationResponse } from "@/lib/types/board";

export async function getBoard(projectId: string) {
    return await boardAdapter.getBoard(projectId);
}

export async function listBoardByOrganization(organizationId: string): Promise<ListBoardsByOrganizationResponse> {
    return await boardAdapter.listBoardByOrganization(organizationId);
}

export default {
    getBoard,
    listBoardByOrganization,
};