export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
  NO_PRIORITY = "" // Represent no-priority as empty string for frontend
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority | null; // Allow null from backend
  assignee_id: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  labels: any[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface RequestTaskUpdatePosition {
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
  priority?: TaskPriority | null;
  project_id: string;
  board_id: string;
  column_id: string;
  assignee_id?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  labels?: any[];
}

// New interfaces for partial update - Allow null values to clear fields
export interface RequestTaskUpdatePartial {
  task_id: string;
  updates: {
    title?: string;
    description?: string;
    priority?: TaskPriority | null; 
    assignee_id?: string | null; 
    due_date?: string | null; 
    estimated_hours?: number | null; 
    labels?: string[];
  };
}

export interface TaskUpdateResponse {
  message: string;
  task: Task;
}

// Task update fields interface - Allow null values for clearing fields
export interface TaskUpdateFields {
  title?: string;
  description?: string;
  priority?: TaskPriority | null;
  assignee_id?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  labels?: any[];
}