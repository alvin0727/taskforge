import api from "@/lib/axios";
import * as TaskTypes from "@/lib/types/task";
import { EnhanceDescriptionResponse, GenerateDescriptionRequest, GenerateDescriptionResponse, EnhanceDescriptionRequest, AIUsageResponse} from "@/lib/types/task";

export async function getTaskByBoard(boardId: string): Promise<{ tasks: Record<string, TaskTypes.Task[]> }> {
    const res = await api.get(`/board/${boardId}/tasks`);
    return res.data;
}

export async function updateTaskPosition(
    task: TaskTypes.RequestTaskUpdatePosition,
    taskId: string
): Promise<{ message: string }> {
    const res = await api.patch(`/tasks/${taskId}/position`, task);
    return res.data;
}

export async function updateTaskStatus(
    task: TaskTypes.RequestTaskUpdateStatus
): Promise<{ message: string }> {
    const res = await api.patch(`/tasks/update-status`, task);
    return res.data;
}

export async function createNewTask(
    task: TaskTypes.RequestTaskCreate
): Promise<{ task: TaskTypes.Task }> {
    const res = await api.post(`/tasks/create-task`, task);
    return res.data;
}

export async function updateTaskPartial(
    updateData: TaskTypes.RequestTaskUpdatePartial
): Promise<TaskTypes.TaskUpdateResponse> {
    const res = await api.put(`/tasks/update-task-partial`, updateData);
    return res.data;
}

export async function deleteTask(taskId: string): Promise<{ message: string }> {
    const res = await api.delete(`/tasks/${taskId}`);
    return res.data;
}

export async function getTaskById(taskId: string): Promise<TaskTypes.Task> {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data.task;
}

export async function generateTaskDescription(
    request: GenerateDescriptionRequest
): Promise<GenerateDescriptionResponse> {
    const res = await api.post('/ai/generate-task-description', request)
    return res.data;
}

export async function enhanceTaskDescription(
    request: EnhanceDescriptionRequest
): Promise<EnhanceDescriptionResponse> {
    const res = await api.post('/ai/enhance-task-description', request)
    return res.data;
}

export async function getAIUsageInfo(): Promise<AIUsageResponse > {
    const res = await api.get('/ai/usage')
    return res.data;
}

export default {
    getTaskByBoard,
    updateTaskPosition,
    updateTaskStatus,
    createNewTask,
    updateTaskPartial,
    deleteTask,
    getTaskById,
    generateTaskDescription,
    enhanceTaskDescription,
    getAIUsageInfo
};