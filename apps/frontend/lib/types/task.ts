export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority;
  assignee_id: string | null;
  due_date: string | null;
  estimated_hours: number | null;
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

export interface RequestTaskCreate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  project_id: string;
  board_id: string;
  column_id: string;
  assignee_id?: string;
  due_date?: string;
  estimated_hours?: number;
  labels?: any[];
}
