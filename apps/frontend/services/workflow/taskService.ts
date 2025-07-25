import taskAdapter from "@/adapters/api/taskAdapter";

async function updateTaskStatusParent(
    workflowId: string,
    taskId: string,
    status: string
): Promise<any> {
    const res = await taskAdapter.updateParentTaskStatus(workflowId, taskId, status);
    return res;
}

export default {
    updateTaskStatusParent,
}