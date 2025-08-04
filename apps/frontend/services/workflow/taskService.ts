// import taskAdapter from "@/adapters/api/taskAdapter";
// import { Task } from "@/lib/types/workflow";

// async function fetchTaskById(id: string): Promise<Task> {
//     const res = await taskAdapter.fetchTaskById(id);
//     return res;
// }

// async function updateTaskStatusParent(
//     workflowId: string,
//     taskId: string,
//     status: string
// ): Promise<any> {
//     const res = await taskAdapter.updateParentTaskStatus(workflowId, taskId, status);
//     return res;
// }

// async function updateTaskOrderParent(
//     workflowId: string,
//     taskId: string,
//     from_order: number,
//     to_order: number
// ): Promise<any> {
//     const res = await taskAdapter.updateParentTaskOrder(workflowId, taskId, from_order, to_order);
//     return res;
// }

// export default {
//     fetchTaskById,
//     updateTaskStatusParent,
//     updateTaskOrderParent,
// }