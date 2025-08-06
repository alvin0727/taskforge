import taskAdapter from "@/adapters/api/taskAdapter";
import * as TaskTypes from "@/lib/types/task";


export async function getTasksByBoard(boardId: string): Promise<{ tasks: Record<string, TaskTypes.Task[]> }> {
    const res = await taskAdapter.getTaskByBoard(boardId);
    return res;
}

export async function updateTaskPosition(task: TaskTypes.RequestTaskUpdatePosition, taskId: string) {
    const res = await taskAdapter.updateTaskPosition(task, taskId);
    return res;
}

export async function updateTaskStatus(task: TaskTypes.RequestTaskUpdateStatus) {
    const res = await taskAdapter.updateTaskStatus(task);
    return res;
}

export async function createNewTask(task: TaskTypes.RequestTaskCreate) {
    const res = await taskAdapter.createNewTask(task);
    return res;
}

export async function updateTaskPartial(updateData: TaskTypes.RequestTaskUpdatePartial): Promise<TaskTypes.TaskUpdateResponse> {
    const res = await taskAdapter.updateTaskPartial(updateData);
    return res;
}

export default {
    getTasksByBoard,
    updateTaskPosition,
    updateTaskStatus,
    createNewTask,
    updateTaskPartial
};