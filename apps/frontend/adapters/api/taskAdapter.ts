import api from "@/lib/axios";
import { Task } from "@/lib/types/task";

async function getTaskByBoard(boardId: string): Promise<{ tasks: Record<string, Task[]> }> {
    const res = await api.get(`/board/${boardId}/tasks`);
    return res.data;
}
export default {
    getTaskByBoard
};