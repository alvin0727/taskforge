import api from '@/lib/axios';
import { ListBoardsByOrganizationResponse } from '@/lib/types/board';

export async function getBoard(projectId: string) {
    const res = await api.get(`/board/${projectId}`);
    return res.data;
}

export async function listBoardByOrganization(organizationId: string): Promise<ListBoardsByOrganizationResponse> {
    const res = await api.get(`/board/${organizationId}/list-boards`);
    return res.data;
}

export default {
    getBoard,
    listBoardByOrganization,
};