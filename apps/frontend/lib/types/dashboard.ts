// Dashboard Stats
export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  active_projects: number;
  completion_rate: number;
  team_members: number;
  active_members: number;
}

// Recent Tasks
export interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: string;
  assignee: string;
  project_color: string;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Active Projects
export interface ActiveProject {
  id: string;
  name: string;
  description: string;
  color: string;
  status: string;
  members_count: number;
  total_tasks: number;
  completed_tasks: number;
  progress: number;
  display_status: string;
  end_date: string | null;
  created_at: string | null;
}

// Upcoming Deadlines
export interface UpcomingDeadline {
  title: string;
  date: string;
  type: string;
  priority: string;
  project_name: string;
}

// Recent Activity
export interface RecentActivity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  item: string;
  time: string;
  created_at: string;
}

// Main Dashboard Response
export interface DashboardSummary {
  stats: DashboardStats;
  recent_tasks: RecentTask[];
  active_projects: ActiveProject[];
  upcoming_deadlines: UpcomingDeadline[];
  recent_activity: RecentActivity[];
}

// API Response Wrapper
export interface DashboardResponse {
  success: boolean;
  data: DashboardSummary;
}