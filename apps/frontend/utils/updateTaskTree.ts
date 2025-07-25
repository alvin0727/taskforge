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

    if (task.children && task.children.length > 0) {
      return {
        ...task,
        children: updateTaskStatusInTree(task.children, taskId, newStatus),
      };
    }

    return task;
  });
}
