export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  is_completed: boolean;
  children: Task[]; 
};

export type Workflow = {
  id: string;              
  title: string;            
  description: string;    
  tasks: Task[];           
  user_id: string;
  prompt: string;
  created_at: string;
};