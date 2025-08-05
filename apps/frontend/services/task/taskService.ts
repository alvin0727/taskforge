import taskAdapter from "@/adapters/api/taskAdapter";
import { RequestTaskUpdatePosition, Task, RequestTaskUpdateStatus, RequestTaskCreate } from "@/lib/types/task";


export async function getTasksByBoard(boardId: string): Promise<{ tasks: Record<string, Task[]> }> {
    const res = await taskAdapter.getTaskByBoard(boardId);
    return res;
}

export async function updateTaskPosition(task: RequestTaskUpdatePosition, taskId: string) {
    const res = await taskAdapter.updateTaskPosition(task, taskId);
    return res;
}

export async function updateTaskStatus(task: RequestTaskUpdateStatus) {
    const res = await taskAdapter.updateTaskStatus(task);
    return res;
}

export async function createNewTask(task: RequestTaskCreate) {
    const res = await taskAdapter.createNewTask(task);
    return res;
}
export default {
    getTasksByBoard,
    updateTaskPosition,
    updateTaskStatus,
    createNewTask
};