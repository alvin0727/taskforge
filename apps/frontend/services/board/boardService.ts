import boardAdapter from "@/adapters/api/boardAdapter";

export async function getBoard(projectId: string) {
    return await boardAdapter.getBoard(projectId);
}

export default {
    getBoard,
};