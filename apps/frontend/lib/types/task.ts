export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  labels: any[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface RequestTaskUpdatePosition{
  new_position: number;
  column_id: string;
}

export interface RequestTaskUpdateStatus {
  task_id: string;
  new_column_id: string;
}