import { Task } from '@/lib/types/workflow';

export interface FlatTask extends Task {
  level: number;
  parentId?: string;
}

export function flattenTasks(tasks: Task[], level = 0, parentId?: string): FlatTask[] {
  return tasks.flatMap((task) => {
    const flat: FlatTask = { ...task, level, parentId };
    const children = task.children ? flattenTasks(task.children, level + 1, task.id) : [];
    return [flat, ...children];
  });
}