export interface BoardColumn {
    id: string;
    name: string;
    position: number;
    color: string;
    task_limit: number | null;
}

export interface Board {
    id: string;
    name: string;
    project_id: string;
    columns: BoardColumn[];
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface BoardColumnStats {
  count: number;
  high_priority: number;
  urgent_priority: number;
  overdue: number;
}

export interface BoardStats {
  total_tasks: number;
  columns: {
    [column: string]: BoardColumnStats;
  };
  completion_rate: number;
  workflow_efficiency: {
    active_tasks: number;
    blocked_tasks: number;
    completed_tasks: number;
    canceled_tasks: number;
  };
}

export interface BoardWithStats {
  id: string;
  name: string;
  project_id: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  stats: BoardStats;
}

export interface ProjectBoardGroup {
  project: {
    id: string;
    name: string;
    archived: boolean;
    color: string;
  };
  boards: BoardWithStats[];
}

export interface ListBoardsByOrganizationResponse {
  active: ProjectBoardGroup[];
  archived: ProjectBoardGroup[];
}