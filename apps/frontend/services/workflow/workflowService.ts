import { fetchWorkflowById } from "@/adapters/api/workflowAdapter";
import { Task, Workflow } from "@/lib/types/workflow";

export async function getWorkflowById(id: string): Promise<Workflow> {
  const raw: any = await fetchWorkflowById(id);

  if (!raw || !raw._id || !raw.tasks) {
    throw new Error("Invalid workflow data received from backend");
  }

  const normalizeTask = (task: any): Task => ({
    id: task._id,
    title: task.title,
    description: task.description,
    status: task.status || 'todo',
    is_completed: task.is_completed ?? false,
    dependencies: task.dependencies || [],
    order: typeof task.order === 'number' ? task.order : 0,
    parent_id: task.parent_id ?? null,
  });

  return {
    id: raw._id, 
    title: raw.title || '',
    description: raw.description || '',
    user_id: raw.user_id || '',
    prompt: raw.prompt || '',
    created_at: raw.created_at || '',
    tasks: raw.tasks.map(normalizeTask),
  };
}
