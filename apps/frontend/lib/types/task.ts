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