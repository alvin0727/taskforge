import taskAdapter from "@/adapters/api/taskAdapter";
import { Task } from "@/lib/types/task";


export async function getTasksByBoard(boardId: string): Promise<{ tasks: Record<string, Task[]> }> {
    const res = await taskAdapter.getTaskByBoard(boardId);
    return res;
}


export default {
    getTasksByBoard
};