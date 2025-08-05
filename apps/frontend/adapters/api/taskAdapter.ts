import api from "@/lib/axios";
import { RequestTaskUpdatePosition, Task, RequestTaskUpdateStatus } from "@/lib/types/task";

export async function getTaskByBoard(boardId: string): Promise<{ tasks: Record<string, Task[]> }> {
    const res = await api.get(`/board/${boardId}/tasks`);
    return res.data;
}

export async function updateTaskPosition(
    task: RequestTaskUpdatePosition,
    taskId: string
): Promise<{ task: Task }> {
    const res = await api.patch(`/tasks/${taskId}/position`, task);
    return res.data;
}

export async function updateTaskStatus(
    task: RequestTaskUpdateStatus
): Promise<{ message: string }> {
    const res = await api.patch(`/tasks/update-status`, task);
    return res.data;
}
export default {
    getTaskByBoard,
    updateTaskPosition,
    updateTaskStatus
};