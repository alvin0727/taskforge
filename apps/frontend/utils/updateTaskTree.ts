import { Task, TaskStatus } from '@/lib/types/workflow';

export function updateTaskStatusInTree(
  tasks: Task[],
  taskId: string,
  newStatus: TaskStatus
): Task[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, status: newStatus };
    }
    return task;
  });
}
