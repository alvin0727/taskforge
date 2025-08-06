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
    avatar?: string;
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