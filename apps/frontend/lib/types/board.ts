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