import api from '@/lib/axios';

export async function getBoard(projectId: string) {
    const res = await api.get(`/board/${projectId}`);
    return res.data;
}

export default {
    getBoard,
};