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
  board_id: string | null;
  project_id: string | null;
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


// Block editor types for task description
export interface DescriptionBlock {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'code' | 'bulletList' | 'numberedList';
  content: string;
  position: number;
}

// Request interface for generating task description
export interface GenerateDescriptionRequest {
  title: string; // Required, 3-200 characters
  project_id?: string | null; // Optional project ID for context
  user_requirements?: string | null; // Optional, max 1000 characters  
  priority?: TaskPriority | null; // Optional priority
}

// Success response interface
export interface GenerateDescriptionResponse {
  success: true;
  message: string;
  description: string; // JSON string of DescriptionBlock array
  context_used: boolean;
  project_id: string | null;
  has_requirements: boolean;
  rate_limit: RateLimit;
}

// Request interface for enhancing existing task description
export interface EnhanceDescriptionRequest {
  title: string; // Required, 3-200 characters
  existing_description: string; // Required, JSON string of current description blocks, max 10000 characters
  project_id?: string | null; // Optional project ID for context
  enhancement_instructions?: string | null; // Optional, max 1000 characters
  priority?: TaskPriority | null; // Optional priority
}

// Rate limit information
export interface RateLimit {
  remaining: number; // Requests remaining today
  limit: number; // Daily limit
  reset_time: string; // ISO string for when limits reset (midnight UTC)
}


// Success response interface for enhance
export interface EnhanceDescriptionResponse {
  success: true;
  message: string;
  description: string; // JSON string of enhanced DescriptionBlock array
  original_description: string; // JSON string of original DescriptionBlock array
  context_used: boolean;
  project_id: string | null;
  has_instructions: boolean;
  enhanced: boolean; // Whether AI successfully enhanced the content
  rate_limit: RateLimit;
}

export interface FeatureUsage {
  count: number;
  limit: number;
  remaining: number;
}

export interface AIUsage {
  enhance_description: FeatureUsage;
  generate_description: FeatureUsage;
}

export interface AIUsageResponse {
  usage: AIUsage;
  limits?: {
    generate_description: number;
    enhance_description: number;
  };
  reset_time?: string;
}