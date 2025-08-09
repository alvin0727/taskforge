export interface SidebarProject {
    id: string;
    name: string;
    slug: string;
    color?: string;
    organization_id: string;
    task_count?: number;
}

export interface RequestCreateProject {
    organization_id: string;
    name: string;
    description?: string;
    color?: string;
    start_date?: string;
    end_date?: string;
}

export interface ProjectMember {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role?: string;
    status?: string;
    joined_at?: string;
}

// New interfaces for adding members
export interface AddProjectMemberRequest {
    organization_id: string;
    project_slug: string;
    member_ids: string[];
}

export interface AddProjectMemberResponse {
    message: string;
    data: {
        added: ProjectMember[];
        failed: Array<{
            member_id: string;
            reason: string;
        }>;
        summary: {
            total_processed: number;
            successfully_added: number;
            failed_to_add: number;
        };
    };
}

enum ProjectStatus {
    PLANNING = "planning",
    ACTIVE = "active",
    ON_HOLD = "on-hold",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}

export interface ListProjectQueryRequest {
    status?: ProjectStatus;
    archived?: boolean;
    limit?: number;
    offset?: number;
}

export interface ProjectStats {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    todo_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
}

export interface ProjectListItem {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    status: string;
    owner_id: string;
    members_count: number;
    stats: ProjectStats;
    created_at: string;
    updated_at: string;
}

export interface ProjectListResponse {
    projects: ProjectListItem[];
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
}

export interface ListProjectsAPIResponse {
    projects: ProjectListResponse;
    total: number;
}