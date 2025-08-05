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