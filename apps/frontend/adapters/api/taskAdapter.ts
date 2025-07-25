import api from "@/lib/axios";
import { Task } from "@/lib/types/workflow";

async function fetchTaskById(id: string): Promise<Task> {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
}

// Update status parent task
async function updateParentTaskStatus(workflowId: string, taskId: string, status: string): Promise<any> {
    const res = await api.patch(`/tasks/${workflowId}/parent/${taskId}/status`, { new_status: status });
    return res.data;
}

export default {
    fetchTaskById,
    updateParentTaskStatus,
};