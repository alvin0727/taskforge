export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  is_completed: boolean;
  children?: Task[];
}

export interface Workflow {
  id: string;
  user_id: string;
  prompt: string;
  title: string;
  description: string;
  created_at: string;
  tasks: Task[];
}

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'canceled';